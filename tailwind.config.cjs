function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  // Add safelist for dynamic classes that might be purged
  safelist: [
    'animate-in',
    'animate-fadeIn',
    'animate-slideInLeft',
    'animate-slideInRight',
    'animate-scaleIn',
    'animate-float',
    'animate-on-scroll',
    'animate-fade-up',
    'animate-fade-in',
    'animate-slide-in',
    'animate-scale-in',
    'text-reveal',
    'char-reveal',
    'stagger-children',
  ],
  theme: {
    // Remove the following screen breakpoint or add other breakpoints
    // if one breakpoint is not enough for you
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },

    extend: {
      textColor: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-fill"),
          secondary: withOpacity("--color-secondary"),
          success: withOpacity("--color-success"),
          warning: withOpacity("--color-warning"),
        },
      },
      backgroundColor: {
        skin: {
          fill: withOpacity("--color-fill"),
          accent: withOpacity("--color-accent"),
          inverted: withOpacity("--color-text-base"),
          card: withOpacity("--color-card"),
          "card-muted": withOpacity("--color-card-muted"),
          secondary: withOpacity("--color-secondary"),
          success: withOpacity("--color-success"),
          warning: withOpacity("--color-warning"),
        },
      },
      outlineColor: {
        skin: {
          fill: withOpacity("--color-accent"),
          accent: withOpacity("--color-accent"),
        },
      },
      borderColor: {
        skin: {
          line: withOpacity("--color-border"),
          fill: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
      },
      fill: {
        skin: {
          base: withOpacity("--color-text-base"),
          accent: withOpacity("--color-accent"),
        },
        transparent: "transparent",
        // New OKLCH color system
        primary: withOklchOpacity("--primary"),
        "primary-foreground": withOklchOpacity("--primary-foreground"),
        secondary: withOklchOpacity("--secondary"),
        "secondary-foreground": withOklchOpacity("--secondary-foreground"),
        muted: withOklchOpacity("--muted"),
        "muted-foreground": withOklchOpacity("--muted-foreground"),
        accent: withOklchOpacity("--accent"),
        "accent-foreground": withOklchOpacity("--accent-foreground"),
        destructive: withOklchOpacity("--destructive"),
        "destructive-foreground": withOklchOpacity("--destructive-foreground"),
        border: withOklchOpacity("--border"),
        input: withOklchOpacity("--input"),
        ring: withOklchOpacity("--ring"),
        background: withOklchOpacity("--background"),
        foreground: withOklchOpacity("--foreground"),
        card: withOklchOpacity("--card"),
        "card-foreground": withOklchOpacity("--card-foreground"),
        popover: withOklchOpacity("--popover"),
        "popover-foreground": withOklchOpacity("--popover-foreground"),
      },
      ringColor: {
        skin: {
          accent: withOpacity("--color-accent"),
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "Arial", "sans-serif"],
        serif: ["Charter", "Iowan Old Style", "Georgia", "Source Serif Pro", "Palatino", "Book Antiqua", "Cambria", "Times New Roman", "Times", "serif"],
        mono: ["JetBrains Mono", "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Source Code Pro", "Fira Code", "Consolas", "Courier New", "monospace"],
        reading: ["Charter", "Iowan Old Style", "Georgia", "Source Serif Pro", "Palatino", "Book Antiqua", "serif"],
        corporate: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
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
