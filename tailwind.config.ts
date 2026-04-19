import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          50: "#e6e8ed",
          100: "#c0c5d4",
          200: "#8a93b0",
          300: "#5a6690",
          400: "#3a4770",
          500: "#1f2d54",
          600: "#1a2647",
          700: "#151f3a",
          800: "#1a2847",
          900: "#0d1424",
          950: "#070a12",
        },
        accent: {
          50: "#fff5eb",
          100: "#ffe4c7",
          200: "#ffcf99",
          300: "#ffb766",
          400: "#ff9f3d",
          500: "#f58220",
          600: "#d96a10",
          700: "#b5520d",
          800: "#924112",
          900: "#783812",
          950: "#411a07",
        },
      },
    },
  },
  plugins: [],
};

export default config;
