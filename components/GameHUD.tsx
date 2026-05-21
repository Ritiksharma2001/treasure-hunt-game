"use client";

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  auth,
  db,
} from "../firebase";

import toast from "react-hot-toast";

export default function GameHUD() {

  const [user, setUser] =
    useState<User | null>(null);

  /* =========================
     AUTH STATE
  ========================= */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (currentUser) => {

          setUser(
            currentUser
          );

        }

      );

    return () =>
      unsubscribe();

  }, []);

  /* =========================
     GOOGLE LOGIN
  ========================= */

  const loginWithGoogle =
    async () => {

      const provider =
        new GoogleAuthProvider();

      try {

        const result =
          await signInWithPopup(
            auth,
            provider
          );

        const user =
          result.user;

        // SAVE USER TO FIRESTORE
        await setDoc(

          doc(
            db,
            "users",
            user.uid
          ),

          {
            uid:
              user.uid,

            name:
              user.displayName,

            email:
              user.email,

            photo:
              user.photoURL,

            lastLogin:
              new Date(),

            coins: 0,

            createdAt:
              new Date(),
          },

          {
            merge: true,
          }

        );

        toast.success(
          "🔥 Login Successful"
        );

      } catch (error) {

        console.log(error);

        toast.error(
          "❌ Login Failed"
        );

      }

    };

  /* =========================
     LOGOUT
  ========================= */

  const logout =
    async () => {

      try {

        await signOut(auth);

        toast.success(
          "👋 Logged Out"
        );

      } catch (error) {

        console.log(error);

      }

    };

  /* =========================
     UI
  ========================= */

  return (

    <div className="absolute top-4 left-4 z-[1000]">

      {!user ? (

        <button

          onClick={
            loginWithGoogle
          }

          className="bg-white text-black px-4 py-2 rounded-xl font-bold shadow-xl hover:scale-105 transition-all"

        >

          Login with Google 🔥

        </button>

      ) : (

        <div className="bg-black/80 text-white p-4 rounded-2xl shadow-xl w-64 border border-cyan-500">

          <h1 className="text-2xl font-bold">

            Treasure Hunt 🏴‍☠️

          </h1>

          <p className="mt-2 text-yellow-400">

            Welcome,

          </p>

          <p className="font-bold text-lg">

            {
              user.displayName
            }

          </p>

          <img

            src={
              user.photoURL ||
              ""
            }

            className="w-14 h-14 rounded-full mt-3 border-2 border-white"

          />

          <p className="text-xs text-gray-400 mt-3 break-all">

            {
              user.email
            }

          </p>

          <button

            onClick={logout}

            className="mt-4 bg-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-all"

          >

            Logout

          </button>

        </div>

      )}

    </div>

  );

}