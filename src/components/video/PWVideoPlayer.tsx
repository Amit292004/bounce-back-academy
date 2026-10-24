"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Lock,
  List,
  Sparkles,
  ArrowLeft,
  X,
  Check,
  HelpCircle,
  ChevronRight,
  Gauge,
  Plus,
  Minus
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./PWVideoPlayer.module.css";

export interface LectureChapter {
  id?: string;
  title: string;
  timestamp: number; // in seconds
  description?: string;
}

export interface PWVideoPlayerProps {
  video?: {
    id?: string;
    title?: string;
    youtubeLink?: string;
    pdfUrl?: string | null;
    lectureNumber?: number;
    likesCount?: number;
    sharesCount?: number;
    favoritesCount?: number;
  };
  src?: string;
  youtubeUrl?: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  pdfNotesUrl?: string | null;
  chapters?: LectureChapter[];
  onBack?: () => void;
  onAskDoubt?: (timestamp: number, lectureTitle?: string) => void;
  autoPlay?: boolean;
  className?: string;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const QUALITY_OPTIONS = ["Auto", "1080p Full HD", "720p HD", "480p Medium", "360p Data Saver", "240p Ultra Saver"];

export default function PWVideoPlayer({
  video,
  src,
  youtubeUrl: initialYoutubeUrl,
  poster,
  title: initialTitle,
  subtitle = "Online Class Lecture",
  pdfNotesUrl: initialPdfNotesUrl,
  chapters = [],
  onBack,
  onAskDoubt,
  autoPlay = false,
  className = ""
}: PWVideoPlayerProps) {
  const youtubeUrl = initialYoutubeUrl || video?.youtubeLink;
  const title = initialTitle || video?.title || "Physics Wallah Video Lecture";
  const pdfNotesUrl = initialPdfNotesUrl !== undefined ? initialPdfNotesUrl : video?.pdfUrl;
  const router = useRouter();
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speedToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [buffered, setBuffered] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [quality, setQuality] = useState<string>("720p HD");
  const [isBuffering, setIsBuffering] = useState<boolean>(false);

  // UI state
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeDrawer, setActiveDrawer] = useState<"none" | "speed" | "quality" | "chapters" | "shortcuts">("none");
  const [showRemaining, setShowRemaining] = useState<boolean>(false);
  const [speedToast, setSpeedToast] = useState<string | null>(null);

  // Gesture indicators
  const [rippleLeft, setRippleLeft] = useState<boolean>(false);
  const [rippleRight, setRippleRight] = useState<boolean>(false);

  // Extract YouTube ID if applicable
  const youtubeId = useMemo(() => {
    if (!youtubeUrl) return null;
    const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?/\s]{11})/);
    return match ? match[1] : null;
  }, [youtubeUrl]);

  const hasDirectVideo = !!src;

  // Active Chapter detection
  const activeChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;
    let current = chapters[0];
    for (const ch of chapters) {
      if (currentTime >= ch.timestamp) {
        current = ch;
      } else {
        break;
      }
    }
    return current;
  }, [chapters, currentTime]);

  // Formatter for seconds -> MM:SS or HH:MM:SS
  const formatTime = useCallback((seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }, []);

  // Controls auto-hide manager
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && activeDrawer === "none" && !isLocked) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying, activeDrawer, isLocked]);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, activeDrawer, resetControlsTimer]);

  // Sync fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Dispatch command to YouTube iframe if applicable
  const sendYouTubeCommand = useCallback((func: string, args: unknown[] = []) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*"
      );
    }
  }, []);

  // Core Playback Speed Changer
  const changePlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(3, rate));
    setPlaybackRate(clampedRate);

    // Apply to direct HTML5 video
    const video = videoRef.current;
    if (video) {
      video.playbackRate = clampedRate;
      video.defaultPlaybackRate = clampedRate;
    }

    // Apply to YouTube iframe
    sendYouTubeCommand("setPlaybackRate", [clampedRate]);

    // Show temporary speed toast confirmation
    if (speedToastTimeoutRef.current) clearTimeout(speedToastTimeoutRef.current);
    setSpeedToast(`${clampedRate === 1 ? "1.0x Normal" : `${clampedRate}x`} Speed`);
    speedToastTimeoutRef.current = setTimeout(() => {
      setSpeedToast(null);
    }, 1200);

    resetControlsTimer();
  }, [sendYouTubeCommand, resetControlsTimer]);

  // Load saved quality preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pw_video_quality");
      if (saved && QUALITY_OPTIONS.includes(saved)) {
        setQuality(saved);
      }
    } catch {}
  }, []);

  // Change Video Quality Handler
  const changeQuality = useCallback((newQuality: string) => {
    setQuality(newQuality);
    try {
      localStorage.setItem("pw_video_quality", newQuality);
    } catch {}

    const mapQualityToYT = (q: string) => {
      if (q.includes("1080")) return "hd1080";
      if (q.includes("720")) return "hd720";
      if (q.includes("480")) return "large";
      if (q.includes("360")) return "medium";
      if (q.includes("240")) return "small";
      return "default";
    };

    sendYouTubeCommand("setPlaybackQuality", [mapQualityToYT(newQuality)]);
    sendYouTubeCommand("setPlaybackQualityRange", [mapQualityToYT(newQuality), mapQualityToYT(newQuality)]);

    if (speedToastTimeoutRef.current) clearTimeout(speedToastTimeoutRef.current);
    setSpeedToast(`Quality: ${newQuality}`);
    speedToastTimeoutRef.current = setTimeout(() => {
      setSpeedToast(null);
    }, 1400);

    setActiveDrawer("none");
    resetControlsTimer();
  }, [sendYouTubeCommand, resetControlsTimer]);

  // Faster / Slower Steppers
  const stepSpeedFaster = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.findIndex((r) => Math.abs(r - playbackRate) < 0.05);
    let nextRate: number;
    if (currentIdx !== -1) {
      nextRate = SPEED_OPTIONS[Math.min(SPEED_OPTIONS.length - 1, currentIdx + 1)];
    } else {
      nextRate = Math.min(3, Math.round((playbackRate + 0.25) * 100) / 100);
    }
    changePlaybackRate(nextRate);
  }, [playbackRate, changePlaybackRate]);

  const stepSpeedSlower = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.findIndex((r) => Math.abs(r - playbackRate) < 0.05);
    let prevRate: number;
    if (currentIdx !== -1) {
      prevRate = SPEED_OPTIONS[Math.max(0, currentIdx - 1)];
    } else {
      prevRate = Math.max(0.25, Math.round((playbackRate - 0.25) * 100) / 100);
    }
    changePlaybackRate(prevRate);
  }, [playbackRate, changePlaybackRate]);

  // HTML5 Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Apply sticky playback rate
    video.playbackRate = playbackRate;
    video.defaultPlaybackRate = playbackRate;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0 && video.duration > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      video.playbackRate = playbackRate;
      if (autoPlay) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      // Ensure browser doesn't reset playbackRate on play
      video.playbackRate = playbackRate;
    };

    const onRateChange = () => {
      if (video.playbackRate && Math.abs(video.playbackRate - playbackRate) > 0.01) {
        setPlaybackRate(video.playbackRate);
      }
    };

    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      video.playbackRate = playbackRate;
    };
    const onEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ratechange", onRateChange);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ratechange", onRateChange);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("ended", onEnded);
    };
  }, [autoPlay, src, playbackRate]);

  // Video Actions
  const togglePlay = useCallback(() => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimer();
  }, [isLocked, resetControlsTimer]);

  const seekRelative = useCallback((seconds: number) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimer();

    if (seconds < 0) {
      setRippleLeft(true);
      setTimeout(() => setRippleLeft(false), 650);
    } else {
      setRippleRight(true);
      setTimeout(() => setRippleRight(false), 650);
    }
  }, [isLocked, resetControlsTimer]);

  const seekTo = useCallback((timeInSeconds: number) => {
    if (isLocked) return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, timeInSeconds));
    setCurrentTime(video.currentTime);
    resetControlsTimer();
  }, [isLocked, resetControlsTimer]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
    resetControlsTimer();
  }, [isMuted, volume, resetControlsTimer]);

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const val = Math.max(0, Math.min(1, x / rect.width));
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
    resetControlsTimer();
  }, [resetControlsTimer]);

  const toggleFullscreen = useCallback(async () => {
    if (!playerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await playerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignored
    }
  }, []);

  // Timeline Scrubber Click & Drag
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked || !videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const targetPercent = Math.max(0, Math.min(1, x / rect.width));
    seekTo(targetPercent * duration);
  }, [isLocked, duration, seekTo]);

  // Double tap / Click gesture detector
  const handleZoneTouch = (zone: "left" | "center" | "right", e: React.MouseEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const now = Date.now();
    const timeDiff = now - lastTapRef.current.time;

    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected!
      if (zone === "left") {
        seekRelative(-10);
      } else if (zone === "right") {
        seekRelative(10);
      } else {
        togglePlay();
      }
      lastTapRef.current = { time: 0, x: e.clientX };
    } else {
      lastTapRef.current = { time: now, x: e.clientX };
      if (zone === "center") {
        togglePlay();
      }
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          seekRelative(10);
          break;
        case "arrowup":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.min(1, (videoRef.current.volume || 0) + 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
            setIsMuted(false);
          }
          break;
        case "arrowdown":
          e.preventDefault();
          if (videoRef.current) {
            const nextVol = Math.max(0, (videoRef.current.volume || 0) - 0.1);
            videoRef.current.volume = nextVol;
            setVolume(nextVol);
          }
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "c":
          e.preventDefault();
          setActiveDrawer(prev => prev === "chapters" ? "none" : "chapters");
          break;
        case ">":
        case ".":
        case "]":
          e.preventDefault();
          stepSpeedFaster();
          break;
        case "<":
        case ",":
        case "[":
          e.preventDefault();
          stepSpeedSlower();
          break;
        case "?":
          e.preventDefault();
          setActiveDrawer(prev => prev === "shortcuts" ? "none" : "shortcuts");
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, seekRelative, toggleMute, toggleFullscreen, stepSpeedFaster, stepSpeedSlower]);

  // Navigate to Ask AI Doubt solver with timestamp
  const handleAskDoubtClick = () => {
    if (videoRef.current && isPlaying) {
      videoRef.current.pause();
    }
    if (onAskDoubt) {
      onAskDoubt(currentTime, title);
    } else {
      const q = encodeURIComponent(`Regarding "${title}" at ${formatTime(currentTime)}: `);
      router.push(`/ask?doubt=${q}`);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerRef}
      className={`${styles.playerWrapper} ${className}`}
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
      onMouseLeave={() => {
        if (isPlaying && activeDrawer === "none") setShowControls(false);
      }}
    >
      {/* Video Content */}
      {hasDirectVideo ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className={styles.videoElement}
          playsInline
        />
      ) : youtubeId ? (
        <div className={styles.youtubeWrapper}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&enablejsapi=1`}
            title={title}
            className={styles.youtubeIframe}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div style={{ color: "#94a3b8", textAlign: "center", padding: "2rem" }}>
          No video source provided.
        </div>
      )}

      {/* Double Tap Seek Gesture Zones */}
      {hasDirectVideo && (
        <div className={styles.touchZoneLayer}>
          <div
            className={styles.touchZoneLeft}
            onClick={(e) => handleZoneTouch("left", e)}
            title="Double click to rewind 10s"
          />
          <div
            className={styles.touchZoneCenter}
            onClick={(e) => handleZoneTouch("center", e)}
            title="Click to play / pause"
          />
          <div
            className={styles.touchZoneRight}
            onClick={(e) => handleZoneTouch("right", e)}
            title="Double click to forward 10s"
          />
        </div>
      )}

      {/* Double Tap Ripple Indicators */}
      {rippleLeft && (
        <div className={styles.seekRippleLeft}>
          <RotateCcw size={28} />
          <span>-10s</span>
        </div>
      )}
      {rippleRight && (
        <div className={styles.seekRippleRight}>
          <RotateCw size={28} />
          <span>+10s</span>
        </div>
      )}

      {/* Speed & Quality Feedback Toast */}
      {speedToast && (
        <div className={styles.speedToast}>
          <Gauge size={16} color="#818cf8" />
          <span>{speedToast}</span>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && <div className={styles.bufferingSpinner} />}

      {/* Center Play Button (When Paused) */}
      {hasDirectVideo && !isPlaying && !isLocked && (
        <div
          className={styles.centerActionBtn}
          onClick={togglePlay}
          title="Play Lecture"
        >
          <Play size={36} fill="currentColor" style={{ marginLeft: "4px" }} />
        </div>
      )}

      {/* Screen Lock Pill (When Screen is Locked) */}
      {isLocked && (
        <button
          className={styles.screenLockBanner}
          onClick={() => setIsLocked(false)}
        >
          <Lock size={16} />
          <span>Screen Locked · Tap to Unlock</span>
        </button>
      )}

      {/* Overlay Controls */}
      <div className={`${styles.controlsOverlay} ${showControls && !isLocked ? styles.visible : ""}`}>
        {/* Top Header Bar */}
        <div className={styles.topBar}>
          <div className={styles.topLeft}>
            {onBack && (
              <button className={styles.backButton} onClick={onBack} title="Go Back">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className={styles.lectureMeta}>
              <span className={styles.lectureTag}>
                <span>Physics Wallah</span>
                {subtitle && <><span>•</span><span>{subtitle}</span></>}
              </span>
              <span className={styles.lectureTitle} title={title}>
                {title}
              </span>
            </div>
          </div>

          <div className={styles.topRight}>
            {/* Ask AI Doubt Button */}
            <button
              className={styles.askDoubtBadge}
              onClick={handleAskDoubtClick}
              title="Ask AI Doubt about this timestamp"
            >
              <Sparkles size={14} />
              <span>Ask Doubt</span>
            </button>

            {/* Quality Badge in Top Bar */}
            <button
              className={styles.badgeBtn}
              onClick={() => setActiveDrawer(prev => prev === "quality" ? "none" : "quality")}
              title="Change Quality"
            >
              {quality}
            </button>

            {/* Speed Badge in Top Bar */}
            <button
              className={styles.badgeBtn}
              onClick={() => setActiveDrawer(prev => prev === "speed" ? "none" : "speed")}
              title="Playback Speed"
            >
              <Gauge size={13} style={{ marginRight: "3px" }} />
              {playbackRate === 1 ? "1.0x" : `${playbackRate}x`}
            </button>

            {/* Lock Screen */}
            <button
              className={styles.badgeBtn}
              onClick={() => {
                setIsLocked(true);
                setShowControls(false);
              }}
              title="Lock Controls"
            >
              <Lock size={14} />
            </button>
          </div>
        </div>

        {/* Bottom Bar: Timeline & Controls */}
        <div className={styles.bottomSection}>
          {hasDirectVideo && (
            <div
              className={styles.timelineScrubber}
              onClick={handleTimelineClick}
            >
              {/* Buffered Bar */}
              <div className={styles.bufferedBar} style={{ width: `${buffered}%` }} />

              {/* Progress Bar */}
              <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />

              {/* Chapter Marker Dots */}
              {chapters.map((ch, idx) => {
                if (duration <= 0) return null;
                const pos = (ch.timestamp / duration) * 100;
                return (
                  <div
                    key={ch.id || idx}
                    className={styles.chapterMarker}
                    style={{ left: `${pos}%` }}
                    title={`Chapter: ${ch.title} (${formatTime(ch.timestamp)})`}
                  />
                );
              })}

              {/* Scrubber Thumb */}
              <div className={styles.scrubberThumb} style={{ left: `${progressPercent}%` }} />
            </div>
          )}

          {/* Controls Buttons Row */}
          <div className={styles.controlsRow}>
            {/* Left Controls */}
            <div className={styles.leftControls}>
              {hasDirectVideo && (
                <>
                  <button
                    className={styles.controlBtn}
                    onClick={togglePlay}
                    title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                  </button>

                  <button
                    className={`${styles.controlBtn} ${styles.skipBtn}`}
                    onClick={() => seekRelative(-10)}
                    title="Rewind 10s (Left Arrow)"
                  >
                    <RotateCcw size={20} />
                    <span className={styles.skipText}>10</span>
                  </button>

                  <button
                    className={`${styles.controlBtn} ${styles.skipBtn}`}
                    onClick={() => seekRelative(10)}
                    title="Forward 10s (Right Arrow)"
                  >
                    <RotateCw size={20} />
                    <span className={styles.skipText}>10</span>
                  </button>

                  {/* Volume Cluster */}
                  <div className={styles.volumeWrapper}>
                    <button
                      className={styles.controlBtn}
                      onClick={toggleMute}
                      title={isMuted ? "Unmute (M)" : "Mute (M)"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={20} />
                      ) : volume < 0.5 ? (
                        <Volume1 size={20} />
                      ) : (
                        <Volume2 size={20} />
                      )}
                    </button>
                    <div className={styles.volumeTrack} onClick={handleVolumeChange}>
                      <div
                        className={styles.volumeFill}
                        style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div
                    className={styles.timeText}
                    onClick={() => setShowRemaining(prev => !prev)}
                    title="Click to toggle remaining time"
                  >
                    {showRemaining ? (
                      <>
                        <span>{formatTime(currentTime)}</span>
                        <span className={styles.remainingPill}>-{formatTime(Math.max(0, duration - currentTime))}</span>
                      </>
                    ) : (
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    )}
                  </div>
                </>
              )}

              {/* Active Chapter Label */}
              {activeChapter && (
                <div
                  className={styles.badgeBtn}
                  onClick={() => setActiveDrawer("chapters")}
                  style={{ display: "none" }}
                >
                  <List size={12} />
                  <span>{activeChapter.title}</span>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className={styles.rightControls}>
              {/* Slower & Faster Quick Controls */}
              <div className={styles.speedStepperControls}>
                <button
                  className={styles.speedMiniBtn}
                  onClick={stepSpeedSlower}
                  title="Speed Slower ( [ or < )"
                >
                  <Minus size={12} />
                </button>
                <span
                  className={styles.speedCurrentBadge}
                  onClick={() => setActiveDrawer(prev => prev === "speed" ? "none" : "speed")}
                  title="Click to open speed options"
                >
                  {playbackRate === 1 ? "1x" : `${playbackRate}x`}
                </span>
                <button
                  className={styles.speedMiniBtn}
                  onClick={stepSpeedFaster}
                  title="Speed Faster ( ] or > )"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Quality Button in Bottom Bar */}
              <button
                className={`${styles.controlBtn} ${activeDrawer === "quality" ? styles.badgeBtnActive : ""}`}
                onClick={() => setActiveDrawer(prev => prev === "quality" ? "none" : "quality")}
                title="Change Video Quality"
                style={{ fontSize: "0.75rem", fontWeight: 700 }}
              >
                <span style={{ border: "1.5px solid currentColor", borderRadius: "4px", padding: "1px 5px", fontSize: "0.68rem" }}>
                  {quality.includes("1080") ? "1080p" : quality.includes("720") ? "720p" : quality.includes("480") ? "480p" : quality.includes("360") ? "360p" : "HD"}
                </span>
              </button>

              {/* Chapters Drawer Button */}
              {chapters.length > 0 && (
                <button
                  className={`${styles.controlBtn} ${activeDrawer === "chapters" ? styles.badgeBtnActive : ""}`}
                  onClick={() => setActiveDrawer(prev => prev === "chapters" ? "none" : "chapters")}
                  title="Lecture Chapters (C)"
                >
                  <List size={20} />
                </button>
              )}

              {/* Shortcuts Help */}
              <button
                className={styles.controlBtn}
                onClick={() => setActiveDrawer(prev => prev === "shortcuts" ? "none" : "shortcuts")}
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle size={18} />
              </button>

              {/* Settings / Speed Popover Trigger */}
              <button
                className={`${styles.controlBtn} ${activeDrawer === "speed" ? styles.badgeBtnActive : ""}`}
                onClick={() => setActiveDrawer(prev => prev === "speed" ? "none" : "speed")}
                title="Playback Speed Options"
              >
                <Settings size={20} />
              </button>

              {/* Fullscreen Button */}
              <button
                className={styles.controlBtn}
                onClick={toggleFullscreen}
                title="Toggle Fullscreen (F)"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popover Menu: Speed with Slower / Faster Steppers & Presets */}
      {activeDrawer === "speed" && (
        <div className={styles.popoverMenu} style={{ right: "4rem", bottom: "70px" }}>
          <div className={styles.popoverTitle}>Playback Speed</div>
          
          {/* Slower / Faster Interactive Stepper Box */}
          <div className={styles.speedMenuStepper}>
            <button
              className={styles.speedStepActionBtn}
              onClick={stepSpeedSlower}
              title="Slow Down"
            >
              - Slower
            </button>
            <span className={styles.speedMenuValue}>{playbackRate}x</span>
            <button
              className={styles.speedStepActionBtn}
              onClick={stepSpeedFaster}
              title="Speed Up"
            >
              + Faster
            </button>
          </div>

          {/* Quick 1.0x Normal Reset Button */}
          {playbackRate !== 1 && (
            <button
              className={styles.popoverItem}
              style={{ color: "#38bdf8", fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => changePlaybackRate(1)}
            >
              <span>Reset to 1.0x Normal</span>
            </button>
          )}

          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              className={`${styles.popoverItem} ${playbackRate === rate ? styles.popoverItemActive : ""}`}
              onClick={() => {
                changePlaybackRate(rate);
                setActiveDrawer("none");
              }}
            >
              <span>{rate === 1 ? "1.0x (Normal)" : `${rate}x`}</span>
              {playbackRate === rate && <Check size={16} />}
            </button>
          ))}
        </div>
      )}

      {/* Popover Menu: Quality */}
      {activeDrawer === "quality" && (
        <div className={styles.popoverMenu} style={{ right: "7rem", bottom: "70px" }}>
          <div className={styles.popoverTitle}>Video Quality</div>
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q}
              className={`${styles.popoverItem} ${quality === q ? styles.popoverItemActive : ""}`}
              onClick={() => changeQuality(q)}
            >
              <span>{q}</span>
              {quality === q && <Check size={16} />}
            </button>
          ))}
        </div>
      )}

      {/* Side Drawer: Chapters */}
      {activeDrawer === "chapters" && (
        <div className={styles.sideDrawer}>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitle}>
              <List size={18} color="#818cf8" />
              <span>Lecture Chapters</span>
            </div>
            <button className={styles.drawerCloseBtn} onClick={() => setActiveDrawer("none")}>
              <X size={18} />
            </button>
          </div>
          <div className={styles.chapterList}>
            {chapters.map((ch, idx) => {
              const isActive = activeChapter?.timestamp === ch.timestamp;
              return (
                <div
                  key={ch.id || idx}
                  className={`${styles.chapterItem} ${isActive ? styles.chapterItemActive : ""}`}
                  onClick={() => {
                    seekTo(ch.timestamp);
                    if (window.innerWidth < 640) setActiveDrawer("none");
                  }}
                >
                  <span className={styles.chapterBadge}>{formatTime(ch.timestamp)}</span>
                  <div className={styles.chapterInfo}>
                    <span className={styles.chapterName}>{ch.title}</span>
                    {ch.description && <span className={styles.chapterDesc}>{ch.description}</span>}
                  </div>
                  <ChevronRight size={14} color="#64748b" style={{ marginLeft: "auto" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {activeDrawer === "shortcuts" && (
        <div className={styles.shortcutsOverlay} onClick={() => setActiveDrawer("none")}>
          <div className={styles.shortcutsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.shortcutsHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <HelpCircle size={20} color="#818cf8" />
                <h3 style={{ color: "#fff", margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  Player Shortcuts
                </h3>
              </div>
              <button className={styles.drawerCloseBtn} onClick={() => setActiveDrawer("none")}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.shortcutsGrid}>
              <div className={styles.shortcutRow}>
                <span>Play / Pause</span>
                <span className={styles.kbdKey}>Space / K</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Rewind 10s</span>
                <span className={styles.kbdKey}>← / J</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Forward 10s</span>
                <span className={styles.kbdKey}>→ / L</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Speed Faster</span>
                <span className={styles.kbdKey}>] / &gt;</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Speed Slower</span>
                <span className={styles.kbdKey}>[ / &lt;</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Volume Up / Down</span>
                <span className={styles.kbdKey}>↑ / ↓</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Mute / Unmute</span>
                <span className={styles.kbdKey}>M</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Fullscreen</span>
                <span className={styles.kbdKey}>F</span>
              </div>
              <div className={styles.shortcutRow}>
                <span>Toggle Chapters</span>
                <span className={styles.kbdKey}>C</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
