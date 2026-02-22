import { Download, ArrowRight } from "lucide-react";

export default function PressPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Press & Media</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Latest news, exclusive releases, and media resources for Luxe Haven.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Media Kit & Branding</h2>
                            <p className="text-gray-400">Download high-resolution logos, executive bios, and premium brand assets.</p>
                        </div>
                        <button className="flex items-center gap-2 bg-gold-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors whitespace-nowrap">
                            <Download className="w-5 h-5" /> Download Media Kit
                        </button>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-6">Latest Announcements</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { date: "November 12, 2026", title: "Luxe Haven Expands Exclusive Portfolio into the French Riviera", desc: "Adding 150 highly vetted ultra-luxury estates to our prestigious private collection." },
                                { date: "September 04, 2026", title: "Introducing Signature Concierge Experiences", desc: "Setting a new industry standard with in-house private chefs and superyacht charters." },
                                { date: "June 22, 2026", title: "Luxe Haven Secures Series B Funding to Fuel Global Expansion", desc: "Partnering with top-tier VCs to redefine exclusive luxury travel." },
                            ].map((news, i) => (
                                <div key={i} className="group border-b border-white/10 pb-6 cursor-pointer">
                                    <span className="text-gold-500 text-sm font-bold tracking-wider uppercase mb-2 block">{news.date}</span>
                                    <h4 className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors mb-2">{news.title}</h4>
                                    <p className="text-gray-400 mb-4">{news.desc}</p>
                                    <span className="text-sm text-gold-500 flex items-center gap-1 font-medium group-hover:gap-2 transition-all">
                                        Read Full Release <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
