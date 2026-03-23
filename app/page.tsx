"use client";

import WeightedAverageApp from "@/components/WeightedAverageApp";

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:py-10">
      <WeightedAverageApp />
    </main>
  );
}
