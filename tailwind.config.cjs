/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    // Deliberately replaces (not extends) the radius scale: the Paper & Ink design has no
    // rounded corners, so every rounded-* utility in the templates collapses to 2px.
    // Only rounded-full survives (avatars, dots). Restoring the default scale re-rounds the site.
    borderRadius: { none: "0", sm: "2px", DEFAULT: "2px", md: "2px", lg: "2px", xl: "2px", "2xl": "2px", "3xl": "2px", full: "9999px" },
    extend: {
      // text-white/NN is used all over the templates as "dark-mode text". Remapping white to
      // the bone ink (#cdc4ba) warms every one of them without touching the markup.
      colors: { white: "rgb(205 196 186 / <alpha-value>)" },
      fontFamily: {
        sans: ["'Space Grotesk Variable'", "'Space Grotesk'", ...defaultTheme.fontFamily.sans],
        mono: ["'Space Mono'", ...defaultTheme.fontFamily.mono],
        heading: ["'Fraunces Variable'", "'Fraunces'", ...defaultTheme.fontFamily.serif],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
