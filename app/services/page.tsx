import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Star, Key, Camera } from "lucide-react";

export default function ServicesPage() {
    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">
                    Our Premium <span className="text-gold-500">Services</span>
                </h1>
                <p className="text-gray-400 text-center max-w-2xl mx-auto mb-20 text-lg">
                    At Luxe Haven, we offer more than just a place to stay. Experience a full suite of concierge and property management services designed for the elite.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Service 1 */}
                    <div className="bg-surface-50 border border-white/5 p-8 rounded-3xl hover:border-gold-500/30 transition group">
                        <div className="w-14 h-14 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-gold-500 group-hover:text-black transition">
                            <Shield className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Property Management</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Comprehensive management for property owners. We handle everything from guest vetting and check-ins to professional cleaning and maintenance.
                        </p>
                    </div>

                    {/* Service 2 */}
                    <div className="bg-surface-50 border border-white/5 p-8 rounded-3xl hover:border-gold-500/30 transition group">
                        <div className="w-14 h-14 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-gold-500 group-hover:text-black transition">
                            <Star className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Concierge Services</h3>
                        <p className="text-gray-400 leading-relaxed">
                            24/7 concierge support for guests. Need a private chef, yacht charter, or exclusive event access? Our team makes it happen.
                        </p>
                    </div>

                    {/* Service 3 */}
                    <div className="bg-surface-50 border border-white/5 p-8 rounded-3xl hover:border-gold-500/30 transition group">
                        <div className="w-14 h-14 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-gold-500 group-hover:text-black transition">
                            <Camera className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Professional Photography</h3>
                        <p className="text-gray-400 leading-relaxed">
                            World-class photography and videography to showcase your property's best features and attract high-value bookings.
                        </p>
                    </div>

                    {/* Service 4 */}
                    <div className="bg-surface-50 border border-white/5 p-8 rounded-3xl hover:border-gold-500/30 transition group">
                        <div className="w-14 h-14 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 text-gold-500 group-hover:bg-gold-500 group-hover:text-black transition">
                            <Key className="w-7 h-7" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Secure Key Exchange</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Seamless and secure entry for guests using smart lock technology and in-person greetings for a VIP arrival experience.
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
