import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PATCH /api/bookings/[id]/status
// Called by host to accept or decline a booking request.
// Sends a notification to the traveler with the host's decision.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status } = await request.json();

        if (!["confirmed", "cancelled"].includes(status)) {
            return NextResponse.json({ error: "Invalid status. Must be 'confirmed' or 'cancelled'." }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch the booking with property + guest info
        const { data: booking, error: fetchErr } = await supabase
            .from("bookings")
            .select("*, properties (id, title, owner_id)")
            .eq("id", id)
            .single();

        if (fetchErr || !booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Only the property owner can accept/decline
        if (booking.properties?.owner_id !== user.id) {
            return NextResponse.json({ error: "Forbidden — you are not the owner of this property" }, { status: 403 });
        }

        if (booking.status !== "pending") {
            return NextResponse.json({ error: "Only pending bookings can be accepted or declined" }, { status: 400 });
        }

        // Update booking status
        const { error: updateErr } = await supabase
            .from("bookings")
            .update({ status })
            .eq("id", id);

        if (updateErr) throw updateErr;

        // ── Notify the traveler (guest) ────────────────────────────────────────
        const isAccepted = status === "confirmed";
        const checkIn = new Date(booking.check_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const checkOut = new Date(booking.check_out_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

        await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            title: isAccepted
                ? `✅ Booking Accepted — ${booking.properties?.title}`
                : `❌ Booking Declined — ${booking.properties?.title}`,
            content: isAccepted
                ? `Your stay from ${checkIn} to ${checkOut} has been confirmed by the host. See you there!`
                : `Unfortunately your request for ${checkIn} – ${checkOut} was declined by the host.`,
            link: "/dashboard/trips",
            is_read: false,
        });

        // ── Post a message in the chat (Airbnb-style) ────────────────────────
        try {
            // Find or create conversation
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
                    p_message_type: 'message' // Send as a regular system message
                });
            }
        } catch (chatError) {
            console.error("Failed to post status update message:", chatError);
        }

        return NextResponse.json({ success: true, status });

    } catch (error: any) {
        console.error("Booking status update error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
