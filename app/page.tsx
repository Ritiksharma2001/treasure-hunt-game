"use client";

import dynamic from "next/dynamic";

const MapComponent = dynamic(
  () => import("../components/MapComponent"),
  {
    ssr: false,
  }
);

const GameHUD = dynamic(
  () => import("../components/GameHUD"),
  {
    ssr: false,
  }
);

const Leaderboard = dynamic(
  () => import("../components/Leaderboard"),
  {
    ssr: false,
  }
);

export default function Home() {
  return (
    <main className="relative">
      <GameHUD />
      <Leaderboard />
      <MapComponent />
    </main>
  );
}