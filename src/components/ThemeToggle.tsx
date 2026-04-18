"use client";

import { useTheme } from "./ThemeProvider";
import { FaSun, FaMoon } from "react-icons/fa";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: 36, height: 36 }} />; // Placeholder to avoid layout shift
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: "#f59e0b", // Orange background as per the screenshots
        color: "white",
        fontSize: "1.1rem",
        transition: "var(--transition)",
        boxShadow: "0 2px 5px rgba(245, 158, 11, 0.4)",
      }}
      title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {theme === "dark" ? <FaSun /> : <FaMoon />}
    </button>
  );
}
