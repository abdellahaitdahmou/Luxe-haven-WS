"use client";

import { useState } from "react";
import { Lock, Loader2, CheckCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function SecuritySection() {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Password Form State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const supabase = createClient();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password updated successfully");
            setIsChangingPassword(false);
            setPassword("");
            setConfirmPassword("");
        }
        setLoading(false);
    };

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-8 max-w-2xl">
            <h3 className="text-xl font-bold text-[var(--page-text)] mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold-500" />
                Privacy & Security
            </h3>

            <div className="space-y-6">
                <div className="pb-6 border-b border-[var(--card-border)]">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[var(--page-text)] font-medium">Change Password</p>
                            <p className="text-sm text-[var(--muted-text)]">Update your password to keep your account secure.</p>
                        </div>
                        {!isChangingPassword && (
                            <button
                                onClick={() => setIsChangingPassword(true)}
                                className="px-4 py-2 bg-[var(--surface-100)] hover:bg-[var(--surface-200)] text-[var(--page-text)] rounded-lg transition-colors border border-[var(--card-border)]"
                            >
                                Update
                            </button>
                        )}
                    </div>

                    {isChangingPassword && (
                        <form onSubmit={handleUpdatePassword} className="bg-[var(--surface-100)] p-6 rounded-lg border border-[var(--card-border)] space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muted-text)]">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3 text-[var(--page-text)] focus:border-gold-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-[var(--muted-text)]">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3 text-[var(--page-text)] focus:border-gold-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsChangingPassword(false)}
                                    className="px-4 py-2 text-[var(--muted-text)] hover:text-[var(--page-text)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[var(--page-text)] font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-[var(--muted-text)]">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="px-4 py-2 bg-[var(--surface-100)] hover:bg-[var(--surface-200)] text-[var(--muted-text)] rounded-lg transition-colors border border-[var(--card-border)] opacity-50 cursor-not-allowed">
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
}
