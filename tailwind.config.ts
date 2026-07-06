import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070d",
        panel: "#0f172a",
        quest: "#f8fafc",
        gold: "#facc15",
        mana: "#38bdf8",
        danger: "#fb7185"
      },
      boxShadow: {
        rpg: "0 0 0 3px #f8fafc, 0 0 0 6px #111827, 0 18px 50px rgba(0,0,0,0.45)"
      }
    }
  },
  plugins: []
};

export default config;
