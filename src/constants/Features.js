import { CircleDollarSign, Infinity, Scale } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2 }}>
        <CircleDollarSign className="h-12 w-12 text-black dark:text-white" />
      </motion.div>
    ),
    title: "Pool Approach",
    description:
      "Hedge against risks with perpetual prediction pools — efficient, scalable, and seamless.",
  },
  {
    icon: (
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4 }}>
        <Infinity className="h-12 w-12 text-black dark:text-white" />
      </motion.div>
    ),
    title: "Continuous Operation",
    description:
      "The future doesn’t pause. Our markets operate endlessly, adapting to every pulse of change.",
  },
  {
    icon: (
      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 2 }}>
        <Scale className="h-12 w-12 text-black dark:text-white" />
      </motion.div>
    ),
    title: "Fairness & Transparency",
    description:
      "Immutable smart contracts ensure trust, fairness, and secure outcomes — powered by code, not bias.",
  },
];

export default features;