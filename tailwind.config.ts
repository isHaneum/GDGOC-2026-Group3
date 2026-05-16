import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        bridge: {
          primary: "#10b981",
          white: "#ffffff",
          teal: "#0f766e",
          blue: "#3b82f6",
          coral: "#ef4444",
          amber: "#f59e0b",
          paper: "#f8fafc"
        }
      },
      boxShadow: {
        panel: "0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.05)"
      }
    }
  },
  plugins: []
} satisfies Config;
