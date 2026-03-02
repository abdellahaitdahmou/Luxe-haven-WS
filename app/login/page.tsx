"use client"

import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setError(error.message);
                return;
            }

            // 3. Successful login - Check Role for Redirect
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user?.id)
                .single();

            const role = profile?.role || 'guest';

            if (role === 'admin' || role === 'owner') {
                router.push('/admin/properties');
            } else {
                router.push('/dashboard'); // Travelers go to dashboard
            }
            router.refresh();
            router.refresh();

        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)] font-sans selection:bg-gold-500 selection:text-black transition-colors duration-300">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex items-center justify-center min-h-[80vh]">
                <div className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                        <p className="text-[var(--muted-text)]">Sign in to manage your bookings or listings</p>
                    </div>

                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 md:p-8 rounded-3xl shadow-2xl">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--muted-text)]">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-[var(--surface-100)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--page-text)] focus:border-gold-500 outline-none transition placeholder-gray-500"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-semibold text-[var(--muted-text)]">Password</label>
                                    <a href="#" className="text-xs text-gold-500 hover:underline">Forgot?</a>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--surface-100)] border border-[var(--card-border)] rounded-xl px-4 py-3 text-[var(--page-text)] focus:border-gold-500 outline-none transition placeholder-gray-500"
                                    required
                                />
                            </div>

                            <button
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[var(--card-bg)] px-2 text-[var(--muted-text)]">Or continue with</span>
                                </div>
                            </div>

                            <button type="button" className="w-full bg-[var(--surface-100)] border border-[var(--card-border)] text-[var(--page-text)] font-semibold py-3 rounded-xl hover:opacity-80 transition">
                                Google
                            </button>

                        </form>

                        <p className="text-center text-[var(--muted-text)] text-sm mt-8">
                            Don&apos;t have an account? <Link href="/signup" className="text-gold-500 hover:underline font-semibold">Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
