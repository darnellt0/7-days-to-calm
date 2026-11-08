"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@elevenlabs/client";

interface Props {
  day: number;
  title: string;
  onDayChange: (day: number) => number;
  onEvent: (name: string, payload?: Record<string, unknown>) => void;
}

type Session = Awaited<ReturnType<typeof Conversation.startSession>>;

export default function ShriaGuide({ day, title, onDayChange, onEvent }: Props) {
  const session = useRef<Session | null>(null);
  const generation = useRef(0);
  const starting = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [status, setStatus] = useState("Ready when you are");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<{ source: string; text: string }[]>([]);

  useEffect(() => {
    console.log("[EM] widget ready");
    return () => {
      generation.current++;
      request.current?.abort();
      const active = session.current;
      session.current = null;
      void active?.endSession().catch(() => {});
    };
  }, []);

  async function stop() {
    generation.current++;
    request.current?.abort();
    starting.current = false;
    const active = session.current;
    session.current = null;
    try { await active?.endSession(); }
    finally {
      setConnected(false); setBusy(false); setMuted(false);
      setStatus("Practice ended. You can begin again.");
      onEvent("em_convai_ended", { day });
    }
  }

  async function start() {
    if (starting.current || session.current) return;
    starting.current = true;
    const attempt = ++generation.current;
    const current = () => attempt === generation.current;
    setBusy(true); setError(""); setMessages([]); setStatus("Allow microphone access to begin");
    const controller = new AbortController();
    request.current = controller;
    let connectionTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Open this page over HTTPS or localhost to use your microphone.");
      }
      // Release the permission-check stream immediately; the SDK owns call audio.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      if (!current()) return;
      setStatus("Connecting to Shria...");
      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8787" : "https://seven-days-to-calm.onrender.com")).replace(/\/$/, "");
      const timer = setTimeout(() => controller.abort(), 25000);
      let response: Response;
      try {
        response = await fetch(`${base}/convai/signed-url?challenge_day=${day}`, {
          credentials: "omit", cache: "no-store", signal: controller.signal,
        });
      } finally { clearTimeout(timer); }
      if (!response.ok) {
        const reference = response.headers.get("X-Request-ID");
        throw new Error(`Shria is unavailable (${response.status}). Please try again.${reference ? ` Reference: ${reference}` : ""}`);
      }
      const data = await response.json();
      if (typeof data.signed_url !== "string" || !data.signed_url.startsWith("wss://")) {
        throw new Error("The voice service returned an invalid connection. Please try again.");
      }
      if (!current()) return;
      console.log("[EM] got signed url for day", day);
      const { Conversation } = await import("@elevenlabs/client");
      if (!current()) return;
      const pending = Conversation.startSession({
        signedUrl: data.signed_url,
        connectionType: "websocket",
        dynamicVariables: { challenge_day: day, challenge_title: title, challenge_name: "7 Days to Calm" },
        clientTools: {
          getChallengeDay: () => JSON.stringify({ day }),
          setChallengeDay: ({ day: value }: { day: number }) => JSON.stringify({ day: onDayChange(value) }),
          trackEvent: ({ name, payload }: { name?: string; payload?: Record<string, unknown> }) => {
            onEvent(name || "em_custom", payload || {}); return "ok";
          },
          setReminder: ({ time, label }: { time?: string; label?: string }) => {
            localStorage.setItem("em_reminder", JSON.stringify({ time, label }));
            onEvent("em_reminder_set", { time, label }); return "Reminder preference saved locally; no notification scheduled.";
          },
          openLink: ({ url }: { url: string }) => {
            const target = new URL(url);
            if (target.protocol !== "https:") return "Only HTTPS links are supported.";
            window.open(target.href, "_blank", "noopener,noreferrer"); return "Opened link";
          },
        },
        onModeChange: ({ mode }) => { if (current()) setStatus(mode === "speaking" ? "Shria is speaking" : "Shria is listening"); },
        onMessage: ({ source, message }) => { if (current()) setMessages(prev => [...prev.slice(-49), { source, text: message }]); },
        onDisconnect: () => {
          if (current()) {
            session.current = null; starting.current = false;
            setConnected(false); setBusy(false); setMuted(false); setStatus("Conversation ended. Begin again whenever you're ready.");
            onEvent("em_convai_ended", { day });
          }
        },
        onError: () => {
          if (current()) {
            setError("The voice connection was interrupted. End the session and try again.");
          }
        },
      });
      // If canceled during SDK startup, close the late session immediately.
      void pending.then(active => { if (!current()) void active.endSession(); }).catch(() => {});
      const active = await Promise.race([pending, new Promise<never>((_, reject) => {
        connectionTimer = setTimeout(() => reject(new Error("Connecting took too long. Please try again.")), 25000);
      })]);
      if (!current()) { await active.endSession(); return; }
      session.current = active;
      active.sendContextualUpdate(`This is Day ${day}: ${title} of 7 Days to Calm. Guide today's practice and ask whether the user has 2, 5, or 8 minutes.`);
      setConnected(true); setMuted(false); setStatus("Shria is listening");
      onEvent("em_convai_started", { day });
    } catch (cause) {
      if (current()) {
        generation.current++;
        const active = session.current;
        session.current = null;
        void active?.endSession().catch(() => {});
        const denied = cause instanceof DOMException && cause.name === "NotAllowedError";
        const timedOut = cause instanceof DOMException && cause.name === "AbortError";
        setError(denied ? "Microphone access was denied. Allow it in your browser settings, then try again." : timedOut ? "The voice service took too long. Please try again." : cause instanceof Error ? cause.message : "Unable to start Shria. Please try again.");
        setStatus("Ready to retry"); setConnected(false);
        console.error("[EM] voice session failed", { day, type: cause instanceof Error ? cause.name : "unknown" });
      }
    } finally {
      clearTimeout(connectionTimer);
      if (attempt === generation.current || attempt + 1 === generation.current) {
        starting.current = false; setBusy(false);
      }
    }
  }

  return (
    <section id="shria-widget-container" aria-label="Shria voice guide" className="w-full my-8 rounded-2xl border border-teal-100 bg-teal-50 p-6 flex flex-col items-center justify-center gap-5" style={{ minHeight: 420 }}>
      <div aria-hidden="true" className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-700 to-yellow-200 shadow-lg" />
      <h3 className="text-2xl font-semibold text-teal-900">Practice with Shria</h3>
      <p className="text-center text-gray-700">Day {day}: {title}. Choose 2, 5, or 8 minutes when you begin.</p>
      <p className="text-sm text-gray-600">Your microphone is used during the call. Press End whenever you like.</p>
      <p role="status" aria-live="polite">{status}</p>
      {error && <p role="alert" className="text-red-700 text-center">{error}</p>}
      <div className="flex gap-3">
        {!connected && !busy && <button onClick={start} className="px-6 py-3 rounded-lg bg-teal-700 text-white">{error ? "Try again" : "Begin practice"}</button>}
        {connected && <button onClick={() => { const next = !muted; session.current?.setMicMuted(next); setMuted(next); }} aria-pressed={muted} className="px-4 py-3 rounded-lg border border-teal-700">{muted ? "Unmute" : "Mute"}</button>}
        {(connected || busy) && <button onClick={stop} className="px-6 py-3 rounded-lg bg-gray-800 text-white">{busy ? "Cancel" : "End"}</button>}
      </div>
      {messages.length > 0 && <div role="log" aria-label="Conversation transcript" className="w-full max-h-56 overflow-y-auto bg-white rounded-lg p-4 space-y-2">{messages.map((item, i) => <p key={i}><strong>{item.source === "ai" ? "Shria" : "You"}:</strong> {item.text}</p>)}</div>}
      <p className="text-xs text-gray-500">Voice powered by ElevenLabs</p>
    </section>
  );
}
