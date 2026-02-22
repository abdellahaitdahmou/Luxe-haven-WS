export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Accessibility</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Luxe Haven is committed to ensuring digital accessibility and inclusive travel experiences for all guests.
                    </p>
                </div>

                <div className="space-y-12">
                    <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-white mb-6">Inclusive Luxury</h2>
                        <p className="text-gray-400 leading-relaxed max-w-3xl">
                            We are continuously improving the user experience for everyone, and applying the relevant accessibility standards. Our goal is to ensure that our website and platform are accessible to the widest possible audience, regardless of technology or ability.
                        </p>
                        <ul className="mt-8 space-y-4">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-gold-500" />
                                <span>WCAG 2.1 AA Compliance targets for our digital products.</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-gold-500" />
                                <span>Property filtering includes verified accessibility features (e.g., step-free access, wide doorways).</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-2 h-2 rounded-full bg-gold-500" />
                                <span>Dedicated accessibility concierge assistance for bespoke travel arrangements.</span>
                            </li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
