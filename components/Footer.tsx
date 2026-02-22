import Link from "next/link";
import { Facebook, Instagram, Twitter, Linkedin, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
    return (
        <footer className="bg-gray-200 border-t border-black/10 pt-20 pb-10 px-6 mt-auto text-black">
            <div className="max-w-7xl mx-auto">
                {/* Top Section: Branding & Newsletter */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                    {/* Branding */}
                    <div className="flex flex-col items-start">
                        <Link href="/" className="mb-6 inline-block">
                            <img
                                src="/logo.png"
                                alt="Luxe Haven Logo"
                                className="h-16 w-auto object-contain mix-blend-multiply"
                            />
                        </Link>
                        <p className="text-gray-600 text-sm max-w-md leading-relaxed mb-6 font-medium">
                            Experience the pinnacle of luxury hosting and travel. Discover the world&apos;s most exclusive stays, curated for the discerning traveler. Welcome to your Dream Home.
                        </p>
                        <div className="flex items-center gap-2 text-gold-600 text-sm font-bold bg-gold-500/10 px-4 py-2 rounded-full border border-gold-500/20">
                            <ShieldCheck className="w-4 h-4" /> Secure & Verified Stays
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-2 text-black">Join the Exclusive Club</h3>
                        <p className="text-gray-500 text-sm mb-6 font-medium">
                            Subscribe to receive handpicked property reveals and exclusive member-only offers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-grow">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="pl-12 bg-gray-50 border-gray-200 h-12 w-full text-black placeholder:text-gray-400 focus-visible:ring-gold-500"
                                />
                            </div>
                            <Button className="h-12 px-8 bg-black text-white hover:bg-gold-500 hover:text-black transition-colors font-bold whitespace-nowrap group rounded-md">
                                Subscribe
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-200 w-full mb-16" />

                {/* Middle Section: Navigation Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 text-black">
                    <div className="flex flex-col space-y-4">
                        <h4 className="font-bold mb-2 text-lg text-black">Properties</h4>
                        <Link href="/explore?type=villas" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Luxury Villas</Link>
                        <Link href="/explore?type=penthouses" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Penthouses</Link>
                        <Link href="/explore?type=chalets" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Mountain Chalets</Link>
                        <Link href="/explore?type=islands" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Private Islands</Link>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <h4 className="font-bold mb-2 text-lg text-black">Company</h4>
                        <Link href="/about" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">About Us</Link>
                        <Link href="/careers" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Careers</Link>
                        <Link href="/press" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Press & Media</Link>
                        <Link href="/contact" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Contact</Link>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <h4 className="font-bold mb-2 text-lg text-black">Support</h4>
                        <Link href="/help" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Help Center</Link>
                        <Link href="/trust" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Trust & Safety</Link>
                        <Link href="/cancellation" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Cancellation Options</Link>
                        <Link href="/accessibility" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Accessibility</Link>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <h4 className="font-bold mb-2 text-lg text-black">Experiences</h4>
                        <Link href="/experiences/chefs" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Private Chefs</Link>
                        <Link href="/experiences/chauffeurs" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Chauffeurs & Transport</Link>
                        <Link href="/experiences/yachts" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Yacht Charters</Link>
                        <Link href="/experiences/spa" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Spa & Wellness</Link>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Legal */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-0">
                        <p className="text-gray-500 text-sm font-medium">
                            &copy; {new Date().getFullYear()} Luxe Haven. All rights reserved.
                        </p>
                        <div className="hidden md:block w-1 h-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-4">
                            <Link href="/privacy" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Privacy</Link>
                            <Link href="/terms" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Terms</Link>
                            <Link href="/sitemap" className="text-gray-500 hover:text-gold-600 transition-colors text-sm font-medium">Sitemap</Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all shadow-sm">
                            <Facebook className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all shadow-sm">
                            <Instagram className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all shadow-sm">
                            <Twitter className="w-4 h-4" />
                        </Link>
                        <Link href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gold-500 hover:text-black hover:border-gold-500 transition-all shadow-sm">
                            <Linkedin className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
