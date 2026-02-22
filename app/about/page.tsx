export default function AboutPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Redefining Luxury Travel</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Luxe Haven is a highly vetted, exclusive portfolio of the world's most extraordinary luxury properties. We do not accept public listings.
                    </p>
                </div>

                <div className="space-y-16">
                    <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                        <p className="text-gray-400 leading-relaxed text-lg">
                            We believe that true luxury lies in absolute exclusivity. Our mission is to provide discerning travelers with access to our private collection of unparalleled estates, offering an ecosystem where high-end design meets impeccable, white-glove service. Every property is directly managed to ensure a standard of perfection that cannot be found on public marketplaces.
                        </p>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-2xl font-bold text-gold-500 mb-4">The Luxe Haven Standard</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Every property on our platform undergoes a rigorous 150-point inspection covering architecture, amenities, and service quality. Only the top 1% of global luxury homes meet our criteria, ensuring that your stay is nothing short of perfection.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                            <h3 className="text-2xl font-bold text-gold-500 mb-4">Global Presence</h3>
                            <p className="text-gray-400 leading-relaxed">
                                From the sun-drenched cliffs of the Amalfi Coast to the vibrant heart of Marrakech, Luxe Haven provides access to ultra-exclusive estates, penthouses, and private islands in over 80 of the world&apos;s most desired destinations.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
