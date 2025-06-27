'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const numbers = ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];

export default function Loader({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const [splashOut, setSplashOut] = useState(false);

  useEffect(() => {
    if (index < numbers.length - 1) {
      const timer = setTimeout(() => setIndex(index + 1), 300);
      return () => clearTimeout(timer);
    } else {
      // Wait a bit before triggering splash-out
      const splashTimer = setTimeout(() => {
        setSplashOut(true);
        // Delay slightly to allow splash-out animation to complete
        setTimeout(onFinish, 700); // match with transition duration below
      }, 600);
      return () => clearTimeout(splashTimer);
    }
  }, [index]);

  const currentNumber = numbers[index];

  return (
    <motion.div
      className="h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden"
      initial={{ scale: 1 }}
      animate={splashOut ? { scale: 20, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeInOut" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentNumber}
          layoutId="morphing-number"
          initial={{ opacity: 0, x: index === 0 ? 0 : -50, scale: 0.8 }}
          animate={{ opacity: 1, x: index * 60, scale: 1 }}
          exit={{ opacity: 0, x: index * 80 + 50, scale: 1.2 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute top-1/2 text-white text-[14vw] italic font-light"
          style={{ transform: 'translateY(-50%)' }}
        >
          {currentNumber}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
