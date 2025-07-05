"use client";

const Marquee = () => {
  const text = "Fate Protocol • The Future of Prediction Markets • ";
  const repeatedWords = text.repeat(10).split(" ");
  return (
    <div className="relative overflow-hidden bg-white dark:bg-black py-8">
      <div className="flex flex-col gap-6">
        {/* Marquee 1 */}
        <div className="whitespace-nowrap animate-marquee-left text-[6vw] font-bold uppercase tracking-wider">
          {repeatedWords.map((word, i) => (
            <span
              key={`marquee1-${i}`}
              className="inline-block text-transparent stroke-text hover:text-black dark:hover:text-white hover:stroke-0 transition-all duration-300 mx-2"
            >
              {word}
            </span>
          ))}
        </div>

        {/* Marquee 2 */}
        <div className="whitespace-nowrap animate-marquee-right text-[6vw] font-bold uppercase tracking-wider">
          {repeatedWords.map((word, i) => (
            <span
              key={`marquee2-${i}`}
              className="inline-block text-transparent stroke-text hover:text-black dark:hover:text-white hover:stroke-0 transition-all duration-300 mx-2"
            >
              {word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
