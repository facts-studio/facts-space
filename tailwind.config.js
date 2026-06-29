/** @type {import('tailwindcss').Config} */
// Design system heredado del panel Adhōc (paleta Claude + acento de marca).
// Tokens RGB conmutables light/dark vía variables CSS en globals.css.
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: (() => {
        const c = (v) => `rgb(var(${v}) / <alpha-value>)`;
        return {
          bg: c("--ct-bg"),
          surface: c("--ct-surface"),
          surface2: c("--ct-surface2"),
          sunken: c("--ct-sunken"),
          paper: c("--ct-paper"),
          border: c("--ct-border"),
          borderSoft: c("--ct-borderSoft"),
          borderStrong: c("--ct-borderStrong"),
          ink: c("--ct-ink"),
          inkSoft: c("--ct-inkSoft"),
          muted: c("--ct-muted"),
          mutedSoft: c("--ct-mutedSoft"),
          accent: c("--ct-accent"),
          accentHover: c("--ct-accentHover"),
          accentSoft: c("--ct-accentSoft"),
          brand: c("--ct-brand"),
          brandSoft: c("--ct-brandSoft"),
          brandMid: c("--ct-brandMid"),
          success: c("--ct-success"),
          successSoft: c("--ct-successSoft"),
          warn: c("--ct-warn"),
          warnSoft: c("--ct-warnSoft"),
          info: c("--ct-info"),
          infoSoft: c("--ct-infoSoft"),
          validated: c("--ct-validated"),
          violet: c("--ct-violet"),
          violetSoft: c("--ct-violetSoft"),
          queued: c("--ct-queued"),
          danger: c("--ct-danger"),
          dangerSoft: c("--ct-dangerSoft"),
        };
      })(),
      fontFamily: {
        sans: ["Bricolage Grotesque", "Inter", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Bricolage Grotesque", "Inter", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "display-xl": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-l": ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-m": ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "title": ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "body-lg": ["0.9375rem", { lineHeight: "1.6" }],
        "body": ["0.875rem", { lineHeight: "1.6" }],
        "small": ["0.8125rem", { lineHeight: "1.5" }],
        "micro": ["0.75rem", { lineHeight: "1.45" }],
        "caption": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      boxShadow: {
        card: "0 0 0 1px var(--hairline), 0 1px 2px var(--shadow-1)",
        cardHover: "0 0 0 1px var(--hairline-strong), 0 6px 20px var(--shadow-2)",
        soft: "0 0 0 1px var(--hairline), 0 2px 10px var(--shadow-2)",
        float: "0 0 0 1px var(--hairline-strong), 0 12px 36px var(--shadow-3)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.6rem",
        "4xl": "2rem",
      },
      keyframes: {
        popIn: {
          "0%": { opacity: "0", transform: "translateY(-4px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
