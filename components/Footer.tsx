import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
    return (
        <footer className="bg-[var(--card-bg)] border-t border-[var(--card-border)] pt-12 md:pt-20 pb-8 md:pb-10 px-4 md:px-6 mt-auto">
            <div className="max-w-7xl mx-auto">
                {/* Top Section: Branding & Newsletter */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-10 md:mb-16">
                    {/* Branding */}
                    <div className="flex flex-col items-start">
                        <Link href="/" className="mb-4 md:mb-6 inline-block">
                            <img
                                src="/logo.png"
                                alt="Luxe Haven Logo"
                                className="h-12 md:h-16 w-auto object-contain"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </Link>
                        <p className="text-[var(--muted-text)] text-sm max-w-md leading-relaxed mb-4 md:mb-6">
                            Experience the pinnacle of luxury hosting and travel. Discover the world&apos;s most exclusive stays, curated for the discerning traveler. Welcome to your Dream Home.
                        </p>
                        <div className="flex items-center gap-2 text-gold-600 text-sm font-bold bg-gold-500/10 px-4 py-2 rounded-full border border-gold-500/20">
                            <ShieldCheck className="w-4 h-4" /> Secure & Verified Stays
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="bg-[var(--surface-100)] border border-[var(--card-border)] shadow-sm rounded-2xl p-6 md:p-8 flex flex-col justify-center">
                        <h3 className="text-xl md:text-2xl font-bold mb-2">Join the Exclusive Club</h3>
                        <p className="text-[var(--muted-text)] text-sm mb-5 md:mb-6">
                            Subscribe to receive handpicked property reveals and exclusive member-only offers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-text)]" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="pl-12 h-12 w-full"
                                />
                            </div>
                            <Button className="h-12 px-6 md:px-8 bg-gold-500 text-black hover:bg-gold-400 transition-colors font-bold whitespace-nowrap group rounded-md">
                                Subscribe
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-[var(--card-border)] w-full mb-10 md:mb-16" />

                {/* Middle Section: Navigation Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-16">
                    <div className="flex flex-col space-y-3 md:space-y-4">
                        <h4 className="font-bold mb-1 text-base md:text-lg">Properties</h4>
                        <Link href="/explore?type=villas" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Luxury Villas</Link>
                        <Link href="/explore?type=penthouses" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Penthouses</Link>
                        <Link href="/explore?type=chalets" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Mountain Chalets</Link>
                        <Link href="/explore?type=islands" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Private Islands</Link>
                    </div>

                    <div className="flex flex-col space-y-3 md:space-y-4">
                        <h4 className="font-bold mb-1 text-base md:text-lg">Company</h4>
                        <Link href="/about" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">About Us</Link>
                        <Link href="/careers" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Careers</Link>
                        <Link href="/press" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Press & Media</Link>
                        <Link href="/contact" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Contact</Link>
                    </div>

                    <div className="flex flex-col space-y-3 md:space-y-4">
                        <h4 className="font-bold mb-1 text-base md:text-lg">Support</h4>
                        <Link href="/help" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Help Center</Link>
                        <Link href="/trust" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Trust & Safety</Link>
                        <Link href="/cancellation" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Cancellation Options</Link>
                        <Link href="/accessibility" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Accessibility</Link>
                    </div>

                    <div className="flex flex-col space-y-3 md:space-y-4">
                        <h4 className="font-bold mb-1 text-base md:text-lg">Experiences</h4>
                        <Link href="/experiences/chefs" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Private Chefs</Link>
                        <Link href="/experiences/chauffeurs" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Chauffeurs & Transport</Link>
                        <Link href="/experiences/yachts" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Yacht Charters</Link>
                        <Link href="/experiences/spa" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Spa & Wellness</Link>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-6 md:pt-8 border-t border-[var(--card-border)] gap-4">
                    <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                        <p className="text-[var(--muted-text)] text-sm">
                            &copy; {new Date().getFullYear()} Luxe Haven. All rights reserved.
                        </p>
                        <div className="hidden md:block w-1 h-1 bg-[var(--muted-text)] rounded-full opacity-30" />
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Privacy</Link>
                            <Link href="/terms" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Terms</Link>
                            <Link href="/sitemap" className="text-[var(--muted-text)] hover:text-gold-500 transition-colors text-sm">Sitemap</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                            <Link key={i} href="#" className="w-9 h-9 rounded-full bg-[var(--surface-100)] border border-[var(--card-border)] flex items-center justify-center text-[var(--muted-text)] hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all">
                                <Icon className="w-4 h-4" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
