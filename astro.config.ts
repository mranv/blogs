import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import path from "path";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
    resolve: {
      alias: {
        "@/components": path.resolve("./src/components"),
        "@/utils": path.resolve("./src/utils"),
        "@scripts": "/src/scripts",
      },
    },
    build: {
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            "react-vendor": ["react", "react-dom"],
            "search-vendor": ["fuse.js"],
          },
        },
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Minify CSS
      cssMinify: true,
      // Memory optimization
      minify: false, // Disable minification to save memory
      sourcemap: false,
    },
  },
  // Enable compression
  compressHTML: true,
  // Build output
  build: {
    // Inline small assets
    inlineStylesheets: "auto",
  },
  // Optimize images
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  scopedStyleStrategy: "where",
});
