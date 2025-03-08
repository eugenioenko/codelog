/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["selector", "[data-theme='dark']"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    // Remove the following screen breakpoint or add other breakpoints
    // if one breakpoint is not enough for you
    screens: {
      sm: "640px",
    },

    extend: {
      colors : {
        pink: {
          500: "var(--color-accent)"
        },
      },
      textColor: {
        theme: {
          base: "var(--color-text-base)",
          accent: "var(--color-accent)",
          inverted: "var(--color-fill)",
        },
      },
      backgroundColor: {
        theme: {
          fill: "var(--color-fill)",
          accent: "var(--color-accent)",
          inverted: "var(--color-text-base)",
          card: "var(--color-card)",
          "card-muted": "var(--color-card-muted)",
        },
      },
      outlineColor: {
        theme: {
          fill: "var(--color-accent)",
        },
      },
      borderColor: {
        theme: {
          line: "var(--color-border)",
          fill: "var(--color-text-base)",
          accent: "var(--color-accent)",
        },
      },
      fill: {
        theme: {
          base: "var(--color-text-base)",
          accent: "var(--color-accent)",
        },
        transparent: "transparent",
      },
      stroke: {
        theme: {
          accent: "var(--color-accent)",
        }
      },
      fontFamily: {
        mono: ["Ubuntu Mono", "monospace"],
        sans: ["Noto Sans Display", "system-ui", "sans-serif"],
      },

      typography: {
        DEFAULT: {
          css: {
            pre: {
              color: false,
            },
            code: {
              color: false,
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
