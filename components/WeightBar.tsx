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

  if (direction === "vertical") {
    return (
      <div className="absolute inset-x-0 bottom-0 pointer-events-none overflow-hidden h-full">
        <div
          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-blue-200/35 to-blue-100/5 transition-all duration-300 ease-out"
          style={{ height: `${clamped * 100}%` }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-200/35 to-blue-100/5 transition-all duration-300 ease-out"
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
