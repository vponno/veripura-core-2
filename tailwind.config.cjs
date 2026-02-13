/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class', // Enable manual dark mode toggle
    theme: {
        extend: {
            colors: {
                primary: "#c026d3", // Fuchsia 700 - The main brand color
                secondary: "#f0abfc", // Fuchsia 300 - Softer accents
                accent: "#fae8ff", // Fuchsia 100 - Active state backgrounds

                // Dynamic Semantic Colors (mapped to CSS variables in index.css)
                surface: "var(--color-surface)",
                sidebar: "var(--color-sidebar)",
                textMain: "var(--color-text-main)",
                textMuted: "var(--color-text-muted)",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow': '0 0 20px rgba(192, 38, 211, 0.15)',
            }
        },
    },
    plugins: [],
}
