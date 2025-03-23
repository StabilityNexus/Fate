"use client"
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

const Hero = () => {
  const { resolvedTheme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lightOn, setLightOn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setLightOn((prevState) => !prevState);
    }
  };

  return (
    resolvedTheme ? (<div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Content (To Legacies) */}
      <div className="absolute w-full h-full align-center justify-center bg-black dark:bg-white">
        <h1 className={`text-white dark:text-black text-8xl align-center mt-[30%] md:mt-[10%] font-bold text-center pt-20 font-italiannoRegular`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>Fate Protocol</h1>
        <p className={`text-white dark:text-black text-2xl mt-4 align-center text-center`} onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}> Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against
          price risks.</p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href='/createPool'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "light"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Create Pool
            </button>
          </Link>

          <Link href='/explore-pools'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "light"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Explore Pool
            </button>
          </Link>

          <Link href='/usePool'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "light"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Use Pool
            </button>
          </Link>
        </div>
      </div>

      {/* Flashlight Effect */}
      <div
        className={`absolute rounded-full z-30 bg-black dark:bg-white pointer-events-none transition-opacity duration-300 ${lightOn ? 'opacity-100' : 'opacity-0'}`}
        style={{
          top: `${mousePosition.y - 100}px`,
          left: `${mousePosition.x - 100}px`,
          width: '200px',
          height: '200px',
        }}
      ></div>

      {/* Foreground Content (From Land) */}
      <div
        className="absolute w-full h-full align-center justify-center"
        style={{
          backgroundColor: resolvedTheme === "dark" ? "black" : "white",
          maskImage: isHovered
            ? `radial-gradient(
          circle at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 150px,
          black 150px
        )`
            : `radial-gradient(
          circle at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 20px,
          black 20px
        )`,
          WebkitMaskImage: isHovered
            ? `radial-gradient(
          circle at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 150px,
          black 150px
        )`
            : `radial-gradient(
          circle at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 20px,
          black 20px
        )`,
        }}
      >
        <h1 className="text-black dark:text-white text-8xl align-center mt-[30%] md:mt-[10%] font-bold text-center pt-20 font-italiannoRegular"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>Fate Protocol</h1>
        <p className='text-black dark:text-white text-2xl align-center mt-4 text-center'
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}> Decentralized perpetual prediction pools. <br />
          Buy and sell bullCoins and bearCoins to dynamically hedge against
          price risks.</p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href='/createPool'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "dark"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Create Pool
            </button>
          </Link>

          <Link href='/explorePools'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "dark"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Explore Pool
            </button>
          </Link>

          <Link href='/usePool'>
            <button className={`px-6 py-3 border-2 rounded-full text-lg transition-all duration-300
              ${resolvedTheme === "dark"
                ? "border-white text-white hover:bg-white hover:text-black"
                : "border-black text-black hover:bg-black hover:text-white"}`}>
              Use Pool
            </button>
          </Link>
        </div>
      </div>

      {/* Toggle Flashlight Button */}
      <button
        className="hidden fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white text-black px-4 py-2 rounded-lg z-40"
        onClick={() => setLightOn((prev) => !prev)}
      >
        {lightOn ? 'Turn Off Flashlight' : 'Turn On Flashlight'}
      </button>
    </div>) : (<></>)
  );
};

export default Hero;