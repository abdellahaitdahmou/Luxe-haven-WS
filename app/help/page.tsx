import { Navbar } from "@/components/Navbar";
import { Search } from "lucide-react";

export default function HelpPage() {
    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
                    How can we <span className="text-gold-500">help?</span>
                </h1>

                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto mb-16">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for articles..."
                        className="w-full bg-surface-50 border border-white/10 rounded-full pl-12 pr-6 py-4 text-white focus:border-gold-500 outline-none transition shadow-lg"
                    />
                </div>

                {/* Categories */}
                <div className="bg-surface-50 border border-white/5 rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>

                    <div className="space-y-6">
                        {[
                            "How do I list my property?",
                            "What are the fees for hosting?",
                            "How does the verification process work?",
                            "Can I cancel a booking?",
                            "Is my payment information secure?"
                        ].map((question, i) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="flex justify-between items-center py-4 border-b border-white/5">
                                    <h3 className="font-medium text-gray-300 group-hover:text-gold-500 transition">{question}</h3>
                                    <span className="text-gray-500 group-hover:text-gold-500">+</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
