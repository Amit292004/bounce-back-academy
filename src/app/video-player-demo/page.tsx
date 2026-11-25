"use client";
import { FaYoutube } from 'react-icons/fa';

import React, { useState } from "react";
import PWVideoPlayer from "@/components/video/PWVideoPlayer";
import styles from "./page.module.css";
import { Gauge, Settings2, Maximize, MousePointerClick, List, Lock, Video as VideoIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoPlayerDemo() {
  const [activeTab, setActiveTab] = useState<"direct" | "youtube">("direct");

  const sampleChapters = [
    { id: "1", title: "1. Introduction & Inertia", timestamp: 0 },
    { id: "2", title: "2. Newton's First Law of Motion", timestamp: 120 },
    { id: "3", title: "3. Linear Momentum & Impulse", timestamp: 240 },
    { id: "4", title: "4. Newton's Second Law Mathematical Derivation", timestamp: 360 },
    { id: "5", title: "5. Free Body Diagrams (FBD) & Action-Reaction", timestamp: 480 },
    { id: "6", title: "6. Summary & High-Yield PYQs", timestamp: 540 }
  ];

  return (
    <main className={styles.page}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>Physics Wallah Signature Lecture Experience</span>
        </div>
        <h1 className={styles.title}>PW Video Player</h1>
        <p className={styles.subtitle}>
          Engineered for focused study. Features precision slower/faster speed steppers, persistent quality selector, chapters, screen lock, and doubt assistance.
        </p>

        {/* Player Source Selector Tabs */}
        <div className={styles.tabGroup}>
          <button
            onClick={() => setActiveTab("direct")}
            className={`${styles.tabBtn} ${activeTab === "direct" ? styles.tabBtnActive : ""}`}
          >
            <VideoIcon size={15} />
            <span>Direct Video Demo</span>
          </button>
          <button
            onClick={() => setActiveTab("youtube")}
            className={`${styles.tabBtn} ${activeTab === "youtube" ? styles.tabBtnActive : ""}`}
          >
            <FaYoutube size={15} />
            <span>YouTube Lecture Demo</span>
          </button>
        </div>
      </motion.div>

      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.playerContainer}
      >
        {activeTab === "direct" ? (
          <PWVideoPlayer 
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
            poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
            title="Newton's Laws of Motion & Momentum - Full Concept Lecture"
            subtitle="Physics Class 11 · Chapter 4"
            chapters={sampleChapters}
            pdfNotesUrl="/demo-notes.pdf"
          />
        ) : (
          <PWVideoPlayer 
            youtubeUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            title="Physics Wallah Online Lecture Integration"
            subtitle="Concept Revision Series"
            chapters={sampleChapters}
            pdfNotesUrl="/demo-notes.pdf"
          />
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className={styles.features}
      >
        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><Gauge size={20} color="#f97316" /> Precision Slower &amp; Faster Speeds</h3>
          <p className={styles.featureDesc}>
            Step speed up or down smoothly with <code>-</code> and <code>+</code> buttons or <code>[</code> and <code>]</code> keyboard shortcuts. Displays instant feedback toast and retains sticky playback rate across videos.
          </p>
        </div>
        
        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><Settings2 size={20} color="#10b981" /> Quality Switcher</h3>
          <p className={styles.featureDesc}>
            Quickly toggle video resolution from top and bottom bars. Switch between 1080p Full HD, 720p HD, 480p, 360p, 240p, or Auto. Remembers student preference in localStorage.
          </p>
        </div>

        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><List size={20} color="#06b6d4" /> Lecture Chapters</h3>
          <p className={styles.featureDesc}>
            Timeline chapter markers and side drawer with active topic highlighting. Jump directly to formulas, derivations, or problem solving without searching.
          </p>
        </div>

        <div className={styles.featureCard}>
          <h3 className={styles.featureTitle}><Lock size={20} color="#f59e0b" /> Screen Lock & Clean View</h3>
          <p className={styles.featureDesc}>
            Lock controls with one tap to prevent accidental touch during notes-taking. Zero slide preview popups for a distraction-free, focused study experience.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
