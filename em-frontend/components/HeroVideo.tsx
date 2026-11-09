"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function HeroVideo({ enabled, allowed, sessionActive }: {
  enabled: boolean;
  allowed: boolean;
  sessionActive: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const failedSources = useRef(new Set<string>());
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [requested, setRequested] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const canPlay = enabled && allowed && visible && foreground && !sessionActive && !failed;
  const playbackFailed = useCallback((cause: unknown) => {
    if (cause instanceof DOMException && cause.name === "NotAllowedError") setBlocked(true);
    else if (!(cause instanceof DOMException && cause.name === "AbortError")) {
      setFailed(true); setHasFrame(false);
    }
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setForeground(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => { if (enabled) { failedSources.current.clear(); setFailed(false); } }, [enabled]);
  useEffect(() => { if (!allowed) setHasFrame(false); }, [allowed]);
  useEffect(() => { if (canPlay) setRequested(true); }, [canPlay]);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let active = true;
    if (canPlay) {
      void element.play().then(() => { if (active) setBlocked(false); }).catch(cause => {
        if (active) playbackFailed(cause);
      });
    } else {
      element.pause();
      setBlocked(false);
    }
    return () => { active = false; element.pause(); };
  }, [canPlay, requested, allowed, failed, playbackFailed]);

  function retryPlayback() {
    if (!canPlay) return;
    void video.current?.play().then(() => setBlocked(false)).catch(playbackFailed);
  }

  function sourceFailed(format: string) {
    failedSources.current.add(format);
    if (failedSources.current.size === 2) { setFailed(true); setHasFrame(false); }
  }

  return <div className="hero-media" ref={container}>
    {allowed && requested && !failed && <video ref={video} className={`hero-video ${hasFrame ? "has-frame" : ""}`}
      width={960} height={640} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1}
      onPlaying={() => { setHasFrame(true); setBlocked(false); }}
      onError={event => { if (event.target === event.currentTarget) { setFailed(true); setHasFrame(false); } }}>
      <source src="/video/portal-loop.mp4" type="video/mp4" onError={() => sourceFailed("mp4")} />
      <source src="/video/portal-loop.webm" type="video/webm" onError={() => sourceFailed("webm")} />
    </video>}
    {blocked && canPlay && <button className="button button-primary hero-video-start" onClick={retryPlayback}>Play video</button>}
  </div>;
}
