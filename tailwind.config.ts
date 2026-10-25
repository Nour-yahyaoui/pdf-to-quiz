import type { Config } from "tailwindcss";

/**
 * Design tokens implement docs/STYLE.md ("Exam Paper" direction).
 * Colors are CSS variables so next-themes can swap the palette in dark mode.
 * No gradients, no glow shadows, radius capped at 6px — see STYLE.md banned list.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        mute: "rgb(var(--mute) / <alpha-value>)",
        rule: "rgb(var(--rule) / <alpha-value>)",
        "rule-soft": "rgb(var(--rule-soft) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          deep: "rgb(var(--accent-deep) / <alpha-value>)",
          tint: "rgb(var(--accent-tint) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        // Real type ratio (~1 : 1.6 : 2.6), hierarchy from scale not color
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.14em" }],
        body: ["1.0625rem", { lineHeight: "1.65" }],
        heading: ["1.3125rem", { lineHeight: "1.35" }],
        title: ["2.125rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        display: ["clamp(2.5rem, 6.2vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "3px",
        md: "6px",
      },
      boxShadow: {
        // Flat surfaces get borders, not shadows. Only floating elements.
        float: "0 8px 28px -12px rgb(var(--shadow-color) / 0.25)",
        pop: "0 2px 10px -2px rgb(var(--shadow-color) / 0.18)",
      },
      maxWidth: {
        measure: "44rem",
        sheet: "64rem",
      },
      spacing: {
        // 4px baseline multiples keep vertical rhythm honest
        18: "4.5rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 220ms ease-out both",
        "slide-up": "slide-up 280ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
