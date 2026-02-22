"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
            <div className="text-center space-y-6 max-w-md">
                <CheckCircle className="w-24 h-24 text-gold-500 mx-auto" />
                <h1 className="text-4xl font-bold">Payment Successful!</h1>
                <p className="text-gray-400">
                    Your booking has been confirmed. You will receive a confirmation email shortly.
                </p>
                <div className="flex gap-4 justify-center">
                    <Link href="/dashboard/trips">
                        <Button className="bg-surface-100 hover:bg-surface-200 text-white border border-white/10">
                            View My Trips
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button className="bg-gold-500 text-black hover:bg-gold-600">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
