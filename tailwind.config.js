/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/renderer/**/*.{js,ts,jsx,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI Variable', 'Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        'caption': '11px',  // Helper text, timestamps, meta info
        'caption-upper': ['11px', { letterSpacing: '0.05em', textTransform: 'uppercase' }],  // Labels Windows 11
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
          blue: "#0078D4",        // Primary actions
          "blue-hover": "#005A9E", // Hover state
          purple: "#8E8CD8",      // Keep for gradients only
        },
        // Status colors (for badges/indicators, NOT buttons)
        status: {
          success: "#107C10",
          error: "#D13438",
          warning: "#F7630C",
          info: "#0078D4",
        },
        // Modern dark backgrounds
        dark: {
          850: "#1a1d23",
          900: "#111318",
          950: "#0a0c0f",
        },
        // Windows 11 neutral scale
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Elevation colors for layering
        elevation: {
          0: 'rgba(0, 0, 0, 0)',
          1: 'rgba(0, 0, 0, 0.05)',
          2: 'rgba(0, 0, 0, 0.1)',
          3: 'rgba(0, 0, 0, 0.15)',
          4: 'rgba(0, 0, 0, 0.2)',
        },
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 4px 16px rgba(0, 0, 0, 0.12)",
        // Windows 11 elevation system
        "elevation-1": "0 1px 2px rgba(0, 0, 0, 0.08)",
        "elevation-2": "0 2px 6px rgba(0, 0, 0, 0.12)",
        "elevation-3": "0 4px 12px rgba(0, 0, 0, 0.16)",
        "elevation-4": "0 6px 20px rgba(0, 0, 0, 0.2)",
        "elevation-5": "0 10px 30px rgba(0, 0, 0, 0.25)",
        // Acrylic shadow (for glass effects)
        "acrylic": "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-purple": "0 0 20px rgba(142, 140, 216, 0.3)",
        "inner-soft": "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 0.5s ease-in-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // Windows 11 micro-interactions
        "ripple": "ripple 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        "float-up": "float-up 0.2s ease-out forwards",
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
        // Windows 11 micro-interactions
        "ripple": {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        "float-up": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
        xl: "24px",    // Acrylic effect
        "2xl": "40px", // Strong Acrylic
        "3xl": "64px", // Maximum blur
      },
      borderRadius: {
        "3xl": "20px",  // Hero cards
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
