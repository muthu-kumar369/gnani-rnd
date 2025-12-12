import { defineConfig } from "tailwindcss";

export default defineConfig({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Jarvis theme colors
        jarvis: {
          bg: '#000000',
          'bg-secondary': '#0a0a0a',
          'bg-tertiary': '#1a1a1a',
          cyan: '#00ffff',
          'cyan-dark': '#00cccc',
          'cyan-light': '#66ffff',
          blue: '#0ea5e9',
          purple: '#a855f7',
          border: 'rgba(0, 255, 255, 0.2)',

          // Legacy mappings for compatibility
          'blue-legacy': "#00F0FF",
          'cyan-legacy': "#00E5FF",
          'bg-legacy': "#050A14",
          'panel-legacy': "rgba(10, 25, 47, 0.7)",
          'border-legacy': "rgba(0, 240, 255, 0.3)",
          'text-legacy': "#E0F7FA",
          'alert-legacy': "#FF3333",
          'success-legacy': "#00FF99",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        "spin-slow": "spin 8s linear infinite",
        "pulse-fast": "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 4s linear infinite",
        "shimmer": "shimmer 2s infinite linear",
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 255, 0.6)' },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        scan: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "0% 100%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
      },
      backgroundImage: {
        "jarvis-gradient": "linear-gradient(135deg, #050A14 0%, #0A192F 100%)",
        "grid-pattern": "linear-gradient(to right, rgba(0, 240, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.05) 1px, transparent 1px)",
      },
    },
  },
});
