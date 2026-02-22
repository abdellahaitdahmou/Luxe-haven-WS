import { createClient } from "@/utils/supabase/server"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { HeroSection } from "@/components/HeroSection"
import { Star, Shield, Home as HomeIcon, TrendingUp, MapPin, Bed, Bath, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

async function getFeaturedProperties() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("properties")
      .select("id, title, address, price_per_night, image_urls, bedrooms, bathrooms, max_guests")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(6)
    return data || []
  } catch {
    return []
  }
}

export default async function Home() {
  const featuredProperties = await getFeaturedProperties()
  const hasProperties = featuredProperties.length > 0

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-gold-500 selection:text-black">
      <Navbar />

      {/* HERO SECTION */}
      <HeroSection />

      {/* KEY FEATURES SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto -mt-20 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-50 border border-white/5 p-8 rounded-2xl hover:border-gold-500/30 transition group">
            <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 text-gold-500 group-hover:text-black transition">
              <HomeIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Luxury Properties</h3>
            <p className="text-gray-400 text-sm">Explore our curated selection of premium properties across Morocco and beyond.</p>
          </div>
          <div className="bg-surface-50 border border-white/5 p-8 rounded-2xl hover:border-gold-500/30 transition group">
            <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 text-gold-500 group-hover:text-black transition">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Secure Booking</h3>
            <p className="text-gray-400 text-sm">Every booking is protected. Pay safely with full transparency and peace of mind.</p>
          </div>
          <div className="bg-surface-50 border border-white/5 p-8 rounded-2xl hover:border-gold-500/30 transition group">
            <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-500 text-gold-500 group-hover:text-black transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premium Experiences</h3>
            <p className="text-gray-400 text-sm">From private chefs to yacht charters — elevate every aspect of your stay.</p>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-2">Our Portfolio</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {hasProperties ? "Featured Properties" : "Discover Luxury"}
            </h2>
            <p className="text-gray-400">
              {hasProperties
                ? "Handpicked selection of our finest stays."
                : "Exclusive stays curated for the discerning traveler."}
            </p>
          </div>
          {hasProperties && (
            <Link href="/explore" className="text-gold-500 hover:text-gold-400 font-semibold flex items-center gap-2 transition group">
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {hasProperties ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property: any) => {
              const image = property.image_urls?.[0]
              const location = property.address || "Morocco"
              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group block bg-surface-50 border border-white/5 rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                >
                  <div className="relative h-52 overflow-hidden bg-gray-900">
                    {image ? (
                      <img
                        src={image}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <HomeIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Rating badge — only if available */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10">
                      <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                      New
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-gold-400 transition line-clamp-1">{property.title}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </p>
                    <div className="flex items-center gap-3 text-gray-500 text-sm mb-4">
                      {property.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms}</span>}
                      {property.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>}
                      {property.max_guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{property.max_guests}</span>}
                    </div>
                    <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold text-lg">${property.price_per_night}</span>
                        <span className="text-gray-500 text-sm"> / night</span>
                      </div>
                      <span className="text-xs text-gold-500 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* Empty state — no properties yet */
          <div className="text-center py-20 bg-surface-50 border border-white/5 rounded-3xl">
            <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <HomeIcon className="w-10 h-10 text-gold-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Properties Coming Soon</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              We're preparing our exclusive portfolio. Sign up to be notified when our first properties go live.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup" className="bg-gold-500 hover:bg-gold-400 text-black font-semibold px-8 py-3 rounded-full transition">
                Get Notified
              </Link>
              <Link href="/contact" className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3 rounded-full transition">
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 px-6 bg-white/2">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-2">Why Luxe Haven</p>
            <h2 className="text-3xl md:text-4xl font-bold">The Standard of Luxury</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: "100%", label: "Verified Properties", sub: "Every listing is personally vetted" },
              { value: "24/7", label: "Concierge Support", sub: "Always available for your needs" },
              { value: "5★", label: "Luxury Standard", sub: "Only the finest accommodations" },
              { value: "0%", label: "Hidden Fees", sub: "Transparent pricing always" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-gold-500 mb-2">{stat.value}</div>
                <div className="font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-gray-500 text-sm">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Experience Luxury?</h2>
          <p className="text-gray-400 mb-8 text-lg">Browse our handpicked properties and find your perfect stay.</p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-bold px-10 py-4 rounded-full text-lg transition shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)]"
          >
            Explore Properties <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
