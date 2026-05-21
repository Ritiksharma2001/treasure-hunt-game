"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";

import { useEffect, useState } from "react";

import { auth, db } from "../firebase";

import toast from "react-hot-toast";

export default function GameHUD() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          photo: user.photoURL,
          lastLogin: new Date(),
          createdAt: new Date(),
        },
        {
          merge: true,
        }
      );

      toast.success("🔥 Login Successful");
    } catch (error) {
      console.log(error);
      toast.error("❌ Login Failed");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("👋 Logged Out");
    } catch (error) {
      console.log(error);
      toast.error("❌ Logout Failed");
    }
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] w-[260px] max-w-[calc(100vw-2rem)]">
      {!user ? (
        <button
          onClick={loginWithGoogle}
          className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/70 px-5 py-3 text-sm font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:scale-[1.03] hover:bg-black/85"
        >
          <span className="text-lg">🔥</span>
          Login with Google
        </button>
      ) : (
        <div className="rounded-3xl border border-white/15 bg-black/65 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black leading-tight">
                Treasure Hunt
              </h1>
              <p className="text-xs text-yellow-300">Adventure Mode 🏴‍☠️</p>
            </div>

            <div className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-xs font-bold text-cyan-200">
              LIVE
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
            <img
              src={user.photoURL || "/images/user.png"}
              alt="User profile"
              className="h-12 w-12 rounded-full border-2 border-yellow-400 object-cover"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {user.displayName || "Player"}
              </p>

              <p className="truncate text-xs text-gray-300">
                {user.email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:bg-red-600 active:scale-95"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}