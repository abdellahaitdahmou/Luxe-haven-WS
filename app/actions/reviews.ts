
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface SubmitReviewParams {
    bookingId: string;
    rating: number;
    comment: string;
    type: "property" | "guest";
    targetId: string;
}

export async function submitReview({ bookingId, rating, comment, type, targetId }: SubmitReviewParams) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Not authenticated" };
    }

    // 1. Verify Booking ownership and "1 hour after checkout" rule
    const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

    if (bookingError || !booking) {
        return { error: "Booking not found" };
    }

    // Check if user is part of the booking
    // Guest can review Property (Host) -> user.id === booking.guest_id
    // Host can review Guest -> user.id needs to be owner of property... fetching property to check owner

    let isAuthorized = false;

    if (type === "property") {
        if (booking.guest_id !== user.id) return { error: "Only the guest can review the property" };
        isAuthorized = true;
    } else if (type === "guest") {
        // Fetch property to check if current user is the owner
        const { data: property } = await supabase.from("properties").select("owner_id").eq("id", booking.property_id).single();
        if (!property || property.owner_id !== user.id) return { error: "Only the host can review the guest" };
        isAuthorized = true;
    }

    if (!isAuthorized) return { error: "Unauthorized" };

    // Check Time Constraint: Now > Checkout Date + 1 hour
    // checkout_date is DATE usually (YYYY-MM-DD). We assume checkout is at 11:00 AM local or something?
    // User said "1h of the checkout time". 
    // If check_out_date is just a date, we assume end of that day or specific time?
    // Standard hotel checkout is usually morning. 
    // Let's assume `check_out_date` at 00:00 UTC for calculation simplicity, or better:
    // If today is `check_out_date`, we need to wait until 1 hour passed?
    // A simple robust check: Can review on `check_out_date` after a certain time, or day after.
    // For now, let's allow it if Current Date >= Check Out Date (Simple).
    // User specifically asked "after 1h of the checkout time".
    // I will implementation a strict check against `check_out_date`.

    // Assuming checkout is 12:00 PM (noon) on checkout day.
    const checkoutTime = new Date(booking.check_out_date);
    checkoutTime.setHours(12, 0, 0, 0); // Set to noon
    const oneHourAfterCheckout = new Date(checkoutTime.getTime() + 60 * 60 * 1000); // +1 hour

    if (new Date() < oneHourAfterCheckout) {
        return { error: "You can only leave a review 1 hour after checkout time (1:00 PM)." };
    }

    // 2. Insert Review
    const reviewData = {
        booking_id: bookingId,
        reviewer_id: user.id,
        rating,
        comment,
        review_type: type,
        ...(type === 'property' ? { property_id: targetId } : { reviewee_id: targetId })
    };

    const { error: insertError } = await supabase
        .from("reviews")
        .insert(reviewData);

    if (insertError) {
        console.error("Review Insert Error:", insertError);
        return { error: insertError.message };
    }

    revalidatePath(`/properties/${booking.property_id}`);
    revalidatePath(`/users/${booking.guest_id}`);
    revalidatePath("/dashboard/bookings"); // Refresh booking list to show review submitted

    return { success: true };
}
