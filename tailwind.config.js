/** @type {import('tailwindcss').Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // Custom Project Specific Colors
        "ot-bg-top": "#010a25",
        "ot-bg-mid": "#021e3b",
        "ot-bg-bottom": "#01112c",
        "ot-surface-top": "#203250",
        "ot-surface-bottom": "#03132e",
        "ot-surface-elev-top": "#234f7d",
        "ot-surface-elev-bottom": "#0e2e54",
        "ot-action": "#5fa6ff",
        "ot-action-hover": "#74b3ff",
        "ot-btn-secondary-top": "#425679",
        "ot-btn-secondary-bottom": "#03132e",
        "ot-border": "rgba(139, 175, 229, 0.35)",
        "ot-text-muted": "#a7bedf",
      },
      fontFamily: {
        sans: ["Bai Jamjuree", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
      }
    },
  },
  plugins: [],
}
