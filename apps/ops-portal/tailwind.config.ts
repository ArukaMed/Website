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
        navy: "#1B3F75",
        "navy-deep": "#0E2444",
        gold: "#C8963E",
        "gold-light": "#E3B15F",
      },
    },
  },
  plugins: [],
};

export default config;
