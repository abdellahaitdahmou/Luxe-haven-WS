import { ShieldCheck, Lock, Headset } from "lucide-react";

export default function TrustSafetyPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Trust & Safety</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Your security and peace of mind are our highest priorities. Discover how we protect the Luxe Haven community.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Rigorous Guest Verification",
                            desc: "To maintain the sanctity of our estates, every guest undergoes a discreet but comprehensive identity verification before their booking is confirmed."
                        },
                        {
                            icon: Lock,
                            title: "Secure Encrypted Booking",
                            desc: "All transactions are processed through enterprise-grade encrypted channels, ensuring your financial information and travel plans remain strictly confidential."
                        },
                        {
                            icon: Headset,
                            title: "24/7 Premium Support",
                            desc: "Our dedicated Trust & Safety concierge team is available around the clock to assist with any concerns, anywhere in the world."
                        }
                    ].map((feature, index) => (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-gold-500/30 transition-colors">
                            <div className="w-14 h-14 bg-gold-500/10 rounded-full flex items-center justify-center mb-6">
                                <feature.icon className="w-7 h-7 text-gold-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
