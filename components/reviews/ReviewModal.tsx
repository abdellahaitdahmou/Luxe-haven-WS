
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/reviews/StarRating";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { submitReview } from "@/app/actions/reviews";

interface ReviewModalProps {
    bookingId: string;
    propertyName?: string; // If reviewing property
    guestName?: string; // If reviewing guest
    type: "property" | "guest";
    targetId: string; // property_id or guest_id
}

export function ReviewModal({ bookingId, propertyName, guestName, type, targetId }: ReviewModalProps) {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setLoading(true);
        // Mock submission for now until action is created
        console.log("Submitting review:", { bookingId, rating, comment, type, targetId });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast.success("Review submitted successfully!");
        setOpen(false);
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-gold-500/50 text-gold-500 hover:bg-gold-500/10">
                    Write a Review
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface-100 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Review {type === 'property' ? propertyName : guestName}</DialogTitle>
                    <DialogDescription>
                        Share your experience with {type === 'property' ? 'this property' : 'this guest'}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-2 mb-4">
                        <Label>Rate your experience</Label>
                        <StarRating rating={rating} setRating={setRating} size="lg" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comments</Label>
                        <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell us what you liked or what could be improved..."
                            className="bg-surface-50 border-white/10 min-h-[100px]"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-gold-500 text-black hover:bg-gold-400" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Submit Review
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
