"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";

// TS: declare the web component props we use (signed-url). Do NOT include api-key or agent-id here.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          id?: string;
          "signed-url"?: string;
          "agent-id"?: string;
          variant?: string;
          "dynamic-variables"?: string;
          "override-first-message"?: string;
          "action-text"?: string;
          "start-call-text"?: string;
          "end-call-text"?: string;
          "expand-text"?: string;
          "listening-text"?: string;
          "speaking-text"?: string;
          "avatar-orb-color-1"?: string;
          "avatar-orb-color-2"?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface DayProgress {
  day: number;
  unlocked: boolean;
  completed: boolean;
}

// ElevenLabs signed URLs are valid for ~15 minutes. Refresh well before
// expiry, and treat anything older than the max age as unusable.
const SIGNED_URL_REFRESH_MS = 8 * 60 * 1000;
const SIGNED_URL_MAX_AGE_MS = 14 * 60 * 1000;

export default function SevenDaysToCalm() {
  const convaiRef = useRef<HTMLElement | null>(null);
  const convaiListenersRef = useRef<{ call: EventListener; hangup: EventListener } | null>(null);
  const dayRef = useRef<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [signedUrlError, setSignedUrlError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [coldStart, setColdStart] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inCallRef = useRef(false);
  const signedUrlRef = useRef("");
  const lastSignedUrlAtRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dayThemes = useMemo(
    () => [
      { day: 1, title: "Arrive", description: "2-min quick reset, breath + sound" },
      { day: 2, title: "Longer Exhale", description: "In 4 / Out 6, downshift" },
      { day: 3, title: "Body Scan", description: "Head to feet, release tension" },
      { day: 4, title: "Label Thoughts", description: "Notice thinking, return to breath" },
      { day: 5, title: "Box Breathing", description: "4-4-4-4, find steadiness" },
      { day: 6, title: "Open Awareness", description: "Sounds, touch, breath" },
      { day: 7, title: "Integration", description: "Choose your favorite practice" },
    ],
    []
  );

  const backendBase = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
    if (envBase) return envBase;
    if (typeof window === "undefined") {
      return "https://seven-days-to-calm.onrender.com";
    }
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8787";
    }
    return "https://seven-days-to-calm.onrender.com";
  }, []);

  const clampDay = useCallback(
    (value: number) => Math.min(Math.max(value, 1), dayThemes.length),
    [dayThemes.length]
  );

  const computeTodayDay = useCallback(() => {
    const startStr = localStorage.getItem("em_challenge_start");
    if (!startStr) return 1;
    try {
      const start = new Date(startStr);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return clampDay(daysDiff + 1);
    } catch {
      return 1;
    }
  }, [clampDay]);

  const pushDL = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  }, []);

  const flashToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(""), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const syncDayState = useCallback(
    (value: number) => {
      const next = clampDay(value);
      setCurrentDay(next);
      return next;
    },
    [clampDay]
  );

  const progress = useMemo<DayProgress[]>(
    () =>
      dayThemes.map((t) => ({
        day: t.day,
        unlocked: t.day <= currentDay,
        completed: challengeComplete || t.day < currentDay,
      })),
    [challengeComplete, currentDay, dayThemes]
  );

  const setChallengeDayAndPersist = useCallback(
    (value: number) => {
      const next = syncDayState(value);
      localStorage.setItem("em_challenge_day", String(next));
      pushDL("em_day_set", { day: next });
      return next;
    },
    [pushDL, syncDayState]
  );

  useEffect(() => {
    dayRef.current = currentDay;
  }, [currentDay]);

  useEffect(() => {
    if (widgetReady) return;
    if (typeof customElements === "undefined") return;
    const defined = customElements.get("elevenlabs-convai");
    if (defined) {
      setWidgetReady(true);
      return;
    }
    if (!("whenDefined" in customElements)) return;
    let cancelled = false;
    customElements
      .whenDefined("elevenlabs-convai")
      .then(() => {
        if (!cancelled) {
          setWidgetReady(true);
        }
      })
      .catch((err) => console.error("[EM] elevenlabs-convai definition error", err));
    return () => {
      cancelled = true;
    };
  }, [scriptLoaded, widgetReady]);

  useEffect(() => {
    if (!widgetReady) return;
    const widget = document.querySelector<HTMLElement>("elevenlabs-convai");
    if (widget) {
      widget.style.display = "block";
      widget.style.width = "100%";
      widget.style.height = "600px";
      widget.style.minHeight = "600px";
    }
  }, [widgetReady, signedUrl]);

  // Load saved progress once
  useEffect(() => {
    const savedDayStr = localStorage.getItem("em_challenge_day");
    const savedStart = localStorage.getItem("em_challenge_start");
    const savedDay = savedDayStr ? parseInt(savedDayStr, 10) : 1;
    setChallengeDayAndPersist(Number.isNaN(savedDay) ? 1 : savedDay);
    setChallengeComplete(localStorage.getItem("em_challenge_complete") === "1");
    if (!savedStart) localStorage.setItem("em_challenge_start", new Date().toISOString());
  }, [setChallengeDayAndPersist]);

  // Fetch signed URL whenever the day changes (or a refresh is requested).
  // Retries with backoff because the free-tier Render backend spins down when
  // idle and can take up to ~60s to wake on the first request of the day.
  useEffect(() => {
    const controller = new AbortController();
    const base = backendBase?.replace(/\/$/, "") || "";
    if (!base) return undefined;
    const url = `${base}/convai/signed-url?challenge_day=${currentDay}`;
    const RETRY_DELAYS_MS = [3000, 6000, 12000, 20000, 30000];

    let cancelled = false;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchSignedUrl = async () => {
      setSignedUrlError(null);
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        try {
          const response = await fetch(url, { credentials: "omit", signal: controller.signal });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status} ${response.statusText} | ${text}`);
          }
          const data = await response.json();
          if (!data?.signed_url) {
            throw new Error("Response missing signed_url");
          }
          if (cancelled) return;
          signedUrlRef.current = data.signed_url;
          lastSignedUrlAtRef.current = Date.now();
          setSignedUrl(data.signed_url);
          setColdStart(false);
          console.log("[EM] got signed url for day", currentDay);
          return;
        } catch (err) {
          if (controller.signal.aborted || cancelled) return;
          console.warn(`[EM] signed-url attempt ${attempt + 1} failed`, err);
          if (attempt === RETRY_DELAYS_MS.length) {
            setColdStart(false);
            const age = Date.now() - lastSignedUrlAtRef.current;
            if (signedUrlRef.current && age < SIGNED_URL_MAX_AGE_MS) {
              // The previous URL is still inside its validity window — keep
              // the widget up; the staleness check will retry the refresh.
              console.warn("[EM] keeping still-valid signed URL after refresh failure");
              return;
            }
            signedUrlRef.current = "";
            lastSignedUrlAtRef.current = 0;
            setSignedUrl("");
            const message = err instanceof Error ? err.message : "Unknown signed-url error";
            setSignedUrlError(message);
            return;
          }
          setColdStart(true);
          await wait(RETRY_DELAYS_MS[attempt]);
          if (controller.signal.aborted || cancelled) return;
        }
      }
    };

    fetchSignedUrl();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [backendBase, currentDay, refreshNonce]);

  // Signed URLs expire after ~15 minutes. Refresh a stale one in the
  // background (never mid-call) so a tab left open still connects.
  useEffect(() => {
    const maybeRefresh = () => {
      if (inCallRef.current) return;
      if (!lastSignedUrlAtRef.current) return;
      if (Date.now() - lastSignedUrlAtRef.current >= SIGNED_URL_REFRESH_MS) {
        setRefreshNonce((n) => n + 1);
      }
    };
    const interval = setInterval(maybeRefresh, 60_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") maybeRefresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  // Keep widget attributes aligned with the challenge day
  useEffect(() => {
    const el = convaiRef.current;
    if (!el) return;
    const safeDay = clampDay(currentDay);
    // Expanded dynamic variables for immediate tailoring
    const dyn = {
      challenge_day: safeDay,
      time_available: null,      // 2 | 5 | 8 | null
      energy: null,              // "wired"|"tired"|"scattered"|"anxious"|null
      environment: null,         // "desk"|"commute"|"bed"|null
      intent: null               // "sleep"|"pre-meeting"|null
    };
    el.setAttribute("dynamic-variables", JSON.stringify(dyn));
    const title = dayThemes[safeDay - 1]?.title ?? "Calm";
    // Softer, invitational first message (tone aligned with Shria coach)
    el.setAttribute(
      "override-first-message",
      `Hey, you made it. Day ${safeDay} — ${title}. Would 2, 5, or 8 minutes feel good right now?`
    );
  }, [clampDay, currentDay, dayThemes]);

  // Simple diagnostics to mirror the spec request
  useEffect(() => {
    const check = () => {
      const el = document.querySelector("elevenlabs-convai") as HTMLElement | null;
      const scriptTag = document.querySelector('script[src*="elevenlabs"]');
      console.log("[EM] script present:", !!scriptTag);
      console.log("[EM] convai element:", el);
      console.log("[EM] convai shadowRoot:", (el as any)?.shadowRoot);
    };
    check();
    const t1 = setTimeout(check, 1000);
    const t2 = setTimeout(check, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleDayComplete = useCallback(
    (day: number) => {
      const next = setChallengeDayAndPersist(day + 1);
      if (next > day) {
        pushDL("em_day_unlocked", { day, next_day: next });
        flashToast(`Day ${day} complete — Day ${next} unlocked!`);
      } else if (!challengeComplete) {
        setChallengeComplete(true);
        localStorage.setItem("em_challenge_complete", "1");
        pushDL("em_challenge_complete", { day });
        flashToast("You've completed all 7 days!");
      }
    },
    [challengeComplete, flashToast, pushDL, setChallengeDayAndPersist]
  );

  const handleResetConfirm = useCallback(() => {
    localStorage.removeItem("em_challenge_day");
    localStorage.removeItem("em_challenge_start");
    localStorage.removeItem("em_challenge_complete");
    setChallengeComplete(false);
    setChallengeDayAndPersist(1);
    setShowResetDialog(false);
    flashToast("Progress reset — back to Day 1.");
    pushDL("em_challenge_reset");
  }, [flashToast, pushDL, setChallengeDayAndPersist]);

  const handleSkipToTodayConfirm = useCallback(() => {
    const currentDay = dayRef.current;
    const today = computeTodayDay();
    setChallengeDayAndPersist(today);
    setShowSkipDialog(false);
    flashToast(`Jumped to Day ${today}.`);
    pushDL("em_jump_to_today", { from: currentDay, to: today, confirmed: true });
  }, [flashToast, pushDL, setChallengeDayAndPersist, computeTodayDay]);

  const handleSkipTodayClick = useCallback(() => {
    const current = dayRef.current;
    const today = computeTodayDay();
    if (today > current) {
      setShowSkipDialog(true);
    } else {
      pushDL("em_jump_to_today", { from: current, to: current, confirmed: false });
    }
  }, [pushDL, computeTodayDay]);

  useEffect(() => {
    const handleReady = () => console.log("[EM] widget ready");
    window.addEventListener("elevenlabs-convai-ready", handleReady as EventListener);
    if (typeof customElements !== "undefined" && "whenDefined" in customElements) {
      customElements.whenDefined("elevenlabs-convai").then(handleReady).catch(() => {});
    }
    return () => window.removeEventListener("elevenlabs-convai-ready", handleReady as EventListener);
  }, []);

  const attachConvaiElement = useCallback(
    (node: HTMLElement | null) => {
      if (convaiRef.current && convaiListenersRef.current) {
        convaiRef.current.removeEventListener("elevenlabs-convai:call", convaiListenersRef.current.call);
        convaiRef.current.removeEventListener("elevenlabs-convai:hangup", convaiListenersRef.current.hangup);
      }

      convaiRef.current = node;

      if (!node) {
        convaiListenersRef.current = null;
        return;
      }

      const applyAttributes = (dayValue: number) => {
        const safeDay = clampDay(dayValue);
        const title = dayThemes[safeDay - 1]?.title ?? "Calm";
        // Expanded dynamic variables for immediate tailoring
        const dyn = {
          challenge_day: safeDay,
          time_available: null,      // 2 | 5 | 8 | null
          energy: null,              // "wired"|"tired"|"scattered"|"anxious"|null
          environment: null,         // "desk"|"commute"|"bed"|null
          intent: null               // "sleep"|"pre-meeting"|null
        };
        node.setAttribute("dynamic-variables", JSON.stringify(dyn));
        // Softer, invitational first message (tone aligned with Shria coach)
        node.setAttribute(
          "override-first-message",
          `Hey, you made it. Day ${safeDay} — ${title}. Would 2, 5, or 8 minutes feel good right now?`
        );
      };

      applyAttributes(dayRef.current);

      const handleCall: EventListener = (event) => {
        inCallRef.current = true;
        const custom = event as CustomEvent<{ config?: { clientTools?: Record<string, unknown> } }>;
        if (custom.detail?.config) {
          custom.detail.config.clientTools = {
            setChallengeDay: ({ day }: { day: number }) => {
              const next = setChallengeDayAndPersist(day);
              pushDL("em_day_unlocked", { day: next });
              return { ok: true, day: next };
            },
            trackEvent: ({ name, payload }: { name?: string; payload?: Record<string, unknown> }) => {
              pushDL(name || "em_custom", payload || {});
              return { ok: true };
            },
            openLink: ({ url }: { url?: string }) => {
              try {
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              } catch (err) {
                console.error("[EM] openLink failed", err);
              }
              return { ok: true };
            },
            getChallengeDay: () => ({ day: dayRef.current }),
            setReminder: ({ time, label }: { time?: string; label?: string }) => {
              try {
                localStorage.setItem("em_reminder", JSON.stringify({ time, label }));
                pushDL("em_reminder_set", { time, label });
                return { ok: true };
              } catch (err) {
                pushDL("em_reminder_error", { message: String(err) });
                return { ok: false, error: String(err) };
              }
            },
          };
        }

        // Start event with richer context (if dyn vars were set earlier)
        let dyn: Record<string, unknown> = {};
        try {
          const dynStr = convaiRef.current?.getAttribute("dynamic-variables");
          if (dynStr) dyn = JSON.parse(dynStr);
        } catch (err) {
          console.error("[EM] Failed to parse dynamic-variables", err);
        }
        pushDL("em_convai_started", {
          day: dayRef.current,
          time_available: dyn.time_available || null,
          intent: dyn.intent || null,
        });
      };

      const handleHangup: EventListener = () => {
        inCallRef.current = false;
        pushDL("em_convai_ended", { day: dayRef.current });
      };

      node.addEventListener("elevenlabs-convai:call", handleCall);
      node.addEventListener("elevenlabs-convai:hangup", handleHangup);
      convaiListenersRef.current = { call: handleCall, hangup: handleHangup };
    },
    [clampDay, dayThemes, pushDL, setChallengeDayAndPersist]
  );

  const canRenderWidget = widgetReady && Boolean(signedUrl) && !scriptFailed && !signedUrlError;
  const widgetStatusMessage = (() => {
    if (scriptFailed) return "Shria widget script failed to load.";
    if (signedUrlError) return "Unable to load Shria guide.";
    if (coldStart) return "Shria is waking up — the first visit of the day can take up to a minute…";
    if (!scriptLoaded) return "Loading Shria resources...";
    if (!widgetReady) return "Preparing Shria...";
    if (!signedUrl) return "Loading guide...";
    return "Loading guide...";
  })();

  return (
    <>
      {/* ElevenLabs ConvAI Widget Script */}
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={(event) => {
          console.error("[EM] convai widget script failed to load", event);
          setScriptFailed(true);
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">7 Days to Calm</h1>
            <p className="text-gray-600">breathe reset rise</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              {progress.map((p) => (
                <div key={p.day} className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      p.completed
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : p.day === currentDay
                        ? "bg-blue-500 text-white ring-4 ring-blue-200"
                        : p.unlocked
                        ? "bg-gray-300 text-gray-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {p.day}
                  </div>
                  <span className="text-xs mt-2 text-gray-600">{dayThemes[p.day - 1].title}</span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{
                  width: `${
                    dayThemes.length > 1 ? ((currentDay - 1) / (dayThemes.length - 1)) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Day {currentDay}: {dayThemes[currentDay - 1].title}
              </h2>
              <p className="text-gray-600">{dayThemes[currentDay - 1].description}</p>
            </div>

            {/* Widget container */}
            <div
              id="shria-widget-container"
              className="w-full max-w-4xl mx-auto my-8"
              style={{
                display: "block",
                visibility: "visible",
                height: "600px",
                minHeight: "600px",
                overflow: "visible",
              }}
            >
              {canRenderWidget ? (
                React.createElement("elevenlabs-convai", {
                  key: signedUrl,
                  ref: attachConvaiElement as unknown as React.Ref<HTMLElement>,
                  id: "em-shria",
                  "signed-url": signedUrl,
                  "agent-id": "agent_4201k708pqxsed39y0vsz05gn66e",
                  variant: "full-width",
                  style: {
                    display: "block",
                    width: "100%",
                    height: "600px",
                    minHeight: "600px",
                  },
                  "dynamic-variables": JSON.stringify({
                    challenge_day: currentDay,
                    time_available: null,
                    energy: null,
                    environment: null,
                    intent: null,
                  }),
                  "override-first-message": `Hey, you made it. Day ${currentDay} — ${dayThemes[currentDay - 1].title}. Would 2, 5, or 8 minutes feel good right now?`,
                  "action-text": "Start today's practice",
                  "start-call-text": "Begin",
                  "end-call-text": "End",
                  "expand-text": "Open Shria",
                  "listening-text": "listening...",
                  "speaking-text": "speaking...",
                  "avatar-orb-color-1": "#176161",
                  "avatar-orb-color-2": "#e0cd67",
                })
              ) : (
                <div className="text-center text-gray-500">
                  <p>{widgetStatusMessage}</p>
                  {signedUrlError && (
                    <button
                      onClick={() => {
                        setSignedUrlError(null);
                        setRefreshNonce((n) => n + 1);
                      }}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Try again
                    </button>
                  )}
                  {signedUrlError && process.env.NODE_ENV !== "production" && (
                    <p className="text-xs mt-2 text-red-500 break-words">{signedUrlError}</p>
                  )}
                </div>
              )}
            </div>

            {canRenderWidget && (
              <div className="text-center text-sm text-gray-500">
                <p>Click "Begin" to start Day {currentDay}: {dayThemes[currentDay - 1].title}</p>
                <p className="text-xs mt-2">Shria already knows you're on Day {currentDay} of the challenge.</p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-3">
              <button
                onClick={() => setShowResetDialog(true)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                aria-label="Reset to Day 1"
              >
                Reset to Day 1
              </button>
              <button
                onClick={handleSkipTodayClick}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                aria-label="Skip to Today"
              >
                Skip to Today
              </button>
              <button
                onClick={() => handleDayComplete(currentDay)}
                disabled={challengeComplete}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg enabled:hover:bg-blue-600 transition-colors font-medium disabled:bg-green-500 disabled:cursor-default"
                aria-label={challengeComplete ? "Challenge complete" : "Mark today's practice complete"}
                id="em-continue-day"
              >
                {challengeComplete ? "Challenge Complete ✓" : `Mark Day ${currentDay} Complete`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day 7 Upsell Banner — shown when user reaches Day 7 */}
      {currentDay === 7 && (
        <div className="mt-8 mx-auto max-w-2xl">
          <div
            style={{
              background: "linear-gradient(135deg, #36013f 0%, #176161 100%)",
              borderRadius: "20px",
              padding: "32px",
              textAlign: "center",
              color: "#fff",
              boxShadow: "0 8px 40px rgba(54,1,63,0.25)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #e0cd67, #c3b4b3)",
                color: "#0b0f10",
                fontWeight: 700,
                borderRadius: "999px",
                padding: "6px 16px",
                fontSize: "12px",
                letterSpacing: "0.08em",
                marginBottom: "16px",
              }}
            >
              🎉 You completed the 7-Day Reset
            </div>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "clamp(22px, 3vw, 30px)",
                fontWeight: 700,
                marginBottom: "12px",
                color: "#e0cd67",
              }}
            >
              The MenoPause Reset — Full App
            </h2>
            <p
              style={{
                fontSize: "15px",
                opacity: 0.9,
                marginBottom: "24px",
                lineHeight: 1.6,
                maxWidth: "480px",
                margin: "0 auto 24px",
              }}
            >
              You&apos;ve been breathing with intention. Now go deeper. The full app includes guided daily practices, a reflection journal, and ongoing support — all in one sacred space.
            </p>
            <a
              href="https://app.elevatedmovements.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                background: "#e0cd67",
                color: "#36013f",
                fontWeight: 700,
                borderRadius: "12px",
                padding: "14px 28px",
                fontSize: "15px",
                textDecoration: "none",
                marginBottom: "12px",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              Start Day 1 — $19 Founding Access ↗
            </a>
            <p
              style={{
                fontSize: "12px",
                opacity: 0.7,
                marginTop: "8px",
              }}
            >
              24-hour founding member offer · Use code <strong>RESET50</strong> for 50% off
            </p>
            <a
              href="https://app.elevatedmovements.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: "12px",
                fontSize: "13px",
                color: "#c3b4b3",
                textDecoration: "underline",
              }}
            >
              Already a member? Sign in →
            </a>
          </div>
        </div>
      )}

      {/* Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Reset Progress?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your progress? This will take you back to Day 1 and clear all your completion
              data.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Skip to Today Dialog */}
      {showSkipDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Jump to Today?</h3>
            <p className="text-gray-600 mb-6">
              You're currently on Day {dayRef.current}. Skip to Day {computeTodayDay()}?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSkipDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSkipToTodayConfirm}
                className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Skip to Day {computeTodayDay()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </>
  );
}
