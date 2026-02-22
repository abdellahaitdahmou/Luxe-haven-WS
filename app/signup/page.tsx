"use client"

import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`
                    }
                }
            });

            if (error) {
                setError(error.message);
                return;
            }

            // Successful signup
            setSuccess(true);

        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center min-h-[80vh]">
                <div className="w-full max-w-md">
                    {success ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h1 className="text-3xl font-bold mb-3">Account Created!</h1>
                            <p className="text-gray-400 mb-8">Welcome to Luxe Haven. Check your email to confirm your account if required, then log in to explore our properties.</p>
                            <Link href="/login" className="inline-block bg-gold-500 hover:bg-gold-400 text-black font-bold px-8 py-3 rounded-full transition">
                                Sign In Now
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
                                <p className="text-gray-400">Join Luxe Haven to book or host luxury stays</p>
                            </div>

                            <div className="bg-surface-50 border border-white/5 p-8 rounded-3xl shadow-2xl">
                                <form onSubmit={handleSignup} className="space-y-6">
                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                                            {error}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">First Name</label>
                                            <input
                                                type="text"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                placeholder="John"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition placeholder-gray-600"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-400">Last Name</label>
                                            <input
                                                type="text"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                placeholder="Doe"
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition placeholder-gray-600"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Email Address</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition placeholder-gray-600"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition placeholder-gray-600"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <button
                                        disabled={loading}
                                        className="w-full bg-gold-500 text-black font-bold py-3 rounded-xl hover:bg-gold-600 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                Get Started <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-gray-500 text-sm mt-8">
                                    Already have an account? <Link href="/login" className="text-gold-500 hover:underline font-semibold">Log in</Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
