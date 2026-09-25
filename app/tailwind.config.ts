import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#171A3A",
        indigo: { DEFAULT: "#4F3FE0", light: "#6D5DF6", soft: "#EEEBFD" },
        mint: { DEFAULT: "#14C98E", light: "#2EE6A8", soft: "#E4FAF2" },
        amber: { DEFAULT: "#F5A524", soft: "#FEF3DF" },
        coral: { DEFAULT: "#F2545B", soft: "#FDE7E8" },
        sky: { DEFAULT: "#2FA7F5", soft: "#E5F4FE" },
        canvas: "#F6F7FC",
        // semáforo
        sob: "#0FA36F",
        sat: "#14C98E",
        min: "#F5A524",
        bajo: "#F2545B",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,26,58,.06), 0 8px 24px -12px rgba(23,26,58,.12)",
      },
    },
  },
  plugins: [],
};
export default config;
