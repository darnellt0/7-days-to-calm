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

export default function SevenDaysToCalm() {
  const convaiRef = useRef<HTMLElement | null>(null);
  const convaiListenersRef = useRef<{ call: EventListener; hangup: EventListener } | null>(null);
  const dayRef = useRef<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [signedUrl, setSignedUrl] = useState<string>("");
  const [signedUrlError, setSignedUrlError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);

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

  const pushDL = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  }, []);

  const syncDayState = useCallback(
    (value: number) => {
      const next = clampDay(value);
      setCurrentDay(next);
      setProgress(
        dayThemes.map((t) => ({
          day: t.day,
          unlocked: t.day <= next,
          completed: t.day < next,
        }))
      );
      return next;
    },
    [clampDay, dayThemes]
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

  // Load saved progress once
  useEffect(() => {
    const savedDayStr = localStorage.getItem("em_challenge_day");
    const savedStart = localStorage.getItem("em_challenge_start");
    const savedDay = savedDayStr ? parseInt(savedDayStr, 10) : 1;
    setChallengeDayAndPersist(Number.isNaN(savedDay) ? 1 : savedDay);
    if (!savedStart) localStorage.setItem("em_challenge_start", new Date().toISOString());
  }, [setChallengeDayAndPersist]);

  // Fetch signed URL whenever the day changes
  useEffect(() => {
    const controller = new AbortController();
    const base = backendBase?.replace(/\/$/, "") || "";
    if (!base) return undefined;
    const url = `${base}/convai/signed-url?challenge_day=${currentDay}`;

    const fetchSignedUrl = async () => {
      try {
        setSignedUrlError(null);
        const response = await fetch(url, { credentials: "omit", signal: controller.signal });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`HTTP ${response.status} ${response.statusText} | ${text}`);
        }
        const data = await response.json();
        if (!data?.signed_url) {
          throw new Error("Response missing signed_url");
        }
        setSignedUrl(data.signed_url);
        console.log("[EM] got signed url for day", currentDay);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("[EM] signed-url error", err);
        setSignedUrl("");
        const message = err instanceof Error ? err.message : "Unknown signed-url error";
        setSignedUrlError(message);
      }
    };

    fetchSignedUrl();
    return () => controller.abort();
  }, [backendBase, currentDay]);

  // Keep widget attributes aligned with the challenge day
  useEffect(() => {
    const el = convaiRef.current;
    if (!el) return;
    const safeDay = clampDay(currentDay);
    el.setAttribute("dynamic-variables", JSON.stringify({ challenge_day: safeDay }));
    const title = dayThemes[safeDay - 1]?.title ?? "Calm";
    el.setAttribute(
      "override-first-message",
      `Welcome to Day ${safeDay}: ${title}. How much time would you like? 2, 5, or 8 minutes?`
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
      pushDL("em_day_unlocked", { day, next_day: next });
    },
    [pushDL, setChallengeDayAndPersist]
  );

  const handleResetConfirm = useCallback(() => {
    localStorage.removeItem("em_challenge_day");
    localStorage.removeItem("em_challenge_start");
    setChallengeDayAndPersist(1);
    setShowResetDialog(false);
    setShowToast(true);
    pushDL("em_challenge_reset");
    setTimeout(() => setShowToast(false), 3000);
  }, [pushDL, setChallengeDayAndPersist]);

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
        node.setAttribute("dynamic-variables", JSON.stringify({ challenge_day: safeDay }));
        node.setAttribute(
          "override-first-message",
          `Welcome to Day ${safeDay}: ${title}. How much time would you like? 2, 5, or 8 minutes?`
        );
      };

      applyAttributes(dayRef.current);

      const handleCall: EventListener = (event) => {
        const custom = event as CustomEvent<{ config?: { clientTools?: Record<string, unknown> } }>;
        if (custom.detail?.config) {
          custom.detail.config.clientTools = {
            setChallengeDay: ({ day }: { day: number }) => {
              const next = setChallengeDayAndPersist(day);
              pushDL("em_day_unlocked", { day: next });
              return { day: next };
            },
            trackEvent: ({ name, payload }: { name?: string; payload?: Record<string, unknown> }) => {
              if (name) pushDL(name, payload || {});
            },
            openLink: ({ url }: { url?: string }) => {
              if (!url) return;
              try {
                window.open(url, "_blank", "noopener,noreferrer");
              } catch (err) {
                console.error("[EM] openLink failed", err);
              }
            },
            getChallengeDay: () => ({ day: dayRef.current }),
          };
        }
        pushDL("em_convai_started", { day: dayRef.current });
      };

      const handleHangup: EventListener = () => pushDL("em_convai_ended", { day: dayRef.current });

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
    if (!scriptLoaded) return "Loading Shria resources...";
    if (!widgetReady) return "Preparing Shria...";
    if (!signedUrl) return "Loading guide...";
    return "Loading guide...";
  })();

  return (
    <>
      {/* ElevenLabs ConvAI Widget Script */}
      <Script
        src="https://elevenlabs.io/convai-widget/index.js"
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
            <div className="w-full mx-auto my-4 min-h-[600px] bg-white rounded-lg shadow-lg p-4 relative">
              {canRenderWidget ? (
                <elevenlabs-convai
                  key={signedUrl}
                  ref={attachConvaiElement}
                  id="em-shria"
                  signed-url={signedUrl}
                  variant="full-width"
                  dynamic-variables={JSON.stringify({ challenge_day: currentDay })}
                  override-first-message={`Welcome to Day ${currentDay}: ${dayThemes[currentDay - 1].title}. How much time would you like? 2, 5, or 8 minutes?`}
                  action-text="Start today's practice"
                  start-call-text="Begin"
                  end-call-text="End"
                  expand-text="Open Shria"
                  listening-text="listening..."
                  speaking-text="speaking..."
                  avatar-orb-color-1="#176161"
                  avatar-orb-color-2="#e0cd67"
                ></elevenlabs-convai>
              ) : (
                <div className="text-center text-gray-500">
                  <p>{widgetStatusMessage}</p>
                  {signedUrlError && process.env.NODE_ENV !== "production" && (
                    <p className="text-xs mt-2 text-red-500 break-words">{signedUrlError}</p>
                  )}
                </div>
              )}
            </div>

            {canRenderWidget && (
              <div className="text-center text-sm text-gray-500">
                <p>Click "Start a call" to begin Day {currentDay}: {dayThemes[currentDay - 1].title}</p>
                <p className="text-xs mt-2">Shria already knows you're on Day {currentDay} of the challenge.</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => handleDayComplete(currentDay)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Complete Day {currentDay}
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowResetDialog(true)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

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

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Progress reset successfully!</span>
          </div>
        </div>
      )}
    </>
  );
}
