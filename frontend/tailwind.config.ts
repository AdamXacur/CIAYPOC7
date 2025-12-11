import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#624E32",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#C49B64",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#BDC1C2",
          foreground: "#624E32",
        },
        muted: {
          DEFAULT: "#F0EBE3",
          foreground: "#71706C",
        },
        destructive: {
          DEFAULT: "#8A1B33",
          foreground: "#FFFFFF",
        },
        'ciay-brown': '#624E32',
        'ciay-gold': '#C49B64',
        'ciay-silver': '#BDC1C2',
        'ciay-slate': '#71706C',
        'ciay-cream': '#F0EBE3',
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#624E32",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#624E32",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
} satisfies Config

export default config