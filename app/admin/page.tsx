"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import toast from "react-hot-toast";
import { auth, db } from "../../firebase";

export default function AdminPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [treasures, setTreasures] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [reward, setReward] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          router.push("/");
          return;
        }

        const adminSnap = await getDoc(doc(db, "admins", user.uid));

        if (!adminSnap.exists()) {
          toast.error("❌ No Admin Access");
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.log(error);
        toast.error("❌ Admin Verification Failed");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "treasures"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTreasures(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPlayers(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "bannedUsers"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.id);
      setBannedUsers(data);
    });

    return () => unsubscribe();
  }, []);

  const createTreasure = async () => {
    if (!name || !reward || !latitude || !longitude) {
      toast.error("❌ Fill all fields");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "treasures"), {
        name: name.trim(),
        reward: Number(reward),
        latitude: Number(latitude),
        longitude: Number(longitude),
        createdBy: auth.currentUser?.uid,
        createdAt: new Date(),
      });

      toast.success("💎 Treasure Created!");

      setName("");
      setReward("");
      setLatitude("");
      setLongitude("");
    } catch (error) {
      console.log(error);
      toast.error("❌ Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTreasure = async (id: string) => {
    try {
      await deleteDoc(doc(db, "treasures", id));
      toast.success("🗑️ Treasure Deleted");
    } catch (error) {
      console.log(error);
      toast.error("❌ Delete Failed");
    }
  };

  const banPlayer = async (player: any) => {
    try {
      await setDoc(doc(db, "bannedUsers", player.id), {
        uid: player.id,
        name: player.name || "Unknown Player",
        email: player.email || "",
        bannedAt: new Date(),
        bannedBy: auth.currentUser?.uid,
      });

      toast.success("🚫 Player Banned");
    } catch (error) {
      console.log(error);
      toast.error("❌ Ban Failed");
    }
  };

  const unbanPlayer = async (playerId: string) => {
    try {
      await deleteDoc(doc(db, "bannedUsers", playerId));
      toast.success("✅ Player Unbanned");
    } catch (error) {
      console.log(error);
      toast.error("❌ Unban Failed");
    }
  };

  const deletePlayerData = async (playerId: string) => {
    try {
      await deleteDoc(doc(db, "users", playerId));
      toast.success("🗑️ Player Data Deleted");
    } catch (error) {
      console.log(error);
      toast.error("❌ Delete Player Failed");
    }
  };

  const activePlayers = players.filter((player) => {
    if (!player.updatedAt?.toDate) return false;

    const lastActive = player.updatedAt.toDate().getTime();
    const now = Date.now();

    return now - lastActive < 1000 * 60 * 10;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-2xl font-bold">
        🔐 Verifying Admin...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-black">Admin Dashboard 🏆</h1>
        <p className="text-gray-400 mt-2">
          Manage treasures, players, and banned users
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-gray-400 text-sm">Total Treasures</p>
          <h2 className="text-3xl font-black text-yellow-300">
            {treasures.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-gray-400 text-sm">Total Players</p>
          <h2 className="text-3xl font-black text-cyan-300">
            {players.length}
          </h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-gray-400 text-sm">Active Players</p>
          <h2 className="text-3xl font-black text-green-300">
            {activePlayers.length}
          </h2>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-black mb-6">Create Treasure 💎</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Treasure Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none focus:border-cyan-400"
            />

            <input
              type="number"
              placeholder="Reward"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none focus:border-cyan-400"
            />

            <input
              type="number"
              placeholder="Latitude"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none focus:border-cyan-400"
            />

            <input
              type="number"
              placeholder="Longitude"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-2xl bg-black/40 border border-white/10 p-4 outline-none focus:border-cyan-400"
            />

            <button
              onClick={createTreasure}
              disabled={submitting}
              className="w-full rounded-2xl bg-yellow-400 py-4 font-black text-black transition-all hover:scale-[1.02]"
            >
              {submitting ? "Creating..." : "Create Treasure 🚀"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Live Treasures 🗺️</h2>

            <div className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-bold text-green-300">
              {treasures.length} Active
            </div>
          </div>

          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
            {treasures.map((treasure) => (
              <div
                key={treasure.id}
                className="rounded-2xl border border-white/10 bg-black/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{treasure.name}</h3>

                    <p className="text-yellow-300 text-sm mt-1">
                      Reward: {treasure.reward} 🪙
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      LAT: {treasure.latitude}
                    </p>

                    <p className="text-xs text-gray-400">
                      LNG: {treasure.longitude}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteTreasure(treasure.id)}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black">Players 👥</h2>

            <div className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-bold text-cyan-300">
              {players.length} Total
            </div>
          </div>

          <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
            {players.map((player) => {
              const isBanned = bannedUsers.includes(player.id);

              return (
                <div
                  key={player.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={player.photo || "/images/user.png"}
                      className="w-11 h-11 rounded-full border border-white/20"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold truncate">
                        {player.name || "Player"}
                      </h3>

                      <p className="text-xs text-gray-400 truncate">
                        {player.email}
                      </p>

                      <p className="text-xs text-yellow-300 mt-2">
                        Coins: {player.coins || 0} 🪙
                      </p>

                      <p className="text-[10px] text-gray-500 break-all mt-1">
                        UID: {player.id}
                      </p>

                      {isBanned && (
                        <p className="text-xs text-red-400 font-bold mt-2">
                          🚫 Banned
                        </p>
                      )}

                      <div className="flex gap-2 mt-3">
                        {!isBanned ? (
                          <button
                            onClick={() => banPlayer(player)}
                            className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => unbanPlayer(player.id)}
                            className="rounded-xl bg-green-500 px-3 py-2 text-xs font-bold text-black hover:bg-green-600"
                          >
                            Unban
                          </button>
                        )}

                        <button
                          onClick={() => deletePlayerData(player.id)}
                          className="rounded-xl bg-zinc-700 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-600"
                        >
                          Delete Data
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}