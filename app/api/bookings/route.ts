import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'You must be logged in to book.' }, { status: 401 });
        }

        const body = await request.json();
        const { propertyId, checkIn, checkOut, guests } = body;

        if (!propertyId || !checkIn || !checkOut) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const startDate = new Date(checkIn);
        const endDate = new Date(checkOut);

        if (startDate >= endDate) {
            return NextResponse.json({ error: 'Check-out date must be after check-in date' }, { status: 400 });
        }

        // 1. Check for availability (Race Condition Handling)
        // We look for any booking that overlaps with our requested range.
        // Overlap logic: (RequestStart < ExistingEnd) AND (RequestEnd > ExistingStart)
        // We also exclude cancelled bookings.
        const { data: conflicts, error: conflictError } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', propertyId)
            .neq('status', 'cancelled')
            .lt('check_in_date', endDate.toISOString())
            .gt('check_out_date', startDate.toISOString());

        if (conflictError) {
            throw conflictError;
        }

        if (conflicts && conflicts.length > 0) {
            return NextResponse.json({ error: 'Dates are no longer available.' }, { status: 409 });
        }

        // 2. Fetch Property Price to calculate initial total (Backend Validation)
        // Note: For pending booking, we can store an estimated price, but the real price logic for payment 
        // will be re-calculated in the Payment Intent API to be safe. 
        // For now, let's just create the booking record with basic info.

        const { data: property } = await supabase
            .from('properties')
            .select('price_per_night') // We might want dynamic pricing check here too, but let's keep it simple for insertion
            .eq('id', propertyId)
            .single();

        if (!property) throw new Error("Property not found");

        const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const estimatedTotal = nights * property.price_per_night; // This is naive, but okay for 'pending'

        // 3. Create Booking
        const { data: booking, error: insertError } = await supabase
            .from('bookings')
            .insert({
                property_id: propertyId,
                user_id: user.id,
                check_in_date: startDate.toISOString(),
                check_out_date: endDate.toISOString(),
                guests: guests || 1,
                total_price: estimatedTotal,
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({ bookingId: booking.id });

    } catch (error: any) {
        console.error('Booking Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
