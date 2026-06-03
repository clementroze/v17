import React, { useCallback, useEffect, useRef, useState } from "react";

// Custom-chromed video player for case-study image blocks. Wraps a native
// <video> (autoplay/loop/muted, same as before) but hides the browser's default
// controls in favour of an accessible overlay: a real <button> for play/pause
// and an <input type="range"> for the scrubber, so keyboard and screen-reader
// users get proper semantics. Controls fade in on hover/focus, fade out when idle.

// Format a number of seconds as m:ss (drops to 0:00 while metadata loads).
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <rect x="7" y="5" width="3.5" height="14" rx="1" />
    <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
  </svg>
);

// Four corner brackets pointing outward — the standard "enter fullscreen" glyph.
const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M5 9V6a1 1 0 0 1 1-1h3M19 9V6a1 1 0 0 0-1-1h-3M5 15v3a1 1 0 0 0 1 1h3M19 15v3a1 1 0 0 1-1 1h-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Brackets pointing inward — "exit fullscreen".
const ExitFullscreenIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M9 5v3a1 1 0 0 1-1 1H5M15 5v3a1 1 0 0 0 1 1h3M9 19v-3a1 1 0 0 0-1-1H5M15 19v-3a1 1 0 0 1 1-1h3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Props = {
  src: string;
  label?: string;
  /** Known aspect ratio (width / height). When provided, the wrapper reserves a
   *  correctly-sized box BEFORE the video's metadata loads — without it the
   *  element is 0×0 until decode, which breaks the lightbox's open morph. */
  aspectRatio?: number;
};

export default function CaseStudyVideo({ src, label, aspectRatio }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  // Fraction (0–1) of the track the cursor is hovering, or null when not over
  // it. Drives the faint "ghost" thumb that previews where a click would seek.
  const [ghost, setGhost] = useState<number | null>(null);

  // Mirror the <video>'s actual state into React. The element drives the truth
  // (autoplay, loop, end-of-media), so we subscribe to its events rather than
  // assume our button clicks are the only thing changing playback.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrent(video.currentTime);
    const onMeta = () => setDuration(video.duration);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    // Metadata may already be present if the video loaded before this ran.
    if (video.readyState >= 1) setDuration(video.duration);
    setPlaying(!video.paused);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      // play() returns a promise that rejects if interrupted; ignore.
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  const onScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = Number(e.target.value);
    video.currentTime = time;
    setCurrent(time);
  }, []);

  // Update the ghost-thumb position from the pointer's X over the track.
  const onScrubberHover = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const frac = (e.clientX - rect.left) / rect.width;
      setGhost(Math.min(1, Math.max(0, frac)));
    },
    [],
  );
  const clearGhost = useCallback(() => setGhost(null), []);

  // Seek relative to the current position, clamped to [0, duration].
  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.min(
      Math.max(0, video.currentTime + delta),
      video.duration || video.currentTime,
    );
    video.currentTime = next;
    setCurrent(next);
  }, []);

  // Track fullscreen state from the document so the icon reflects exits
  // triggered by Esc or the browser chrome, not just our button.
  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    const wrap = wrapRef.current;
    if (wrap?.requestFullscreen) {
      // Fullscreen the wrapper so our overlay controls stay visible.
      void wrap.requestFullscreen().catch(() => {});
      return;
    }
    // iOS Safari only supports fullscreen on the <video> element itself, which
    // shows the native controls (our overlay isn't available there).
    const video = videoRef.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null;
    video?.webkitEnterFullscreen?.();
  }, []);

  // Keyboard shortcuts, scoped to the focused player (the wrapper is
  // focusable). Mirrors common video-player conventions:
  //   Space / k  → play-pause   j / ←  → back   l / →  → forward   f → fullscreen
  // Arrow keys are left to the native <input type="range"> when it has focus,
  // so seeking the scrubber by keyboard isn't doubled up.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const onScrubber =
        (e.target as HTMLElement)?.classList?.contains("cs-video__scrubber") ??
        false;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "j":
        case "J":
          e.preventDefault();
          seekBy(-10);
          break;
        case "l":
        case "L":
          e.preventDefault();
          seekBy(10);
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "ArrowLeft":
          if (onScrubber) break; // let the range input handle it
          e.preventDefault();
          seekBy(-5);
          break;
        case "ArrowRight":
          if (onScrubber) break;
          e.preventDefault();
          seekBy(5);
          break;
      }
    },
    [togglePlay, seekBy, toggleFullscreen],
  );

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      className={`cs-video${fullscreen ? " cs-video--fullscreen" : ""}`}
      ref={wrapRef}
      role="group"
      aria-label="Video player"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={aspectRatio ? ({ aspectRatio: String(aspectRatio) } as React.CSSProperties) : undefined}
    >
      {fullscreen && label && (
        <div className="cs-video__label">{label}</div>
      )}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        onClick={togglePlay}
      />
      <div className="cs-video__controls">
        <button
          type="button"
          className="cs-video__play"
          onClick={togglePlay}
          aria-label={playing ? "Pause video" : "Play video"}
          aria-pressed={playing}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className="cs-video__time cs-video__time--current" aria-hidden="true">
          {formatTime(current)}
        </span>

        <div className="cs-video__scrub">
          <input
            type="range"
            className="cs-video__scrubber"
            min={0}
            max={duration || 0}
            step="any"
            value={current}
            onChange={onScrub}
            onPointerMove={onScrubberHover}
            onPointerLeave={clearGhost}
            aria-label="Seek video"
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            style={
              {
                "--cs-video-progress": `${progress}%`,
                // Let the slider own horizontal drags so scrubbing never triggers
                // the browser's back/forward edge-swipe (paired with the global
                // overscroll-behavior-x guard).
                touchAction: "none",
              } as React.CSSProperties
            }
          />
          {/* The only thumb: shown at the cursor position while hovering the
              track. The native range thumb (the playhead) is hidden, so this
              follows the mouse as a tentative-seek marker. */}
          {ghost !== null && (
            <span
              className="cs-video__ghost"
              aria-hidden="true"
              style={{ left: `${ghost * 100}%` }}
            />
          )}
        </div>

        <span className="cs-video__time cs-video__time--duration" aria-hidden="true">
          {formatTime(duration)}
        </span>

        <button
          type="button"
          className="cs-video__play cs-video__fullscreen"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          aria-pressed={fullscreen}
        >
          {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
        </button>
      </div>
    </div>
  );
}
