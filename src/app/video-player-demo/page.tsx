"use client";

import React from "react";
import VideoPlayer from "@/components/video/VideoPlayer";
import styles from "./page.module.css";
import { PlaySquare, Settings2, Maximize, MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoPlayerDemo() {
  return (
    <main className={styles.page}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <h1 className={styles.title}>Premium Video Player</h1>
        <p className={styles.subtitle}>
          A custom-designed, fully responsive video player with elegant animations, 
          glassmorphism controls, and an intuitive user interface.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={styles.playerContainer}
      >
        <VideoPlayer 
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
          poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className={styles.features}
      >
        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><PlaySquare size={20} color="#ec4899" /> Custom Controls</h3>
          <p className={styles.featureDesc}>
            Completely custom HTML5 video controls built from scratch with React and Framer Motion for buttery smooth interactions.
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><Settings2 size={20} color="#10b981" /> Playback Speed</h3>
          <p className={styles.featureDesc}>
            Integrated settings menu to easily adjust playback speed on the fly, with a beautiful glass-like overlay.
          </p>
        </div>

        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><Maximize size={20} color="#06b6d4" /> Fullscreen Support</h3>
          <p className={styles.featureDesc}>
            Native fullscreen API integration for a cinematic viewing experience across all modern browsers.
          </p>
        </div>

        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><MousePointerClick size={20} color="#f59e0b" /> Interactive Progress</h3>
          <p className={styles.featureDesc}>
            Hover to expand progress bars and volume sliders. Click anywhere on the track to seek instantly.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
