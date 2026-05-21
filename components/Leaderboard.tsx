"use client";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import { db } from "../firebase";

type Player = {
  id: string;
  name?: string;
  email?: string;
  photo?: string;
  coins?: number;
};

export default function Leaderboard() {

  const [players, setPlayers] =
    useState<Player[]>([]);

  useEffect(() => {

    const q = query(

      collection(
        db,
        "users"
      ),

      orderBy(
        "coins",
        "desc"
      )

    );

    const unsubscribe =
      onSnapshot(

        q,

        (snapshot) => {

          const data =
            snapshot.docs.map(
              (doc) => ({

                id: doc.id,

                ...doc.data(),

              })
            ) as Player[];

          setPlayers(data);

        }

      );

    return () =>
      unsubscribe();

  }, []);

  return (

    <div className="absolute bottom-4 left-4 z-[1000] w-[300px] max-w-[calc(100vw-2rem)] rounded-3xl border border-white/15 bg-black/65 p-4 text-white shadow-2xl backdrop-blur-xl">

      {/* HEADER */}

      <div className="mb-4 flex items-center justify-between">

        <div>

          <h2 className="text-xl font-black">
            🏆 Leaderboard
          </h2>

          <p className="text-xs text-gray-300">
            Top Treasure Hunters
          </p>

        </div>

        <div className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300">

          LIVE

        </div>

      </div>

      {/* NO PLAYERS */}

      {players.length === 0 ? (

        <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-gray-400">

          No players yet 🚀

        </div>

      ) : (

        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">

          {players.map(

            (
              player,
              index
            ) => (

              <div

                key={
                  player.id
                }

                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"

              >

                {/* LEFT */}

                <div className="flex items-center gap-3 min-w-0">

                  {/* RANK */}

                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm font-black text-black">

                    {
                      index + 1
                    }

                  </div>

                  {/* PROFILE */}

                  <img

                    src={
                      player.photo ||
                      "/images/user.png"
                    }

                    alt="profile"

                    className="h-10 w-10 rounded-full border border-white/20 object-cover"

                  />

                  {/* INFO */}

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold">

                      {
                        player.name ||
                        "Player"
                      }

                    </p>

                    <p className="truncate text-xs text-gray-400">

                      {
                        player.email
                      }

                    </p>

                  </div>

                </div>

                {/* COINS */}

                <div className="ml-3 rounded-xl bg-yellow-400/10 px-3 py-1 text-sm font-black text-yellow-300">

                  {
                    player.coins || 0
                  } 🪙

                </div>

              </div>

            )

          )}

        </div>

      )}

    </div>

  );

}