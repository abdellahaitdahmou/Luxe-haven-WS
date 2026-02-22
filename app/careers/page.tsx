import { ChevronRight } from "lucide-react";

export default function CareersPage() {
    return (
        <div className="min-h-screen bg-black pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Join the Elite</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Join our team of luxury hospitality experts and help define the future of high-end travel and real estate.
                    </p>
                </div>

                <div className="space-y-16">
                    <section className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Why Luxe Haven?</h2>
                        <p className="text-gray-400 leading-relaxed text-lg max-w-3xl mx-auto">
                            We are building a culture of uncompromising excellence. At Luxe Haven, you will work alongside industry leaders, travel to extraordinary destinations, and shape digital luxury. We offer competitive compensation, global remote flexibility, and comprehensive wellness benefits.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-2xl font-bold text-white mb-6">Open Roles</h3>
                        <div className="space-y-4">
                            {[
                                { title: "Global Luxury Concierge", department: "Guest Experience", location: "Remote (European Timezones)", type: "Full-Time" },
                                { title: "Head of Property Acquisition", department: "Real Estate", location: "Dubai, UAE / Hybrid", type: "Full-Time" },
                                { title: "Senior Product Designer", department: "Product & Engineering", location: "Remote", type: "Full-Time" },
                                { title: "VIP Client Success Manager", department: "Sales", location: "London, UK", type: "Full-Time" },
                            ].map((job, index) => (
                                <div key={index} className="group bg-white/5 border border-white/10 hover:border-gold-500/50 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer transition-all">
                                    <div>
                                        <h4 className="text-xl font-bold text-white group-hover:text-gold-500 transition-colors mb-2">{job.title}</h4>
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                            <span>{job.department}</span>
                                            <span>&bull;</span>
                                            <span>{job.location}</span>
                                            <span>&bull;</span>
                                            <span>{job.type}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gold-500 mt-4 md:mt-0 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
