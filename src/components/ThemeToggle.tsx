"use client";

import { useTheme } from "./ThemeProvider";
import { FaSun, FaMoon } from "react-icons/fa";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: 'default' | 'monochrome';
  className?: string;
}

export default function ThemeToggle({ variant = 'default', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: variant === 'monochrome' ? 34 : 36, height: variant === 'monochrome' ? 34 : 36 }} />;
  }

  const isMonochrome = variant === 'monochrome';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={className}
      style={
        isMonochrome
          ? {
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              border: theme === 'dark' ? "1px solid #2e2e34" : "1px solid #e4e4e7",
              cursor: "pointer",
              background: theme === 'dark' ? "#1c1c1f" : "#ffffff",
              color: theme === 'dark' ? "#d4d4d8" : "#18181b",
              fontSize: "0.875rem",
              transition: "all 0.15s ease",
              boxShadow: theme === 'dark' ? "none" : "0 1px 2px rgba(0, 0, 0, 0.04)",
              flexShrink: 0,
            }
          : {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: "#f59e0b",
              color: "white",
              fontSize: "1.1rem",
              transition: "var(--transition)",
              boxShadow: "0 2px 5px rgba(245, 158, 11, 0.4)",
            }
      }
      title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <FaSun size={14} /> : <FaMoon size={13} />}
    </button>
  );
}
