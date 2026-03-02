import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// PATCH /api/bookings/[id]/confirm
// Bypasses payment and marks booking as confirmed (TEST MODE ONLY)
export async function PATCH(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow the guest who made the booking to confirm it
        const { data: booking } = await supabase
            .from("bookings")
            .select("id, guest_id, status")
            .eq("id", id)
            .single();

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.guest_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (booking.status === "cancelled") {
            return NextResponse.json({ error: "Cannot confirm a cancelled booking" }, { status: 400 });
        }

        const { error } = await supabase
            .from("bookings")
            .update({ status: "confirmed" })
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Confirm booking error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
