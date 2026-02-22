import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

// Initialize Stripe with a placeholder key if env var is missing during build
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16',
} as any);

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Authenticate User
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { bookingId, propertyId, checkIn, checkOut, guests } = body;

        // 2. Fetch Property Details (Price, Fees) from DB 
        // In a real scenario, we MUST fetch price from DB to prevent frontend manipulation.
        const { data: property } = await supabase
            .from('properties')
            .select('price_per_night, cleaning_fee, owner_id')
            .eq('id', propertyId)
            .single();

        if (!property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        // Fetch daily prices for the range
        // Exclude checkout day from price accumulation
        const { data: dailyPrices } = await supabase
            .from('daily_prices')
            .select('date, price')
            .eq('property_id', propertyId)
            .gte('date', startDate.toISOString())
            .lt('date', endDate.toISOString());

        // 3. Calculate Total Price dynamically
        let nightPrice = 0;
        const current = new Date(startDate);
        const lastNight = new Date(endDate);
        lastNight.setDate(lastNight.getDate() - 1);

        const priceMap = new Map();
        if (dailyPrices) {
            dailyPrices.forEach(dp => {
                const d = new Date(dp.date).toISOString().split('T')[0];
                priceMap.set(d, dp.price);
            });
        }

        while (current <= lastNight) {
            const dateStr = current.toISOString().split('T')[0];
            if (priceMap.has(dateStr)) {
                nightPrice += priceMap.get(dateStr);
            } else {
                nightPrice += property.price_per_night;
            }
            current.setDate(current.getDate() + 1);
        }

        const cleaningFee = property.cleaning_fee || 0;
        const platformFee = (nightPrice + cleaningFee) * 0.10; // 10% Platform Fee (Hardcoded for now, or fetch from admin_settings)
        const totalAmount = nightPrice + cleaningFee + platformFee;

        // 4. Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalAmount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                booking_id: bookingId,
                guest_id: user.id,
                property_id: propertyId,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            totalAmount: totalAmount,
            breakdown: {
                nightPrice,
                cleaningFee,
                platformFee
            }
        });

    } catch (error: any) {
        console.error('Stripe Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
