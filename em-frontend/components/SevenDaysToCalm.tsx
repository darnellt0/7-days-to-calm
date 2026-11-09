"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import ShriaGuide from "./ShriaGuide";
import ConfirmationDialog from "./ConfirmationDialog";
import MotionControl, { useAmbientMotion } from "./MotionControl";
import HeroVideo from "./HeroVideo";

const themes = [
  { title: "Arrive", description: "A gentle reset with breath and sound.", intention: "You don’t have to arrive feeling calm. Just arrive as you are." },
  { title: "Longer Exhale", description: "Find a softer rhythm: breathe in for 4, out for 6.", intention: "Let your next exhale be a little longer. There is no rush." },
  { title: "Body Scan", description: "Move from head to feet, noticing and releasing tension.", intention: "Meet your body with curiosity, rather than something to fix." },
  { title: "Label Thoughts", description: "Notice a thought, name it gently, return to your breath.", intention: "You don’t need an empty mind to make room for a quiet moment." },
  { title: "Box Breathing", description: "Explore a comfortable 4–4–4–4 rhythm.", intention: "Find your own steadiness. Every pause is optional." },
  { title: "Open Awareness", description: "Make room for sound, touch, and breath.", intention: "Let the moment come to you, one small sensation at a time." },
  { title: "Integration", description: "Return to your favorite practice and carry it forward.", intention: "Small moments of care can become a way of moving through life." },
];
const clampDay = (value: number) => Number.isFinite(value) ? Math.min(7, Math.max(1, Math.trunc(value))) : 1;

export default function SevenDaysToCalm() {
  const motion = useAmbientMotion();
  const [currentDay, setCurrentDay] = useState(1);
  const [finalComplete, setFinalComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [hasPracticed, setHasPracticed] = useState(false);
  const handleSessionActive = useCallback((active: boolean) => {
    setSessionActive(active);
    if (active) setHasPracticed(false);
  }, []);
  const handlePracticeEnd = useCallback(() => setHasPracticed(true), []);
  const [dialog, setDialog] = useState<"reset" | "skip" | null>(null);
  const [toast, setToast] = useState("");
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  const save = useCallback((key: string, value: string) => {
    try { localStorage.setItem(key, value); }
    catch { setStorageUnavailable(true); }
  }, []);
  const pushDL = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const target = window as Window & { dataLayer?: Record<string, unknown>[] };
    (target.dataLayer ||= []).push({ event, ...payload });
  }, []);

  useEffect(() => {
    try {
      setCurrentDay(clampDay(Number(localStorage.getItem("em_challenge_day") || 1)));
      setFinalComplete(localStorage.getItem("em_challenge_complete") === "true");
      if (!localStorage.getItem("em_challenge_start")) save("em_challenge_start", new Date().toISOString());
    } catch { setStorageUnavailable(true); }
    setLoaded(true);
  }, [save]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);

  const setChallengeDay = useCallback((value: number) => {
    // A day change unmounts the voice panel; require ending the call first.
    if (sessionActive) return currentDay;
    const next = clampDay(value);
    setCurrentDay(next);
    setHasPracticed(false);
    save("em_challenge_day", String(next));
    if (next < 7) { setFinalComplete(false); save("em_challenge_complete", "false"); }
    pushDL("em_day_set", { day: next });
    return next;
  }, [currentDay, pushDL, save, sessionActive]);

  function todayDay() {
    try {
      const start = localStorage.getItem("em_challenge_start");
      return start ? clampDay(Math.floor((Date.now() - Date.parse(start)) / 86400000) + 1) : 1;
    } catch { return currentDay; }
  }
  function completeDay() {
    if (sessionActive || !loaded || finalComplete) return;
    if (currentDay === 7) { setFinalComplete(true); save("em_challenge_complete", "true"); }
    else setChallengeDay(currentDay + 1);
    pushDL("em_day_unlocked", { day: currentDay, next_day: Math.min(currentDay + 1, 7) });
    setToast(currentDay === 7 ? "Seven days complete. Take this calm with you." : `Day ${currentDay} complete. Your next practice is ready.`);
  }
  function confirmDialog() {
    if (sessionActive) return;
    if (dialog === "reset") {
      setChallengeDay(1);
      setFinalComplete(false);
      save("em_challenge_complete", "false");
      save("em_challenge_start", new Date().toISOString());
      setToast("Progress reset successfully!");
      pushDL("em_challenge_reset");
    } else {
      const next = setChallengeDay(todayDay());
      setToast(`Moved to Day ${next}. Your practice is ready.`);
      pushDL("em_jump_to_today", { from: currentDay, to: next, confirmed: true });
    }
    setDialog(null);
  }
  const theme = themes[currentDay - 1];
  const completed = finalComplete ? 7 : currentDay - 1;

  return (
    <main className="calm-page" id="main-content" data-motion={motion.enabled ? "running" : "paused"} data-session-active={sessionActive}>
      <a className="skip-link" href="#practice">Skip to today’s practice</a>
      <header className="site-header"><a href="https://www.elevatedmovements.com" className="brand"><span className="brand-mark" aria-hidden="true">e<span>m</span></span><span>Elevated Movements</span></a><span className="header-note">A little space for yourself</span></header>
      <div className="challenge-shell">
        <header className="challenge-intro">
          <div className="intro-copy"><p className="eyebrow">A seven-day mindfulness journey</p><h1>Less noise.<br />More <em>calm.</em></h1><p>Seven days. A few minutes. A little more room to be yourself.</p><div className="intro-details"><span>7 Days to Calm</span><span>With your voice guide, Shria</span></div><a className="intro-start" href="#shria-widget-container">Go to your practice <span aria-hidden="true">↓</span></a></div>
          <div className="hero-art"><Image src="/images/calm-portal.png" alt="A luminous violet glass portal reflected in still water at a coral sunset" fill priority sizes="(max-width: 700px) 100vw, 50vw" /><HeroVideo enabled={motion.enabled} allowed={motion.ready && !motion.reduced} sessionActive={sessionActive} /><span className="hero-art-label">A softer state of mind</span><span className="hero-art-orbit" aria-hidden="true" /><MotionControl enabled={motion.enabled} ready={motion.ready} reduced={motion.reduced} onToggle={motion.toggle} /></div>
        </header>
        <section className="journey" aria-label="Challenge progress">
          <div className="journey-caption"><span>Your week of calm</span><span>{completed} of 7 days complete</span></div>
          <p className="mobile-current-day">Day {currentDay} of 7 <span aria-hidden="true">·</span> <strong>{theme.title}</strong></p>
          <ol className="day-steps">
            {themes.map((item, index) => {
              const day = index + 1;
              const done = day <= completed;
              return <li key={item.title} aria-current={day === currentDay ? "step" : undefined} className={`day-step ${done ? "is-complete" : day === currentDay ? "is-current" : ""}`}><span className="day-number" aria-hidden="true">{done ? "✓" : day}</span><span className="day-title" aria-hidden="true">{item.title}</span><span className="sr-only">Day {day}: {item.title}{done ? ", complete" : day === currentDay ? ", current" : ", upcoming"}</span></li>;
            })}
          </ol>
          <div className="journey-track" role="progressbar" aria-label="Days completed" aria-valuemin={0} aria-valuemax={7} aria-valuenow={completed}><span style={{ width: `${completed / 7 * 100}%` }} /></div>
        </section>
        <article className="practice-card" id="practice" aria-labelledby="practice-title">
          <div className="practice-intention" key={`intention-${currentDay}`}>
            <p className="eyebrow">Your daily pause · Day {currentDay.toString().padStart(2, "0")}</p>
            <h2 id="practice-title"><span className="sr-only">Day {currentDay}: </span>{theme.title}</h2>
            <p className="practice-description">{theme.description}</p>
            <div className="intention-note"><span aria-hidden="true">✦</span><p>{theme.intention}</p></div>
            <div className="practice-details"><span>2, 5, or 8 minutes</span><span>Guided by Shria</span></div>
            <p className="gentle-note">Find a comfortable seat. You can keep your eyes open, and make every practice your own.</p>
          </div>
          <ShriaGuide key={currentDay} day={currentDay} title={theme.title} onEvent={pushDL} onActiveChange={handleSessionActive} onPracticeEnd={handlePracticeEnd} />
          <footer className="practice-footer">
            <div><p className="footer-title">{finalComplete ? "Seven days complete. Keep making time for calm." : "A small practice is enough."}</p><p>{sessionActive ? "End your conversation before moving to the next day." : "When you feel ready, mark today’s practice complete."}</p></div>
            <button className={`button complete-button ${hasPracticed ? "button-primary is-ready" : "button-secondary"}`} disabled={!loaded || sessionActive || finalComplete} onClick={completeDay} aria-label={`Complete Day ${currentDay}`} id="em-continue-day">{finalComplete ? "Challenge complete ✓" : <>Complete Day {currentDay} <span aria-hidden="true">→</span></>}</button>
          </footer>
        </article>
        <div className="progress-tools"><span>Make this week work for you.</span><div><button disabled={!loaded || sessionActive} onClick={() => { if (todayDay() > currentDay) setDialog("skip"); else setToast("You’re already on today’s practice. Take it at your own pace."); }}>Skip to Today</button><span aria-hidden="true">·</span><button disabled={!loaded || sessionActive} onClick={() => setDialog("reset")} aria-label="Reset to Day 1">Start over</button></div></div>
        {storageUnavailable && <p role="status" className="storage-note">Your browser isn’t saving progress. You can still practice, but your place may reset when you leave.</p>}
        {finalComplete && <section className="next-chapter" aria-label="Continue your practice"><p className="eyebrow">A new beginning</p><h2>Keep a little calm in your day.</h2><p>The MenoPause Reset brings together daily practices, a reflection journal, and ongoing support.</p><a className="button button-gold" href="https://app.elevatedmovements.com" target="_blank" rel="noopener noreferrer">Explore The MenoPause Reset <span aria-hidden="true">↗</span></a><p className="offer-detail">$19 founding access · Use code <strong>RESET50</strong> for 50% off</p><a className="member-link" href="https://app.elevatedmovements.com" target="_blank" rel="noopener noreferrer">Already a member? Sign in →</a></section>}
        <footer className="site-footer"><span>Elevated Movements</span><p>Come as you are. Leave with a little more space.</p></footer>
      </div>
      {dialog && <ConfirmationDialog title={dialog === "reset" ? "Reset Progress?" : "Jump to Today?"} description={dialog === "reset" ? "This clears your completion progress and starts a new week at Day 1." : `You’re on Day ${currentDay}. Move to Day ${todayDay()} based on when you started?`} confirmLabel={dialog === "reset" ? "Reset Progress" : `Skip to Day ${todayDay()}`} onConfirm={confirmDialog} onClose={() => setDialog(null)} />}
      {toast && <div role="status" className="calm-toast">{toast}</div>}
    </main>
  );
}
