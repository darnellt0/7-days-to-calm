"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShriaGuide from "./ShriaGuide";

interface DayProgress {
  day: number;
  unlocked: boolean;
  completed: boolean;
}

export default function SevenDaysToCalm() {
  const dayRef = useRef<number>(1);
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [finalComplete, setFinalComplete] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
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

  const clampDay = useCallback(
    (value: number) => Number.isFinite(Number(value)) ? Math.min(Math.max(Math.trunc(Number(value)), 1), dayThemes.length) : 1,
    [dayThemes.length]
  );

  const computeTodayDay = useCallback(() => {
    const startStr = localStorage.getItem("em_challenge_start");
    if (!startStr) return 1;
    try {
      const start = new Date(startStr);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return Number.isFinite(daysDiff) ? clampDay(daysDiff + 1) : 1;
    } catch {
      return 1;
    }
  }, [clampDay]);

  const pushDL = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event, ...payload });
  }, []);

  const syncDayState = useCallback(
    (value: number) => {
      const next = clampDay(value);
      dayRef.current = next;
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

  // Load saved progress once
  useEffect(() => {
    setFinalComplete(localStorage.getItem("em_challenge_complete") === "true");
    const savedDayStr = localStorage.getItem("em_challenge_day");
    const savedStart = localStorage.getItem("em_challenge_start");
    const savedDay = savedDayStr ? parseInt(savedDayStr, 10) : 1;
    setChallengeDayAndPersist(Number.isNaN(savedDay) ? 1 : savedDay);
    if (!savedStart) localStorage.setItem("em_challenge_start", new Date().toISOString());
  }, [setChallengeDayAndPersist]);

  const handleDayComplete = useCallback(
    (day: number) => {
      if (day === 7) {
        setFinalComplete(true);
        localStorage.setItem("em_challenge_complete", "true");
      }
      const next = setChallengeDayAndPersist(day + 1);
      pushDL("em_day_unlocked", { day, next_day: next });
    },
    [pushDL, setChallengeDayAndPersist]
  );

  const handleResetConfirm = useCallback(() => {
    localStorage.removeItem("em_challenge_day");
    localStorage.setItem("em_challenge_start", new Date().toISOString());
    localStorage.removeItem("em_challenge_complete");
    setFinalComplete(false);
    setChallengeDayAndPersist(1);
    setShowResetDialog(false);
    setShowToast(true);
    pushDL("em_challenge_reset");
    setTimeout(() => setShowToast(false), 3000);
  }, [pushDL, setChallengeDayAndPersist]);

  const handleSkipToTodayConfirm = useCallback(() => {
    const currentDay = dayRef.current;
    const today = computeTodayDay();
    setChallengeDayAndPersist(today);
    setShowSkipDialog(false);
    setShowToast(true);
    pushDL("em_jump_to_today", { from: currentDay, to: today, confirmed: true });
    setTimeout(() => setShowToast(false), 3000);
  }, [pushDL, setChallengeDayAndPersist, computeTodayDay]);

  const handleSkipTodayClick = useCallback(() => {
    const current = dayRef.current;
    const today = computeTodayDay();
    if (today > current) {
      setShowSkipDialog(true);
    } else {
      pushDL("em_jump_to_today", { from: current, to: current, confirmed: false });
    }
  }, [pushDL, computeTodayDay]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">7 Days to Calm</h1>
            <p className="text-gray-600">breathe reset rise</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="grid grid-cols-7 gap-1 items-start mb-4">
              {progress.map((p) => (
                <div key={p.day} className="min-w-0 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      (p.completed || (p.day === 7 && finalComplete))
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
                  <span className="w-full break-words text-center text-[10px] sm:text-xs leading-tight mt-2 text-gray-600">{dayThemes[p.day - 1].title}</span>
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

            <ShriaGuide key={currentDay}
              day={currentDay}
              title={dayThemes[currentDay - 1].title}
              onDayChange={setChallengeDayAndPersist}
              onEvent={pushDL}
            />
            {finalComplete && <p role="status" className="text-center text-teal-700">Seven days complete. Keep making time for calm.</p>}

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
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                aria-label={`Complete Day ${currentDay}`}
                id="em-continue-day"
              >
                Complete Day {currentDay}
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
