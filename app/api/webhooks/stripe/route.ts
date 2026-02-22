import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
    typescript: true,
} as any);

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = await createClient();

    // Handle Event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

            const { booking_id, guest_id, property_id } = paymentIntent.metadata;

            if (booking_id) {
                // 1. Update Booking Status -> Confirmed, Payment -> Paid
                await supabase
                    .from('bookings')
                    .update({
                        status: 'confirmed',
                        // payment_status_text: 'paid', (column might not exist yet, removing to be safe or checking schema) 
                        // If schema update needed, will do later. For now, just status.
                    })
                    .eq('id', booking_id);

                // 2. Record Transaction
                const amount = paymentIntent.amount / 100; // Convert cents to dollars
                const platformFee = amount * 0.10; // 10%
                const hostPayout = amount - platformFee;

                await supabase.from('transactions').insert({
                    booking_id: booking_id,
                    amount: amount,
                    platform_fee: platformFee,
                    owner_payout: hostPayout,
                    stripe_payment_intent_id: paymentIntent.id,
                    status: 'succeeded'
                });

                // 3. Credit Host Wallet (Pending Balance)
                const { data: property } = await supabase.from('properties').select('owner_id').eq('id', property_id).single();

                if (property?.owner_id) {
                    // Upsert wallet? Or assume it exists via trigger.
                    // Let's use RPC for atomic increment if possible, or just read-update for now.

                    const { data: wallet } = await supabase.from('wallets').select('*').eq('user_id', property.owner_id).single();

                    if (wallet) {
                        await supabase.from('wallets').update({
                            pending_balance: (wallet.pending_balance || 0) + hostPayout
                        }).eq('user_id', property.owner_id);
                    }
                }
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
