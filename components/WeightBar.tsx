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

  /* Opacity scales with the weight ratio so 75% weight looks darker than 25%.
     Range: 0.04 (barely visible) → 0.22 (clearly shaded). */
  const opacity = 0.04 + clamped * 0.18;

  if (direction === "vertical") {
    return (
      <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-full">
        <div
          className="absolute inset-x-0 bottom-0 transition-all duration-300 ease-out"
          style={{
            height: `${clamped * 100}%`,
            backgroundColor: `rgba(0, 0, 0, ${opacity})`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        }}
      />
    </div>
  );
}
