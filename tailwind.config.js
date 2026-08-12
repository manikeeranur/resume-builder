/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./.tailwind-scan/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: "var(--text)",
        "text-secondary": "var(--text-secondary)",
        border: "var(--border)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-light": "var(--primary-light)",
        success: "var(--success)",

        "bg-primary": "#ffffff",
        "bg-secondary": "var(--bg)",
        "fg-primary": "var(--text)",
        "fg-secondary": "var(--text-secondary)",
        "fg-quaternary": "var(--text-secondary)",
        "border-secondary": "var(--border)",
        "brand-600": "var(--primary)",
        ring: "var(--primary)",
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
      },
      fontFamily: {
        sans: [
          "var(--font-body)",
          "Inter",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },

  plugins: [],
};