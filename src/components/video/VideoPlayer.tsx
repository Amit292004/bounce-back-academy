"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
}

export default function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", updateProgress);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      video.removeEventListener("timeupdate", updateProgress);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleProgressChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = (x / rect.width) * 100;
    
    videoRef.current.currentTime = (clickedValue / 100) * videoRef.current.duration;
    setProgress(clickedValue);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = Math.max(0, Math.min(1, x / rect.width));
    
    videoRef.current.volume = clickedValue;
    setVolume(clickedValue);
    setIsMuted(clickedValue === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettings(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setShowSettings(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        onClick={togglePlay}
      />

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={styles.centerPlayButton}
            onClick={togglePlay}
          >
            <Play size={32} fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${styles.overlay} ${(isHovering || !isPlaying) ? styles.active : ""}`}>
        <div className={styles.controls}>
          <div className={styles.progressContainer} onClick={handleProgressChange}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
            <div className={styles.progressThumb} style={{ left: `${progress}%` }} />
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.leftControls}>
              <button className={styles.iconButton} onClick={togglePlay}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              
              <div className={styles.volumeContainer}>
                <button className={styles.iconButton} onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className={styles.volumeSlider} onClick={handleVolumeChange}>
                  <div className={styles.volumeLevel} style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                </div>
              </div>

              <span className={styles.timeDisplay}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className={styles.rightControls}>
              <div style={{ position: "relative" }}>
                <button 
                  className={styles.iconButton} 
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings size={20} />
                </button>
                
                <AnimatePresence>
                  {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={styles.settingsMenu}
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          className={`${styles.settingsItem} ${playbackRate === rate ? styles.active : ""}`}
                          onClick={() => changePlaybackRate(rate)}
                        >
                          <span>Speed</span>
                          <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className={styles.iconButton} onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
