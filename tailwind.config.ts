import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3d7a45",
                "primary-dark": "#2c5a32",
                "primary-light": "#e8f5e9",
                cream: "#f5f0e8",
                brown: "#8b5e3c",
                "brown-light": "#faeeda",
            },
            fontFamily: {
                nunito: ["Nunito", "sans-serif"],
            },
            animation: {
                "slide-down": "slideDown 0.3s ease-out forwards",
                "fade-in": "fadeIn 0.4s ease-out forwards",
                "slide-in-right": "slideInRight 0.4s ease-out forwards",
            },
            keyframes: {
                slideDown: {
                    "0%": { opacity: "0", transform: "translateY(-10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideInRight: {
                    "0%": { opacity: "0", transform: "translateX(100%)" },
                    "100%": { opacity: "1", transform: "translateX(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
