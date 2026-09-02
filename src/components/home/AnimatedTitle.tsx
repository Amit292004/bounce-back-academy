"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./HeroSection.module.css";

export interface RotatingTopic {
  id: string;
  text: string;
  gradient: string;
  beamGlow: string;
}

export const ROTATING_TOPICS: RotatingTopic[] = [
  {
    id: "nbse",
    text: "NBSE Boards",
    gradient: "linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)",
    beamGlow: "rgba(16, 185, 129, 0.18)",
  },
  {
    id: "jee-neet",
    text: "JEE & NEET",
    gradient: "linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #8b5cf6 100%)",
    beamGlow: "rgba(236, 72, 153, 0.18)",
  },
  {
    id: "cuet",
    text: "CUET",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #38bdf8 50%, #818cf8 100%)",
    beamGlow: "rgba(6, 182, 212, 0.18)",
  },
  {
    id: "skills",
    text: "Real-World Skills",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    beamGlow: "rgba(245, 158, 11, 0.18)",
  },
];

interface AnimatedTitleProps {
  onIndexChange?: (index: number) => void;
}

export default function AnimatedTitle({ onIndexChange }: AnimatedTitleProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_TOPICS.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(index);
    }
  }, [index, onIndexChange]);

  const safeIndex = index % ROTATING_TOPICS.length;
  const current = ROTATING_TOPICS[safeIndex] || ROTATING_TOPICS[0];

  return (
    <span className={styles.animTitleWrapper} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={current.id}
          className={styles.dynamicAccent}
          style={{
            backgroundImage: current.gradient,
          }}
          initial={{ y: "45%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-45%", opacity: 0, filter: "blur(6px)" }}
          transition={{
            duration: 0.42,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {current.text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
