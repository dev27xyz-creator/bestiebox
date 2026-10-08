import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef6ff", 100: "#d9ebff", 500: "#3a7bd5", 600: "#2869c4", 700: "#2058a6" },
        category: {
          tshirts: "#4595db",
          shirts: "#6e72d8",
          jeans: "#3f5d99",
          pants: "#299c8d",
          dresses: "#d45d86",
          jackets: "#dc8846",
        },
      },
      boxShadow: {
        card: "0 24px 70px rgba(44, 57, 90, 0.09)",
      },
      borderRadius: { panel: "18px" },
    },
  },
  plugins: [],
} satisfies Config;
