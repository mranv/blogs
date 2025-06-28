export default {
  // Image optimization
  image: {
    compress: true,
    jpeg: {
      quality: 85,
    },
    png: {
      quality: 90,
    },
    webp: {
      quality: 85,
    },
    avif: {
      quality: 80,
    },
  },
  
  // HTML minification
  html: {
    minify: true,
    removeComments: true,
    collapseWhitespace: true,
  },
  
  // CSS optimization
  css: {
    inline_critical: true,
    minify: true,
  },
  
  // JS optimization
  js: {
    minify: true,
  },
  
  // Asset optimization
  misc: {
    prefetch_links: 'in-viewport',
    compress_html: true,
    compress_css: true,
    compress_js: true,
    compress_images: true,
  },
};