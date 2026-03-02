export default function SpaPage() {
    return (
        <div className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Spa & Wellness</h1>
                <p className="text-xl text-[var(--muted-text)]">
                    Bespoke wellness treatments and in-villa spa therapies for ultimate relaxation.
                </p>
                <div className="mt-12 p-8 border border-white/10 rounded-2xl bg-white/5">
                    <p className="text-[var(--muted-text)]">Wellness packages coming soon...</p>
                </div>
            </div>
        </div>
    );
}
