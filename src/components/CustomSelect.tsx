"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%" }}
    >
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "0.85rem 2.5rem 0.85rem 1.15rem",
          background: "var(--background)",
          border: "1px solid var(--surface-border)",
          borderRadius: "var(--radius-md)",
          color: value ? "var(--foreground)" : "rgba(128,128,128,0.8)",
          outline: "none",
          fontSize: "1rem",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "var(--transition)",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          boxSizing: "border-box",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          borderColor: open ? "var(--primary)" : "var(--surface-border)",
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown list — constrained inside the page flow */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--background)",
            border: "1px solid var(--primary)",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            zIndex: 100,
            maxHeight: "220px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                width: "100%",
                padding: "0.75rem 1.15rem",
                background: opt.value === value ? "rgba(99,102,241,0.12)" : "transparent",
                color: opt.value === value ? "var(--primary)" : "var(--foreground)",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.95rem",
                fontWeight: opt.value === value ? 600 : 400,
                fontFamily: "inherit",
                transition: "background 0.15s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.06)";
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value)
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
