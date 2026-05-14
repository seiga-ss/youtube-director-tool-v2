import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1117",
          card: "#1a1d27",
          hover: "#22263a",
          border: "#2a2f45",
        },
        accent: {
          DEFAULT: "#6c63ff",
          light: "#8b84ff",
          dark: "#4f47d8",
        },
        red: { brand: "#ff4444" },
        green: { brand: "#00c853" },
        yellow: { brand: "#ffd600" },
      },
      fontFamily: {
        sans: ["Inter", "Hiragino Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
