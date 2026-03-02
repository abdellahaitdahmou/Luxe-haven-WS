"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createBookingRequest({
    propertyId,
    checkIn,
    checkOut,
    guests = 1
}: {
    propertyId: string,
    checkIn: string | Date,
    checkOut: string | Date,
    guests?: number
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("You must be logged in to book.");

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (startDate >= endDate) throw new Error("Check-out date must be after check-in date.");

    // 1. Check for availability
    const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('property_id', propertyId)
        .neq('status', 'cancelled')
        .lt('check_in_date', endDate.toISOString().split('T')[0])
        .gt('check_out_date', startDate.toISOString().split('T')[0]);

    if (conflictError) throw conflictError;
    if (conflicts && conflicts.length > 0) throw new Error("Dates are no longer available.");

    // 2. Fetch Property Price
    const { data: property } = await supabase
        .from('properties')
        .select('price_per_night, title, owner_id')
        .eq('id', propertyId)
        .single();

    if (!property) throw new Error("Property not found");

    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedTotal = nights * (property.price_per_night || 0);

    // 3. Create Booking
    const { data: booking, error: insertError } = await supabase
        .from('bookings')
        .insert({
            property_id: propertyId,
            guest_id: user.id,
            check_in_date: startDate.toISOString().split('T')[0],
            check_out_date: endDate.toISOString().split('T')[0],
            total_price: estimatedTotal,
            status: 'pending'
        })
        .select()
        .single();

    if (insertError) throw insertError;

    // 4. Conversation & Message
    try {
        if (property.owner_id) {
            const { data: conv } = await supabase
                .from('conversations')
                .upsert({
                    property_id: propertyId,
                    guest_id: user.id,
                    owner_id: property.owner_id,
                }, { onConflict: 'property_id,guest_id,owner_id' })
                .select()
                .single();

            if (conv) {
                const dateIn = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const dateOut = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                await supabase.rpc('send_message', {
                    p_conversation_id: conv.id,
                    p_content: `I would like to book this property from ${dateIn} to ${dateOut}.`,
                    p_message_type: 'reservation_request',
                    p_booking_id: booking.id
                });
            }
        }
    } catch (msgErr) {
        console.error("Automated message error:", msgErr);
    }

    // 5. Notify Owner
    try {
        const dateIn = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dateOut = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const { data: guestProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

        await supabase.from("notifications").insert({
            user_id: property.owner_id,
            title: `🏠 New Booking Request — ${property.title}`,
            content: `${guestProfile?.full_name ?? "A guest"} has requested a stay from ${dateIn} to ${dateOut}.`,
            is_read: false,
            link: "/dashboard/bookings",
        });
    } catch (notifErr) {
        console.error("Notification error:", notifErr);
    }

    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard/bookings");
    return { success: true, bookingId: booking.id };
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Fetch booking
    const { data: booking, error: fetchErr } = await supabase
        .from("bookings")
        .select("*, properties (id, title, owner_id)")
        .eq("id", bookingId)
        .single();

    if (fetchErr || !booking) throw new Error("Booking not found");
    if (booking.properties?.owner_id !== user.id) throw new Error("Forbidden");
    if (booking.status !== "pending") throw new Error("Only pending bookings can be updated.");

    // Update status
    const { error: updateErr } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

    if (updateErr) throw updateErr;

    // Notify guest
    try {
        const isAccepted = status === "confirmed";
        const checkIn = new Date(booking.check_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const checkOut = new Date(booking.check_out_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

        await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            title: isAccepted
                ? `✅ Booking Accepted — ${booking.properties?.title}`
                : `❌ Booking Declined — ${booking.properties?.title}`,
            content: isAccepted
                ? `Your stay from ${checkIn} to ${checkOut} has been confirmed!`
                : `Unfortunately your request for ${checkIn} – ${checkOut} was declined.`,
            link: "/dashboard/trips",
            is_read: false,
        });

        // Post chat message
        const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('property_id', booking.property_id)
            .eq('guest_id', booking.guest_id)
            .single();

        if (conv) {
            const messageContent = isAccepted
                ? `Reservation confirmed for ${checkIn} – ${checkOut}.`
                : `Reservation declined for ${checkIn} – ${checkOut}.`;

            await supabase.rpc('send_message', {
                p_conversation_id: conv.id,
                p_content: messageContent,
                p_message_type: 'message'
            });
        }
    } catch (err) {
        console.error("Notification/Chat update error:", err);
    }

    revalidatePath(`/dashboard/messages`);
    revalidatePath(`/dashboard/bookings`);
    return { success: true };
}
