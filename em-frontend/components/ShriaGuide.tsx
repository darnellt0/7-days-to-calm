"use client";

import { useEffect, useRef, useState } from "react";
import type { Conversation } from "@elevenlabs/client";

interface Props {
  day: number;
  title: string;
  onActiveChange: (active: boolean) => void;
  onPracticeEnd: () => void;
  onEvent: (name: string, payload?: Record<string, unknown>) => void;
}

type Session = Awaited<ReturnType<typeof Conversation.startSession>>;

export default function ShriaGuide({ day, title, onActiveChange, onPracticeEnd, onEvent }: Props) {
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
  const [elapsed, setElapsed] = useState(0);
  const transcript = useRef<HTMLDivElement>(null);
  const followTranscript = useRef(true);

  useEffect(() => { onActiveChange(busy || connected); }, [busy, connected, onActiveChange]);
  useEffect(() => {
    if (!connected) return;
    const start = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [connected]);
  useEffect(() => {
    const element = transcript.current;
    if (element && followTranscript.current) element.scrollTop = element.scrollHeight;
  }, [messages]);

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
    catch { setError("The connection closed unexpectedly. You can begin again."); }
    finally {
      setConnected(false); setBusy(false); setMuted(false);
      setStatus("Practice ended. You can begin again.");
      if (active) onPracticeEnd();
      onEvent("em_convai_ended", { day });
    }
  }

  async function start() {
    if (starting.current || session.current) return;
    starting.current = true;
    const attempt = ++generation.current;
    const current = () => attempt === generation.current;
    setBusy(true); setError(""); setMessages([]); setElapsed(0); followTranscript.current = true; setStatus("Allow microphone access to begin");
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
        dynamicVariables: {
          challenge_day: day,
          challenge_title: title,
          challenge_name: "7 Days to Calm",
          session_greeting: `Welcome to Day ${day} of 7 Days to Calm: ${title}. I'm Shria. Would a two, five, or eight minute practice feel good right now?`,
        },
        clientTools: {
          getChallengeDay: () => JSON.stringify({ day }),
          setChallengeDay: () => JSON.stringify({ day, changed: false, message: "End the call, then use the page controls to change days." }),
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
            const wasConnected = session.current !== null;
            session.current = null; starting.current = false;
            setConnected(false); setBusy(false); setMuted(false); setStatus("Conversation ended. Begin again whenever you're ready.");
            onEvent("em_convai_ended", { day });
            if (wasConnected) onPracticeEnd();
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
    <section id="shria-widget-container" tabIndex={-1} aria-label="Shria voice guide" className="shria-guide" data-state={busy ? "connecting" : connected ? (muted ? "muted" : status === "Shria is speaking" ? "speaking" : "listening") : "idle"}>
      <span className="guide-label">Your mindfulness companion</span>
      <p className="guide-day">Day {day} · {title}</p>
      <div className="guide-identity"><div className="shria-orbit" aria-hidden="true"><span className="orbit-ring" /><span className="orbit-core" /><span className="orbit-spark" /></div>
      <h2>Practice with Shria</h2></div>
      <p className="guide-invitation">A familiar voice. A moment to reconnect.<br />Tell Shria how much time you have.</p>
      <div className="session-status"><span className="status-dot" aria-hidden="true" /><p role="status" aria-live="polite">{connected && muted ? "Microphone muted · you can still listen" : status}</p>{connected && <time aria-label="Session duration">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</time>}</div>
      {error && <p role="alert" className="voice-error">{error}</p>}
      <div className="voice-controls">
        {!connected && !busy && <button onClick={start} className="button button-primary">{error ? "Try again" : "Begin practice"}<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></svg></button>}
        {connected && <button onClick={() => { const next = !muted; session.current?.setMicMuted(next); setMuted(next); }} aria-pressed={muted} className="button button-secondary">{muted ? "Unmute" : "Mute"}</button>}
        {(connected || busy) && <button onClick={stop} className="button button-primary">{busy ? "Cancel" : "End"}</button>}
      </div>
      <p className="microphone-note">Microphone on only during your call.<br />You can end whenever you like.</p>
      {messages.length > 0 && <div ref={transcript} role="log" aria-label="Conversation transcript" tabIndex={0} onScroll={event => { const el = event.currentTarget; followTranscript.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48; }} className="conversation-transcript">{messages.map((item, i) => <p key={i}><strong>{item.source === "ai" ? "Shria" : "You"}</strong>{item.text}</p>)}</div>}
      <p className="voice-credit">Voice powered by ElevenLabs</p>
    </section>
  );
}
