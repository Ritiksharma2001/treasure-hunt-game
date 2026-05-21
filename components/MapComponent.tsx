"use client";

import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  useEffect,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";

import { getDistance } from "geolib";

import RouteComponent from "./RouteComponent";

import {
  auth,
  db,
} from "../firebase";

import toast from "react-hot-toast";

/* =========================
   ICONS
========================= */

const userIcon = new L.Icon({
  iconUrl: "/images/user.png",
  iconSize: [40, 40],
});

const treasureIcon = new L.Icon({
  iconUrl: "/images/treasure.png",
  iconSize: [50, 50],
});

export default function MapComponent() {

  /* =========================
     STATES
  ========================= */

  const [
    selectedTreasure,
    setSelectedTreasure,
  ] = useState<
    [number, number] | null
  >(null);

  const [coins, setCoins] =
    useState(0);

  const [
    collectedTreasures,
    setCollectedTreasures,
  ] = useState<string[]>([]);

  const [position, setPosition] =
    useState<
      [number, number] | null
    >(null);

  const [dataLoaded, setDataLoaded] =
    useState(false);

  const [treasures, setTreasures] =
    useState<any[]>([]);

  const [firstLoad, setFirstLoad] =
    useState(true);

  /* =========================
     LIVE LOCATION
  ========================= */

  useEffect(() => {

    navigator.geolocation.watchPosition(

      (location) => {

        setPosition([
          location.coords.latitude,
          location.coords.longitude,
        ]);

      },

      (error) => {
        console.log(error);
      },

      {
        enableHighAccuracy: true,
      }

    );

  }, []);

  /* =========================
     LOAD PLAYER DATA
  ========================= */

  useEffect(() => {

    const unsubscribe =
      auth.onAuthStateChanged(

        async (user) => {

          if (!user) return;

          const userRef =
            doc(
              db,
              "users",
              user.uid
            );

          const userSnap =
            await getDoc(
              userRef
            );

          if (
            userSnap.exists()
          ) {

            const data =
              userSnap.data();

            setCoins(
              data.coins || 0
            );

            setCollectedTreasures(
              data.collectedTreasures || []
            );

          }

          setDataLoaded(true);

        }

      );

    return () =>
      unsubscribe();

  }, []);

  /* =========================
     SAVE PLAYER DATA
  ========================= */

  useEffect(() => {

    const saveData =
      async () => {

        if (!dataLoaded)
          return;

        const user =
          auth.currentUser;

        if (!user) return;

        await setDoc(

          doc(
            db,
            "users",
            user.uid
          ),

          {
            coins,
            collectedTreasures,
            updatedAt:
              new Date(),
          },

          {
            merge: true,
          }

        );

      };

    saveData();

  }, [
    coins,
    collectedTreasures,
    dataLoaded,
  ]);

  /* =========================
     LOAD TREASURES LIVE
  ========================= */

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(
          db,
          "treasures"
        ),

        (snapshot) => {

          const treasuresData =
            snapshot.docs.map(
              (doc) => ({
                id: doc.id,
                ...doc.data(),
              })
            );

          console.log(
            "TREASURES:",
            treasuresData
          );

          // NEW TREASURE ALERT
          if (
            !firstLoad &&
            treasuresData.length >
              treasures.length
          ) {

            toast.success(
              "🆕 New Treasure Added!"
            );

          }

          setTreasures(
            treasuresData
          );

          setFirstLoad(false);

        }

      );

    return () =>
      unsubscribe();

  }, [
    firstLoad,
    treasures.length,
  ]);

  /* =========================
     LOADING SCREEN
  ========================= */

  if (!position) {

    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-3xl">
        Loading Treasure Map 🏴‍☠️
      </div>
    );

  }

  /* =========================
     MAIN UI
  ========================= */

  return (

    <div className="relative">

      {/* COINS HUD */}

      <div className="absolute top-4 right-4 z-[1000] bg-black/80 text-white px-4 py-3 rounded-xl shadow-xl">

        <h2 className="text-lg font-bold">
          Coins:
          {" "}
          {coins}
          {" "}
          🪙
        </h2>

      </div>

      <MapContainer
        key={treasures.length}
        center={position}
        zoom={15}
        scrollWheelZoom={true}
        className="h-screen w-full"
      >

<TileLayer
  attribution='&copy; OpenStreetMap contributors'
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

        {/* USER */}

        <Marker
          position={position}
          icon={userIcon}
        >

          <Popup>

            <div>

              <p>
                You are here 📍
              </p>

              <p className="mt-2 text-sm">
                LAT:
                {" "}
                {position[0]}
              </p>

              <p className="text-sm">
                LNG:
                {" "}
                {position[1]}
              </p>

            </div>

          </Popup>

        </Marker>

        {/* ROUTE */}

        {selectedTreasure && (

          <RouteComponent
            userPosition={
              position
            }
            treasurePosition={
              selectedTreasure
            }
          />

        )}

        {/* TREASURES */}

        {treasures.map(
  (treasure) => {

    if (
      collectedTreasures.includes(
        treasure.id
      )
    ) {

      return null;

    }

    const treasurePosition:
      [
        number,
        number
      ] = [
        Number(
          treasure.latitude
        ),
        Number(
          treasure.longitude
        ),
      ];
            const distance =
              getDistance(

                {
                  latitude:
                    position[0],

                  longitude:
                    position[1],
                },

                {
                  latitude:
                    treasurePosition[0],

                  longitude:
                    treasurePosition[1],
                }

              );

            return (

              <Marker
                key={
                  treasure.id
                }
                position={
                  treasurePosition
                }
                icon={
                  treasureIcon
                }
              >

                <Popup>

                  <div className="text-center min-w-55">

                    <h2 className="font-bold text-lg">
                      {
                        treasure.name
                      }
                    </h2>

                    <p className="mt-2">
                      Reward:
                      {" "}
                      {
                        treasure.reward
                      }
                      {" "}
                      🪙
                    </p>

                    <p className="mt-2 text-cyan-300 text-sm">

                      Distance:
                      {" "}
                      {distance}
                      {" "}
                      meters

                    </p>

                    <p className="mt-2 text-sm text-yellow-300">

                      {distance < 300
                        ? "✅ Treasure Unlocked"
                        : "❌ Move closer to unlock"}

                    </p>

                    {/* SHOW ROUTE */}

                    <button

                      onClick={() => {

                        setSelectedTreasure(
                          treasurePosition
                        );

                      }}

                      className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold"

                    >

                      Show Route 🧭

                    </button>

                    {/* COLLECT */}

                    {distance < 300 && (

                      <button

                        onClick={() => {

                          // PREVENT DUPLICATE COLLECTION
                          if (
                            collectedTreasures.includes(
                              treasure.id
                            )
                          ) {

                            toast.error(
                              "Already Collected ❌"
                            );

                            return;

                          }

                          setCoins(
                            (
                              prev
                            ) =>

                              prev +

                              Number(
                                treasure.reward
                              )
                          );

                          setCollectedTreasures(
                            (
                              prev
                            ) => [

                              ...prev,

                              treasure.id,

                            ]
                          );

                          toast.success(
                            "🎉 Treasure Collected!"
                          );

                        }}

                        className="mt-4 ml-2 bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold"

                      >

                        Collect 🪙

                      </button>

                    )}

                  </div>

                </Popup>

              </Marker>

            );

          }
        )}

      </MapContainer>

    </div>

  );

}