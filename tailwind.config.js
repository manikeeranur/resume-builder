/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
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
      },
      boxShadow: {
        card: "var(--shadow)",
        "card-lg": "var(--shadow-lg)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Inter", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
};
