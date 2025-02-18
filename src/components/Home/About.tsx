"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, Repeat, ShieldCheck } from "lucide-react";

export default function AboutSection() {
  const features = [
    {
      icon: <Coins className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />,
      title: "Dual-Vault System",
      description:
        "Utilize bullCoins and bearCoins to speculate on market trends without traditional order books.",
    },
    {
      icon: <Repeat className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />,
      title: "Continuous Operation",
      description:
        "Experience an always-on prediction market that never expires, allowing for ongoing participation.",
    },
    {
      icon: <ShieldCheck className="h-8 w-8 mb-4 text-green-700 dark:text-green-300" />,
      title: "Fair & Transparent",
      description:
        "Benefit from our unique DistributeOutcome function that ensures fairness and transparency.",
    },
  ];

  return (
    <section id="features" className=" py-20 bg-green-50 dark:bg-[#0D1F1A] ">
      <div className="container mx-auto px-4 m-5">
        <h2 className="text-3xl font-bold text-center mb-12 text-green-900 dark:text-white">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <div className="flex justify-center">{feature.icon}</div>
                <CardTitle className="text-green-900 dark:text-white">{feature.title}</CardTitle>
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
