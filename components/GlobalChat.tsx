"use client";

import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";

type ChatMessage = {
  id: string;
  text?: string;
  name?: string;
  photo?: string;
  uid?: string;
  createdAt?: any;
};

export default function GlobalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "globalChat"),
      orderBy("createdAt", "asc"),
      limit(40)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];

      setMessages(data);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    const user = auth.currentUser;

    if (!user) {
      toast.error("Login first to chat");
      return;
    }

    if (!message.trim()) {
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, "globalChat"), {
        text: message.trim(),
        uid: user.uid,
        name: user.displayName || "Player",
        email: user.email || "",
        photo: user.photoURL || "",
        createdAt: new Date(),
      });

      setMessage("");
    } catch (error) {
      console.log(error);
      toast.error("Message failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-[320px] max-w-[calc(100vw-2rem)]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-2xl border border-white/20 bg-black/75 px-5 py-3 text-sm font-black text-white shadow-2xl backdrop-blur-xl hover:bg-black/90"
        >
          🌍 Global Chat
          <span className="rounded-full bg-cyan-400 px-2 py-0.5 text-xs text-black">
            {messages.length}
          </span>
        </button>
      ) : (
        <div className="rounded-3xl border border-white/15 bg-black/70 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">🌍 Global Chat</h2>
              <p className="text-xs text-gray-400">Talk with players</p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold hover:bg-white/20"
            >
              ✕
            </button>
          </div>

          <div className="mb-3 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-black/30 p-3">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-gray-400">
                No messages yet
              </p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <img
                    src={msg.photo || "/images/user.png"}
                    className="h-8 w-8 rounded-full border border-white/20 object-cover"
                  />

                  <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-2">
                    <p className="truncate text-xs font-bold text-yellow-300">
                      {msg.name || "Player"}
                    </p>

                    <p className="wrap-break-word text-sm text-white">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Type message..."
              maxLength={120}
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-black disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}