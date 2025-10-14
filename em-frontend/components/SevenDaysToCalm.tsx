"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";

interface DayProgress {
  day: number;
  unlocked: boolean;
  completed: boolean;
}

export default function SevenDaysToCalm() {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [progress, setProgress] = useState<DayProgress[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const dayThemes = [
    { day: 1, title: "Arrive", description: "2-min quick reset, breath + sound" },
    { day: 2, title: "Longer Exhale", description: "In 4 / Out 6, downshift" },
    { day: 3, title: "Body Scan", description: "Head to feet, release tension" },
    { day: 4, title: "Label Thoughts", description: "Notice thinking, return to breath" },
    { day: 5, title: "Box Breathing", description: "4-4-4-4, find steadiness" },
    { day: 6, title: "Open Awareness", description: "Sounds, touch, breath" },
    { day: 7, title: "Integration", description: "Choose your favorite practice" },
  ];

  useEffect(() => {
    // Load progress from localStorage
    const savedDayStr = localStorage.getItem("em_challenge_day");
    const savedStart = localStorage.getItem("em_challenge_start");
    const savedDay = Math.min(Math.max(parseInt(savedDayStr || "1", 10) || 1, 1), 7);

    setCurrentDay(savedDay);

    if (!savedStart) {
      localStorage.setItem("em_challenge_start", new Date().toISOString());
    }

    // Initialize progress using the saved day (not stale state)
    setProgress(
      dayThemes.map((theme) => ({
        day: theme.day,
        unlocked: theme.day <= savedDay,
        completed: theme.day < savedDay,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDayComplete = (day: number) => {
    const newDay = Math.min(day + 1, 7);
    setCurrentDay(newDay);
    localStorage.setItem("em_challenge_day", String(newDay));

    setProgress((prev) =>
      prev.map((p) => ({
        ...p,
        completed: p.day < newDay,
        unlocked: p.day <= newDay,
      }))
    );

    // GTM
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: "em_day_unlocked", day, next_day: newDay });
  };

  const handleResetConfirm = () => {
    localStorage.removeItem("em_challenge_day");
    localStorage.removeItem("em_challenge_start");
    setCurrentDay(1);
    setProgress(
      dayThemes.map((t) => ({
        day: t.day,
        unlocked: t.day === 1,
        completed: false,
      }))
    );
    setShowResetDialog(false);
    setShowToast(true);

    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: "em_challenge_reset" });

    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <>
      {/* Load the official ElevenLabs widget script */}
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        async
        type="text/javascript"
      />

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">7 Days to Calm</h1>
            <p className="text-gray-600">breathe · reset · rise</p>
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
                  <span className="text-xs mt-2 text-gray-600">
                    {dayThemes[p.day - 1].title}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${((currentDay - 1) / 6) * 100}%` }}
              />
            </div>
          </div>

          {/* Current Day Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Day {currentDay}: {dayThemes[currentDay - 1].title}
              </h2>
              <p className="text-gray-600">{dayThemes[currentDay - 1].description}</p>
            </div>

            {/* Widget container */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 relative overflow-hidden shadow-inner">
              {/* decorative blobs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full opacity-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-200 rounded-full opacity-20 blur-3xl" />

              {/* ElevenLabs Widget - Shria meditation guide */}
              <div
                className="rounded-lg relative z-10 bg-white"
                style={{
                  minHeight: '600px',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                dangerouslySetInnerHTML={{
                  __html: '<elevenlabs-convai agent-id="agent_4201k708pqxsed39y0vsz05gn66e" variant="full-width"></elevenlabs-convai>'
                }}
              />
            </div>

            {/* Complete Day Button */}
            <div className="mt-6 text-center">
              <button
                onClick={() => handleDayComplete(currentDay)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Complete Day {currentDay}
              </button>
            </div>
          </div>

          {/* Small helpers */}
          <div className="text-center text-gray-600 text-sm mb-6">
            <p>Complete each day's practice to unlock the next session</p>
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

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Reset Progress?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset your progress? This will take you back to Day 1 and clear all
              your completion data.
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

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
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
