"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const Navbar = () => {
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-opacity-80 backdrop-blur-md px-6 py-4 border-b border-transparent dark:border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Fate Protocol
          </motion.h1>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/explore" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition">
            Explore
          </Link>
          <Link href="/learn-more" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition">
            Learn More
          </Link>
          <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition">
            About
          </Link>

          {/* Connect Wallet Button */}
          <Button className="bg-green-700 text-white hover:bg-green-600 transition-all px-5 py-2 rounded-lg shadow-lg">
            Connect Wallet
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-gray-700 dark:text-white focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-[#1B3A2F] shadow-md py-4"
          >
            <div className="flex flex-col items-center space-y-4">
              <Link href="/explore" onClick={() => setIsOpen(false)} className="text-gray-700 dark:text-gray-300">
                Explore
              </Link>
              <Link href="/learn-more" onClick={() => setIsOpen(false)} className="text-gray-700 dark:text-gray-300">
                Learn More
              </Link>
              <Link href="/about" onClick={() => setIsOpen(false)} className="text-gray-700 dark:text-gray-300">
                About
              </Link>

              {/* Connect Wallet Button (Mobile) */}
              <Button className="bg-green-700 text-white hover:bg-green-600 transition-all px-5 py-2 rounded-lg shadow-lg">
                Connect Wallet
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

export default Navbar
