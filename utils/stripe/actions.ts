"use server"

import { stripe } from './server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(bookingId: string) {
    const supabase = await createClient()

    // 1. Fetch booking details
    // Note: Using a join or separate queries. Here we assume booking has price. 
    // In a real app we'd recalculate specifically to be safe, but for this demo we use stored booking total.
    const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, properties(*, profiles(*))') // Fetch property and owner
        .eq('id', bookingId)
        .single()

    if (bookingError || !booking) {
        throw new Error('Booking not found')
    }

    const property = booking.properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const owner = (property as any).profiles

    if (!owner.stripe_account_id) {
        throw new Error('Owner has not connected Stripe')
    }

    // 2. Calculate Fees
    const totalAmount = parseFloat(booking.total_price) // Assuming stored as string/decimal
    const hostFeePercent = owner.host_fee_percent || 10.0
    const platformFee = Math.round(totalAmount * (hostFeePercent / 100) * 100) // in cents
    const totalInCents = Math.round(totalAmount * 100)

    // 3. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Booking for ${property.title}`,
                        description: `Stay from ${booking.check_in_date} to ${booking.check_out_date}`,
                        images: property.image_urls ? [property.image_urls[0]] : [],
                    },
                    unit_amount: totalInCents,
                },
                quantity: 1,
            },
        ],
        payment_intent_data: {
            application_fee_amount: platformFee, // The platform's cut
            transfer_data: {
                destination: owner.stripe_account_id, // The owner's connected account ID
            },
            metadata: {
                bookingId: booking.id,
            },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${booking.id}`,
    })

    // 4. Redirect to Checkout
    if (session.url) {
        redirect(session.url)
    }
}
