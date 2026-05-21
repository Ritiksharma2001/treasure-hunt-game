"use client";

import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../firebase";

type Player = {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
  coins?: number;
};

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("coins", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];

      setPlayers(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 text-white p-4 rounded-2xl shadow-xl w-72 border border-yellow-500 max-h-80 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>

      {players.length === 0 ? (
        <p className="text-gray-400 text-sm">No players yet</p>
      ) : (
        <div className="space-y-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-yellow-400">#{index + 1}</span>

                <img
                  src={player.photo || "/images/user.png"}
                  className="w-9 h-9 rounded-full border border-white"
                />

                <div>
                  <p className="font-semibold text-sm">
                    {player.name || "Player"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {player.email || ""}
                  </p>
                </div>
              </div>

              <p className="font-bold text-yellow-400">
                {player.coins || 0} 🪙
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}