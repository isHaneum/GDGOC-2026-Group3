import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    fontSize: {
      display1: ["3rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      display2: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      h1: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
      h2: ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
      body: ["0.9375rem", { lineHeight: "1.6" }],
      caption: ["0.8125rem", { lineHeight: "1.5" }],
      micro: ["0.625rem", { lineHeight: "1.4" }],
    },
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
