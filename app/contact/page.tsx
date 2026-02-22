"use client"

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, MapPin, Phone, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`https://formspree.io/f/${process.env.NEXT_PUBLIC_FORMSPREE_ID}`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setIsSuccess(true);
            } else {
                alert("Something went wrong. Please try again.");
            }
        } catch (error) {
            alert("Error sending message. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Get in <span className="text-gold-500">Touch</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                            Have questions about listing your property or booking a stay? Our dedicated team is here to assist you 24/7.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center shrink-0 text-gold-500">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Email Us</h3>
                                    <p className="text-gray-400">ahmed505ait@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center shrink-0 text-gold-500">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Call Us</h3>
                                    <p className="text-gray-400">+212 682 192 641</p>
                                    <p className="text-gray-500 text-sm mt-1">Mon-Fri from 8am to 8pm</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center shrink-0 text-gold-500">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">Visit Our Office</h3>
                                    <p className="text-gray-400">N°05 2ème étage Lot 33 Haut Founty</p>
                                    <p className="text-gray-400">Av Laayoune Bensergao, Agadir</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-surface-50 border border-white/5 p-8 md:p-10 rounded-3xl shadow-2xl">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">First Name</label>
                                        <input name="firstName" required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-400">Last Name</label>
                                        <input name="lastName" required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Email Address</label>
                                    <input name="email" required type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-400">Message</label>
                                    <textarea name="message" required rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold-500 outline-none transition"></textarea>
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full bg-gold-500 hover:bg-gold-600 text-black font-bold py-4 rounded-xl transition shadow-lg shadow-gold-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Message"
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-6">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                                <p className="text-gray-400 mb-8">Thank you for reaching out. We&apos;ve received your message via Formspree.</p>
                                <button
                                    onClick={() => setIsSuccess(false)}
                                    className="text-gold-500 hover:underline font-semibold"
                                >
                                    Send another message
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
            <Footer />
        </main>
    );
}
