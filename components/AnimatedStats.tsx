"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, type Variants } from "framer-motion";

interface Stat {
    rawValue: number;
    suffix: string;
    label: string;
    sub: string;
}

const stats: Stat[] = [
    { rawValue: 100, suffix: "%", label: "Verified Properties", sub: "Every listing is personally vetted" },
    { rawValue: 24, suffix: "/7", label: "Concierge Support", sub: "Always available for your needs" },
    { rawValue: 5, suffix: "★", label: "Luxury Standard", sub: "Only the finest accommodations" },
    { rawValue: 0, suffix: "%", label: "Hidden Fees", sub: "Transparent pricing always" },
];

function CountUp({ to, suffix }: { to: number; suffix: string }) {
    const motionValue = useMotionValue(0);
    const spring = useSpring(motionValue, { damping: 60, stiffness: 160 });
    const [display, setDisplay] = useState("0");

    useEffect(() => {
        motionValue.set(to);
    }, [to, motionValue]);

    useEffect(() => {
        const unsub = spring.on("change", (v) => {
            setDisplay(Math.round(v).toString());
        });
        return unsub;
    }, [spring]);

    return (
        <span>
            {display}
            {suffix}
        </span>
    );
}

export function AnimatedStats() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.15 },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 32 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: "easeOut" },
        },
    };

    return (
        <section className="py-12 md:py-20 px-4 md:px-6 bg-[var(--card-bg)] border-y border-[var(--card-border)]">
            <div className="max-w-7xl mx-auto">
                {/* Section heading */}
                <motion.div
                    className="text-center mb-10 md:mb-16"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <p className="text-gold-500 text-sm font-semibold uppercase tracking-wider mb-2">
                        Why Luxe Haven
                    </p>
                    <h2 className="text-2xl md:text-4xl font-bold">The Standard of Luxury</h2>
                </motion.div>

                {/* Stats grid */}
                <motion.div
                    ref={ref}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                >
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            className="text-center group"
                            variants={itemVariants}
                        >
                            {/* Glowing number */}
                            <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-2 drop-shadow-[0_0_12px_rgba(212,175,55,0.45)] group-hover:drop-shadow-[0_0_22px_rgba(212,175,55,0.7)] transition-all duration-500">
                                {inView ? (
                                    <CountUp to={stat.rawValue} suffix={stat.suffix} />
                                ) : (
                                    <span>0{stat.suffix}</span>
                                )}
                            </div>
                            <div className="font-semibold text-sm md:text-base mb-1">{stat.label}</div>
                            <div className="text-[var(--muted-text)] text-xs md:text-sm">{stat.sub}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
