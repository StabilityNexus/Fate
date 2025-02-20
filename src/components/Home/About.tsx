"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Coins, Repeat, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  const features = [
    {
      icon: (
        <Coins className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />
      ),
      title: "Pool Approach",
      description:
        "Hedge against risks using prediction pools instead of order-book-based prediction markets.",
    },
    {
      icon: (
        <Repeat className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />
      ),
      title: "Continuous Operation",
      description:
        "Experience an always-on prediction market that never expires, allowing for ongoing participation.",
    },
    {
      icon: (
        <ShieldCheck className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />
      ),
      title: "Fairness & Transparency",
      description:
        "Outcomes are guaranteed and executed by immutable smart contracts.",
    },
  ];

  return (
    <section id="features" className="py-10 pb-52 bg-green-50 dark:bg-[#0D1F1A]">
      <div className="container mx-auto px-10">
        <h2 className="text-3xl font-bold text-center font-serif mb-12 text-green-900 dark:text-white">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:shadow-2xl min-h-[250px] p-6"
            >
              <CardHeader>
                <div className="flex justify-center">{feature.icon}</div>
                <CardTitle className="text-green-900 dark:text-white">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
