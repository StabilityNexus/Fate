"use client";

import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import features from "@/constants/Features";

export default function AboutSection() {
  return (
    <section
      id="features"
      className="relative pt-36 pb-32 bg-white dark:bg-black "
    >
      {/* Visible gradient background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white to-neutral-100 dark:from-black dark:to-neutral-900 opacity-80" />

      <div className="container mx-auto px-6 md:px-16 relative z-10">
        {/* Heading */}
        <h2 className="text-center text-5xl md:text-7xl  font-bold font-fate fate-title mb-10">
          Redefining <br className="hidden md:block" /> Prediction Markets
        </h2>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl bg-white/40 dark:bg-[#0b0b0b]/50 border border-neutral-200 dark:border-neutral-800 p-10 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <CardHeader className="space-y-6">
                <div className="flex justify-center">{feature.icon}</div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-center text-neutral-900 dark:text-white">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-center text-neutral-700 dark:text-neutral-300 text-base md:text-lg leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </motion.div>
          ))}
        </div>

        {/* Closing Statement */}
        <div className="mt-28 text-center">
          <p className="text-xl md:text-2xl text-neutral-800 dark:text-neutral-200 tracking-wide">
            In a world of uncertainty, <br className="md:hidden" />
            <span className="font-semibold">
              we provide{" "}
              <span className="underline decoration-wavy decoration-2">
                clarity
              </span>
              .
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
