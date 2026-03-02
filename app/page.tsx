import { createClient } from "@/utils/supabase/server"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { HeroSection } from "@/components/HeroSection"
import { Star, Shield, Home as HomeIcon, TrendingUp, MapPin, Bed, Bath, Users, ArrowRight } from "lucide-react"
import { AnimatedStats } from "@/components/AnimatedStats"
import Link from "next/link"

async function getFeaturedProperties() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("properties")
      .select("id, title, address, price_per_night, image_urls, bedrooms, bathrooms, max_guests, listing_type, price_type")
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
    <main className="min-h-screen bg-[var(--page-bg)] text-[var(--page-text)] font-sans selection:bg-gold-500 selection:text-black transition-colors duration-300">
      <Navbar />

      {/* HERO SECTION */}
      <HeroSection />

      {/* KEY FEATURES SECTION */}
      <section className="py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto -mt-10 md:-mt-20 relative z-30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: <HomeIcon className="w-6 h-6" />, title: "Luxury Properties", desc: "Explore our curated selection of premium properties across Morocco and beyond." },
            { icon: <Shield className="w-6 h-6" />, title: "Secure Booking", desc: "Every booking is protected. Pay safely with full transparency and peace of mind." },
            { icon: <TrendingUp className="w-6 h-6" />, title: "Premium Experiences", desc: "From private chefs to yacht charters — elevate every aspect of your stay." },
          ].map((feat) => (
            <div key={feat.title} className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 md:p-8 rounded-2xl hover:border-gold-500/30 transition group">
              <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-gold-500 text-gold-500 group-hover:text-black transition">
                {feat.icon}
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2">{feat.title}</h3>
              <p className="text-[var(--muted-text)] text-sm">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-12 md:py-20 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8 md:mb-12">
          <div>
            <p className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-2">Our Portfolio</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-4">
              {hasProperties ? "Featured Properties" : "Discover Luxury"}
            </h2>
            <p className="text-[var(--muted-text)] text-sm md:text-base">
              {hasProperties
                ? "Handpicked selection of our finest stays."
                : "Exclusive stays curated for the discerning traveler."}
            </p>
          </div>
          {hasProperties && (
            <Link href="/explore" className="text-gold-500 hover:text-gold-400 font-semibold flex items-center gap-2 transition group shrink-0">
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {hasProperties ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {featuredProperties.map((property: any) => {
              const image = property.image_urls?.[0]
              const location = property.address || "Morocco"
              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                >
                  <div className="relative h-48 md:h-52 overflow-hidden bg-gray-900">
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
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-on-dark text-xs font-semibold px-2.5 py-1 rounded-full border border-[var(--card-border)]">
                        <Star className="w-3 h-3 fill-gold-500 text-gold-500" />
                        New
                      </div>
                      {property.listing_type === 'sale' && (
                        <div className="flex items-center gap-1 bg-gold-500/90 backdrop-blur-sm text-black text-xs font-bold px-2.5 py-1 rounded-full border border-gold-400">
                          For Sale
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 md:p-5">
                    <h3 className="font-bold text-base md:text-lg mb-1 group-hover:text-gold-400 transition line-clamp-1">{property.title}</h3>
                    <p className="text-[var(--muted-text)] text-sm flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </p>
                    <div className="flex items-center gap-3 text-[var(--muted-text)] text-sm mb-4">
                      {property.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{property.bedrooms}</span>}
                      {property.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{property.bathrooms}</span>}
                      {property.max_guests && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{property.max_guests}</span>}
                    </div>
                    <div className="border-t border-[var(--card-border)] pt-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg">${property.price_per_night}</span>
                        {(!property.price_type || property.price_type === 'per_night') && <span className="text-[var(--muted-text)] text-sm"> / night</span>}
                        {property.price_type === 'per_month' && <span className="text-[var(--muted-text)] text-sm"> / month</span>}
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
          <div className="text-center py-16 md:py-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl">
            <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <HomeIcon className="w-10 h-10 text-gold-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">Properties Coming Soon</h3>
            <p className="text-[var(--muted-text)] mb-8 max-w-md mx-auto text-sm md:text-base px-4">
              We&apos;re preparing our exclusive portfolio. Sign up to be notified when our first properties go live.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
              <Link href="/signup" className="w-full sm:w-auto bg-gold-500 hover:bg-gold-400 text-black font-semibold px-8 py-3 rounded-full transition text-center">
                Get Notified
              </Link>
              <Link href="/contact" className="w-full sm:w-auto border border-[var(--card-border)] hover:border-gold-500/50 font-semibold px-8 py-3 rounded-full transition text-center">
                Contact Us
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* WHY CHOOSE US */}
      <AnimatedStats />

      {/* CTA SECTION */}
      <section className="py-12 md:py-20 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">Ready to Experience Luxury?</h2>
          <p className="text-[var(--muted-text)] mb-8 text-base md:text-lg">Browse our handpicked properties and find your perfect stay.</p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-black font-bold px-8 md:px-10 py-3 md:py-4 rounded-full text-base md:text-lg transition shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:shadow-[0_0_60px_rgba(212,175,55,0.5)]"
          >
            Explore Properties <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
