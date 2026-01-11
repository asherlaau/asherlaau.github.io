import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0e14", //
        foreground: "#e6e8eb", //
        primary: "#5b9bd5",    //
        accent: "#ff8c42",     //
        card: "#131820",       //
        border: "#2a3442",     //
        muted: {
          DEFAULT: "#1e2935",
          foreground: "#8b92a0",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "monospace"], //
        sans: ["var(--font-inter)", "sans-serif"],        //
      },
    },
  },
  plugins: [],
};
export default config;