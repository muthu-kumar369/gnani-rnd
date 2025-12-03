import { defineConfig } from "tailwindcss";

export default defineConfig({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "jarvis-blue": "#00F0FF",
        "jarvis-cyan": "#00E5FF",
        "jarvis-bg": "#050A14",
        "jarvis-panel": "rgba(10, 25, 47, 0.7)",
        "jarvis-border": "rgba(0, 240, 255, 0.3)",
        "jarvis-text": "#E0F7FA",
        "jarvis-alert": "#FF3333",
        "jarvis-success": "#00FF99",
      },
      boxShadow: {
        "jarvis-glow": "0 0 15px rgba(0, 240, 255, 0.5)",
        "jarvis-glow-strong": "0 0 25px rgba(0, 240, 255, 0.8)",
        "jarvis-border-glow": "0 0 5px rgba(0, 240, 255, 0.5), inset 0 0 10px rgba(0, 240, 255, 0.1)",
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'], // Tech-feel font
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        "spin-slow": "spin 8s linear infinite",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 4s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scan: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
      },
      backgroundImage: {
        "jarvis-gradient": "linear-gradient(135deg, #050A14 0%, #0A192F 100%)",
        "grid-pattern": "linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)",
      },
    },
  },
});
