"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import toast from "react-hot-toast";
import { auth, db } from "../../firebase";

export default function AdminPage() {
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [reward, setReward] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check Admin Access
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          console.log("No user logged in");
          router.push("/");
          return;
        }

        console.log("Current UID:", user.uid);

        // Directly check admins/{uid}
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          console.log("User is not admin");

          toast.error("❌ You don't have admin access!");
          router.push("/");
          return;
        }

        console.log("Admin verified!");

        setIsAdmin(true);
        toast.success("✅ Admin Access Verified!");
      } catch (error) {
        console.error("Admin check failed:", error);

        toast.error("❌ Admin verification failed");
        router.push("/");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Create Treasure
  const createTreasure = async () => {
    if (!name || !reward || !latitude || !longitude) {
      toast.error("❌ Please fill all fields");
      return;
    }

    const rewardNum = Number(reward);
    const latNum = Number(latitude);
    const lngNum = Number(longitude);

    if (isNaN(rewardNum) || rewardNum <= 0) {
      toast.error("❌ Reward must be a positive number");
      return;
    }

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.error("❌ Latitude must be between -90 and 90");
      return;
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.error("❌ Longitude must be between -180 and 180");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "treasures"), {
        name: name.trim(),
        reward: rewardNum,
        latitude: latNum,
        longitude: lngNum,
        createdBy: auth.currentUser?.uid,
        createdAt: new Date(),
      });

      toast.success("🎉 Treasure Created Successfully!");

      // Clear Fields
      setName("");
      setReward("");
      setLatitude("");
      setLongitude("");
    } catch (error) {
      console.error("Error creating treasure:", error);

      toast.error("❌ Failed to create treasure");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">
            🔐 Verifying Admin Access...
          </p>

          <div className="flex justify-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-100" />
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    );
  }

  // If not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-2">
        Admin Dashboard 🏆
      </h1>

      <p className="text-gray-400 mb-8">
        Welcome Admin! Create treasures below.
      </p>

      <div className="max-w-md bg-zinc-900 p-8 rounded-2xl space-y-5">
        <h2 className="text-2xl font-bold">
          Create New Treasure 💎
        </h2>

        {/* Treasure Name */}
        <div>
          <label className="block mb-2 text-sm font-semibold">
            Treasure Name
          </label>

          <input
            type="text"
            placeholder="Golden Chest"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Reward */}
        <div>
          <label className="block mb-2 text-sm font-semibold">
            Reward
          </label>

          <input
            type="number"
            placeholder="100"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            disabled={submitting}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Latitude */}
        <div>
          <label className="block mb-2 text-sm font-semibold">
            Latitude
          </label>

          <input
            type="number"
            placeholder="28.5355"
            step="0.0001"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            disabled={submitting}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block mb-2 text-sm font-semibold">
            Longitude
          </label>

          <input
            type="number"
            placeholder="77.3910"
            step="0.0001"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            disabled={submitting}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Button */}
        <button
          onClick={createTreasure}
          disabled={
            submitting ||
            !name ||
            !reward ||
            !latitude ||
            !longitude
          }
          className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-600 transition-all disabled:opacity-50"
        >
          {submitting
            ? "Creating..."
            : "Create Treasure 🚀"}
        </button>
      </div>

      {/* Tip */}
      <div className="mt-10 max-w-md bg-blue-900/30 border border-blue-500 p-5 rounded-xl">
        <p className="text-blue-300 text-sm">
          💡 Use Google Maps to find treasure coordinates.
        </p>
      </div>
    </div>
  );
}