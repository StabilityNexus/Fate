"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, TrendingUp } from "lucide-react"
import logo from '../../../public/Animated/logo-animated.gif'
const Hero = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-100 to-gray-200 text-black dark:from-[#1B3A2F] dark:to-[#0D1F1A] dark:text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl text-center space-y-8"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
        >
          Fate Protocol
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-lg sm:text-xl lg:text-2xl font-medium text-opacity-90"
        >
          A decentralized, perpetual prediction market using dual vaults for fluid market mechanics. Buy and sell
          bullCoins & bearCoins to speculate on trends in a dynamic, self-balancing ecosystem.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/explore">
            <Button
              variant="default"
              size="lg"
              className="bg-green-700 text-white hover:bg-green-600 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-2 px-6 py-3 rounded-full shadow-lg"
            >
              <span>Explore Markets</span>
              <TrendingUp className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/learn-more">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center space-x-2 px-6 py-3 rounded-full shadow-lg"
            >
              <span>Learn More</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Centered "A project by" section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col items-center justify-center my-6"
        >
          {/* <p className="text-sm sm:text-base font-medium">A project by</p> */}
          <Link href="https://news.stability.nexus/" target="_blank">
            <Image
              unoptimized
              fetchPriority="high"
              loading="lazy"
              src={logo}
              alt="Stability Nexus Logo"
              width={40}
              height={40}
              className="cursor-pointer py-2"
            />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Hero
