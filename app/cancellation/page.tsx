export default function CancellationPage() {
    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Cancellation Policies</h1>
                    <p className="text-xl text-[var(--muted-text)] max-w-2xl mx-auto leading-relaxed">
                        Flexible and transparent cancellation options designed to accommodate the dynamic schedules of the global elite.
                    </p>
                </div>

                <div className="space-y-8">
                    {[
                        { title: "Flexible Luxury", desc: "Full refund if canceled at least 14 days before check-in. 50% refund for cancellations made within 14 days." },
                        { title: "Moderate Luxury", desc: "Full refund if canceled at least 30 days before check-in. No refund for cancellations made within 30 days." },
                        { title: "Strict Luxury", desc: "For highly demanded exclusive states. 50% refund if canceled at least 60 days before check-in. No refunds thereafter." },
                    ].map((policy, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-start">
                            <div className="w-full md:w-1/3">
                                <h3 className="text-2xl font-bold text-gold-500">{policy.title}</h3>
                            </div>
                            <div className="w-full md:w-2/3">
                                <p className="text-[var(--muted-text)] text-lg leading-relaxed">{policy.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[var(--muted-text)] text-sm">Note: Extenuating circumstances (such as global travel bans) are reviewed on a case-by-case basis by our premium support team.</p>
                </div>
            </div>
        </div>
    );
}
