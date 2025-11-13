/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        // Windows 11-inspired primary blue
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Windows 11 accent colors
        accent: {
          blue: "#0078D4",
          purple: "#8E8CD8",
          cyan: "#00B7C3",
          green: "#107C10",
          orange: "#D83B01",
        },
        // Modern dark backgrounds
        dark: {
          850: "#1a1d23",
          900: "#111318",
          950: "#0a0c0f",
        },
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 4px 16px rgba(0, 0, 0, 0.12)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-purple": "0 0 20px rgba(142, 140, 216, 0.3)",
        "glow-cyan": "0 0 20px rgba(0, 183, 195, 0.3)",
        "glow-green": "0 0 20px rgba(16, 124, 16, 0.3)",
        "glow-orange": "0 0 20px rgba(216, 59, 1, 0.3)",
        "inner-soft": "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 0.5s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-10px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
