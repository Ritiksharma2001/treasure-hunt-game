"use client";

import MapComponent from "../components/MapComponent";
import GameHUD from "../components/GameHUD";

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden">
      
      <GameHUD />

      <div className="absolute inset-0 bg-black/20 z-[500] pointer-events-none" />

      <MapComponent />

    </main>
  );
}