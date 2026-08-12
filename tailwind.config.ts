import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (see globals.css) so
        // light/dark modes stay consistent and legible.
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface-2)",
        ink: "var(--text)",
        ink2: "var(--text-2)",
        ink3: "var(--text-3)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        accentInk: "var(--accent-text)",
        line: "var(--border)",
        line2: "var(--border-strong)",
        danger: "var(--danger)",
        warn: "var(--warn)",
      },
      borderRadius: { xl2: "16px" },
      boxShadow: { soft: "var(--shadow)" },
    },
  },
  plugins: [],
};
export default config;
