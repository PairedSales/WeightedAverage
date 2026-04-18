"use client";

interface WeightBarProps {
  /** 0-1 normalized ratio (weight / maxWeight) */
  ratio: number;
  direction?: "horizontal" | "vertical";
}

export default function WeightBar({
  ratio,
  direction = "horizontal",
}: WeightBarProps) {
  const clamped = Math.max(0, Math.min(1, ratio));
  const totalDots = 100;
  const filledDots = Math.round(clamped * totalDots);
  const dots = Array.from({ length: totalDots }, (_, idx) => idx < filledDots);
  const orderedDots =
    direction === "vertical"
      ? [...dots].reverse()
      : dots;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden grid grid-cols-10 gap-[2px] p-[6px] ${
        direction === "vertical" ? "auto-rows-fr" : ""
      }`}
      aria-hidden
    >
      {orderedDots.map((isFilled, idx) => (
        <span
          key={idx}
          className={`rounded-full transition-colors duration-300 ease-out ${
            isFilled ? "bg-accent-300/70" : "bg-accent-100/25"
          }`}
        />
      ))}
    </div>
  );
}
