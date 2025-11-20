import { defineConfig } from "tailwindcss";

export default defineConfig({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "jarvis-blue": "#00F0FF",
        "jarvis-bg": "#0D1B2A"
      },
      boxShadow: {
        "jarvis-glow": "0 0 15px rgba(0, 240, 255, 0.7)"
      }
    }
  }
});
