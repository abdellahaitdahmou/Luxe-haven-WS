import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PATCH /api/bookings/[id]/reschedule
// Allows the property owner to change the dates of a confirmed booking.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { check_in_date, check_out_date } = await request.json();

        if (!check_in_date || !check_out_date) {
            return NextResponse.json({ error: "Both check_in_date and check_out_date are required" }, { status: 400 });
        }

        const newIn = new Date(check_in_date);
        const newOut = new Date(check_out_date);
        if (newOut <= newIn) {
            return NextResponse.json({ error: "Check-out must be after check-in" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Verify ownership
        const { data: booking, error: fetchErr } = await supabase
            .from("bookings")
            .select("*, properties (id, title, owner_id, price_per_night)")
            .eq("id", id)
            .single();

        if (fetchErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        if (booking.properties?.owner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Recalculate total
        const nights = Math.ceil((newOut.getTime() - newIn.getTime()) / 86_400_000);
        const newTotal = nights * (booking.properties?.price_per_night ?? 0);

        // Check for conflicts (excluding current booking)
        const { data: conflicts } = await supabase
            .from("bookings")
            .select("id")
            .eq("property_id", booking.property_id)
            .neq("id", id)
            .neq("status", "cancelled")
            .lt("check_in_date", check_out_date)
            .gt("check_out_date", check_in_date);

        if (conflicts && conflicts.length > 0) {
            return NextResponse.json({ error: "Those dates conflict with another booking" }, { status: 409 });
        }

        const { error: updateErr } = await supabase
            .from("bookings")
            .update({ check_in_date, check_out_date, total_price: newTotal })
            .eq("id", id);

        if (updateErr) throw updateErr;

        // Notify the guest
        const checkInStr = newIn.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const checkOutStr = newOut.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        await supabase.from("notifications").insert({
            user_id: booking.guest_id,
            title: `📅 Dates Changed — ${booking.properties?.title}`,
            content: `Your host updated your stay to ${checkInStr} – ${checkOutStr}. New total: $${newTotal}.`,
            link: "/dashboard/trips",
            is_read: false,
        });

        return NextResponse.json({ success: true, nights, total_price: newTotal });
    } catch (error: any) {
        console.error("Reschedule error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
