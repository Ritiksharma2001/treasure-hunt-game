"use client";

import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";

import L from "leaflet";
import { getDistance } from "geolib";
import RouteComponent from "./RouteComponent";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";

const userIcon = new L.Icon({
  iconUrl: "/images/user.png",
  iconSize: [40, 40],
});

const otherPlayerIcon = new L.Icon({
  iconUrl: "/images/user.png",
  iconSize: [35, 35],
});

const treasureIcon = new L.Icon({
  iconUrl: "/images/treasure.png",
  iconSize: [50, 50],
});

export default function MapComponent() {
  const [selectedTreasure, setSelectedTreasure] =
    useState<[number, number] | null>(null);

  const [coins, setCoins] = useState(0);
  const [collectedTreasures, setCollectedTreasures] = useState<string[]>([]);
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [treasures, setTreasures] = useState<any[]>([]);
  const [livePlayers, setLivePlayers] = useState<any[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
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

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setCoins(data.coins || 0);
        setCollectedTreasures(data.collectedTreasures || []);
      }

      setDataLoaded(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (!dataLoaded) return;

      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, "users", user.uid),
        {
          coins,
          collectedTreasures,
          updatedAt: new Date(),
        },
        {
          merge: true,
        }
      );
    };

    saveData();
  }, [coins, collectedTreasures, dataLoaded]);

  useEffect(() => {
    const saveLiveLocation = async () => {
      const user = auth.currentUser;

      if (!user || !position) return;

      await setDoc(
        doc(db, "livePlayers", user.uid),
        {
          uid: user.uid,
          name: user.displayName || "Player",
          email: user.email || "",
          photo: user.photoURL || "",
          latitude: position[0],
          longitude: position[1],
          lastActive: new Date(),
        },
        {
          merge: true,
        }
      );
    };

    saveLiveLocation();
  }, [position]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "livePlayers"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLivePlayers(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const removeLivePlayer = async () => {
      const user = auth.currentUser;

      if (!user) return;

      await deleteDoc(doc(db, "livePlayers", user.uid));
    };

    window.addEventListener("beforeunload", removeLivePlayer);

    return () => {
      window.removeEventListener("beforeunload", removeLivePlayer);
      removeLivePlayer();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "treasures"), (snapshot) => {
      const treasuresData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (!firstLoad && treasuresData.length > treasures.length) {
        toast.success("🆕 New Treasure Added!");
      }

      setTreasures(treasuresData);
      setFirstLoad(false);
    });

    return () => unsubscribe();
  }, [firstLoad, treasures.length]);

  if (!position) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center text-3xl">
        Loading Treasure Map 🏴‍☠️
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-[1000] bg-black/80 text-white px-4 py-3 rounded-xl shadow-xl">
        <h2 className="text-lg font-bold">
          Coins: {coins} 🪙
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

        <Marker position={position} icon={userIcon}>
          <Popup>
            <div>
              <p className="font-bold">You are here 📍</p>
              <p className="mt-2 text-sm">LAT: {position[0]}</p>
              <p className="text-sm">LNG: {position[1]}</p>
            </div>
          </Popup>
        </Marker>

        {livePlayers.map((player) => {
          const currentUser = auth.currentUser;

          if (currentUser && player.id === currentUser.uid) {
            return null;
          }

          if (!player.latitude || !player.longitude) {
            return null;
          }

          return (
            <Marker
              key={player.id}
              position={[
                Number(player.latitude),
                Number(player.longitude),
              ]}
              icon={otherPlayerIcon}
            >
              <Popup>
                <div className="text-center min-w-40">
                  <img
                    src={player.photo || "/images/user.png"}
                    className="w-12 h-12 rounded-full mx-auto mb-2 border"
                  />

                  <p className="font-bold">
                    {player.name || "Player"}
                  </p>

                  <p className="text-xs text-gray-500">
                    Online Player 👥
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {selectedTreasure && (
          <RouteComponent
            userPosition={position}
            treasurePosition={selectedTreasure}
          />
        )}

        {treasures.map((treasure) => {
          if (collectedTreasures.includes(treasure.id)) {
            return null;
          }

          const treasurePosition: [number, number] = [
            Number(treasure.latitude),
            Number(treasure.longitude),
          ];

          const distance = getDistance(
            {
              latitude: position[0],
              longitude: position[1],
            },
            {
              latitude: treasurePosition[0],
              longitude: treasurePosition[1],
            }
          );

          return (
            <Marker
              key={treasure.id}
              position={treasurePosition}
              icon={treasureIcon}
            >
              <Popup>
                <div className="text-center min-w-55">
                  <h2 className="font-bold text-lg">
                    {treasure.name}
                  </h2>

                  <p className="mt-2">
                    Reward: {treasure.reward} 🪙
                  </p>

                  <p className="mt-2 text-cyan-300 text-sm">
                    Distance: {distance} meters
                  </p>

                  <p className="mt-2 text-sm text-yellow-300">
                    {distance < 300
                      ? "✅ Treasure Unlocked"
                      : "❌ Move closer to unlock"}
                  </p>

                  <button
                    onClick={() => setSelectedTreasure(treasurePosition)}
                    className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    Show Route 🧭
                  </button>

                  {distance < 300 && (
                    <button
                      onClick={() => {
                        if (collectedTreasures.includes(treasure.id)) {
                          toast.error("Already Collected ❌");
                          return;
                        }

                        setCoins((prev) => prev + Number(treasure.reward));

                        setCollectedTreasures((prev) => [
                          ...prev,
                          treasure.id,
                        ]);

                        toast.success("🎉 Treasure Collected!");
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
        })}
      </MapContainer>
    </div>
  );
}