import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          "primary-hover": "var(--brand-primary-hover)",
          deep: "var(--brand-deep)",
          accent: "var(--brand-accent)",
          "accent-light": "var(--brand-accent-light)",
          surface: "var(--brand-surface)",
          bg: "var(--brand-bg)",
          text: "var(--brand-text)",
        },
        navy: "var(--navy)",
        "navy-mid": "var(--navy-mid)",
        "navy-deep": "var(--navy-deep)",
        "navy-tint": "var(--navy-tint)",
        gold: "var(--gold)",
        "gold-deep": "var(--gold-deep)",
        "gold-tint": "var(--gold-tint)",
        ivory: "var(--ivory)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        heading: "var(--heading)",
        muted: "var(--muted)",
        line: "var(--line)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "on-primary": "var(--on-primary)",
        "btn-icon": "var(--btn-icon)",
        wa: "var(--wa)",
        err: "var(--err)",
        ok: "var(--ok)",
      },
      borderRadius: {
        "brand-btn": "var(--brand-btn-radius)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};

export default config;
