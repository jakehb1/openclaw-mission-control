/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["var(--font-body)", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "serif"],
        mono: ["SF Mono", "ui-monospace", "monospace"],
      },
      colors: {
        apple: {
          gray: {
            50: "#fafafa",
            100: "#f5f5f7",
            200: "#e8e8ed",
            300: "#d2d2d7",
            400: "#86868b",
            500: "#6e6e73",
            600: "#424245",
            700: "#1d1d1f",
          },
          blue: {
            DEFAULT: "#0071e3",
            hover: "#0077ed",
            light: "#e3f2ff",
          },
          green: "#34c759",
          red: "#ff3b30",
          orange: "#ff9500",
          purple: "#af52de",
          teal: "#5ac8fa",
        },
      },
      borderRadius: {
        apple: "12px",
        "apple-lg": "16px",
        "apple-xl": "20px",
      },
      boxShadow: {
        apple: "0 4px 16px rgba(0,0,0,0.08)",
        "apple-lg": "0 8px 32px rgba(0,0,0,0.12)",
        "apple-card": "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        "apple-hover": "0 8px 24px rgba(0,0,0,0.1)",
        "apple-button": "0 1px 2px rgba(0,0,0,0.04)",
      },
      backdropBlur: {
        apple: "20px",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
