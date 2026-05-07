import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 36px rgba(59, 130, 246, 0.24)"
      }
    }
  },
  plugins: []
} satisfies Config;
