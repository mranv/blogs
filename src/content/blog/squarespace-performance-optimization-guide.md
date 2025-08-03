---
title: "Squarespace Performance Optimization: Complete Guide to Site Speed Enhancement"
slug: "squarespace-performance-optimization-guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-10T16:45:00Z
featured: false
draft: false
tags:
  - squarespace
  - performance-optimization
  - web-performance
  - site-speed
  - user-experience
  - seo
description: "Comprehensive guide to optimizing Squarespace website performance, including image optimization, code injection techniques, caching strategies, and Core Web Vitals improvements."
---

# Squarespace Performance Optimization: Complete Guide

Squarespace websites, while offering beautiful designs and ease of use, often suffer from performance issues that can impact user experience and SEO rankings. This comprehensive guide provides actionable strategies to optimize your Squarespace site for maximum performance and Core Web Vitals compliance.

## Table of Contents

## Understanding Squarespace Performance Challenges

### Common Performance Issues

Squarespace sites typically face several performance bottlenecks:

- **Heavy Template Assets**: Templates often include unnecessary CSS and JavaScript
- **Unoptimized Images**: Large image files without proper compression
- **Third-party Integrations**: External widgets and tracking scripts
- **Limited Caching Control**: Restricted server-side optimization options
- **Render-blocking Resources**: CSS and JavaScript that delay page rendering

### Performance Impact on Business

Poor performance affects:

- **User Experience**: Increased bounce rates and reduced engagement
- **SEO Rankings**: Google's Core Web Vitals as ranking factors
- **Conversion Rates**: Page speed directly impacts sales and lead generation
- **Mobile Experience**: Critical for mobile-first indexing

## Core Web Vitals Optimization

### Largest Contentful Paint (LCP)

**Target**: Under 2.5 seconds

**Optimization strategies:**

```html
<!-- Preload critical images -->
<link rel="preload" as="image" href="/s/hero-image.jpg" fetchpriority="high" />

<!-- Optimize hero images -->
<img
  src="/s/hero-image.jpg?format=webp&width=1920"
  alt="Hero Image"
  loading="eager"
  fetchpriority="high"
/>
```

**Image optimization code:**

```javascript
// Auto-optimize images on load
document.addEventListener("DOMContentLoaded", function () {
  const images = document.querySelectorAll("img[data-src]");

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;

        // Add WebP support detection
        const supportsWebP = (function () {
          const canvas = document.createElement("canvas");
          return canvas.toDataURL("image/webp").indexOf("webp") !== -1;
        })();

        if (supportsWebP && src.includes("squarespace-cdn.com")) {
          img.src = src + "?format=webp";
        } else {
          img.src = src;
        }

        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
});
```

### First Input Delay (FID)

**Target**: Under 100 milliseconds

**JavaScript optimization:**

```javascript
// Defer non-critical JavaScript
function deferScript(src) {
  const script = document.createElement("script");
  script.src = src;
  script.defer = true;
  document.head.appendChild(script);
}

// Load analytics after user interaction
let analyticsLoaded = false;
function loadAnalytics() {
  if (!analyticsLoaded) {
    deferScript(
      "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
    );
    analyticsLoaded = true;
  }
}

// Trigger on first user interaction
["mousedown", "touchstart", "keydown"].forEach(event => {
  document.addEventListener(event, loadAnalytics, { once: true });
});
```

### Cumulative Layout Shift (CLS)

**Target**: Under 0.1

**Layout stability techniques:**

```css
/* Reserve space for images */
.image-container {
  aspect-ratio: 16/9;
  position: relative;
  overflow: hidden;
}

.image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Prevent font loading shifts */
@font-face {
  font-family: "CustomFont";
  src: url("/assets/font.woff2") format("woff2");
  font-display: swap;
}

/* Reserve space for ads/widgets */
.widget-placeholder {
  min-height: 250px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Image Optimization Strategies

### Responsive Images Implementation

```html
<!-- Squarespace responsive image markup -->
<img
  src="/s/image.jpg?format=1500w"
  srcset="
    /s/image.jpg?format=300w   300w,
    /s/image.jpg?format=500w   500w,
    /s/image.jpg?format=750w   750w,
    /s/image.jpg?format=1000w 1000w,
    /s/image.jpg?format=1500w 1500w
  "
  sizes="(max-width: 640px) 100vw,
            (max-width: 1024px) 50vw,
            33vw"
  alt="Descriptive alt text"
  loading="lazy"
/>
```

### WebP Implementation

```javascript
// WebP detection and implementation
class ImageOptimizer {
  constructor() {
    this.supportsWebP = this.checkWebPSupport();
    this.init();
  }

  checkWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src =
        "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
    });
  }

  async init() {
    const supportsWebP = await this.supportsWebP;
    this.optimizeImages(supportsWebP);
  }

  optimizeImages(supportsWebP) {
    const images = document.querySelectorAll('img[src*="squarespace-cdn.com"]');

    images.forEach(img => {
      const src = img.src;
      if (supportsWebP && !src.includes("format=webp")) {
        img.src = src + (src.includes("?") ? "&" : "?") + "format=webp";
      }
    });
  }
}

new ImageOptimizer();
```

### Lazy Loading Enhancement

```javascript
// Enhanced lazy loading for Squarespace
class SquarespaceLazyLoader {
  constructor() {
    this.imageObserver = new IntersectionObserver(
      this.handleImageIntersection.bind(this),
      {
        rootMargin: "50px 0px",
        threshold: 0.01,
      }
    );

    this.init();
  }

  init() {
    // Target Squarespace image containers
    const imageContainers = document.querySelectorAll(
      ".sqs-image-container, .gallery-item, .portfolio-item"
    );

    imageContainers.forEach(container => {
      this.imageObserver.observe(container);
    });
  }

  handleImageIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        this.imageObserver.unobserve(entry.target);
      }
    });
  }

  loadImage(container) {
    const img = container.querySelector("img");
    if (img && img.dataset.src) {
      img.src = img.dataset.src;
      img.onload = () => {
        container.classList.add("loaded");
      };
    }
  }
}

new SquarespaceLazyLoader();
```

## Code Injection Optimization

### Header Code Injection

```html
<!-- Critical CSS inlining -->
<style>
  /* Above-the-fold critical styles */
  .header,
  .nav,
  .hero-section {
    /* Critical styles here */
  }

  /* Font loading optimization */
  @font-face {
    font-family: "Primary";
    src: url("/assets/font.woff2") format("woff2");
    font-display: swap;
  }
</style>

<!-- Preload critical resources -->
<link rel="preload" href="/assets/critical.css" as="style" />
<link
  rel="preload"
  href="/assets/font.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>

<!-- DNS prefetch for external resources -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//www.google-analytics.com" />

<!-- Preconnect to critical third-parties -->
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

### Footer Code Injection

```html
<!-- Deferred JavaScript loading -->
<script>
  // Service Worker for caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(registration => console.log("SW registered"))
        .catch(error => console.log("SW registration failed"));
    });
  }

  // Performance monitoring
  function logPerformanceMetrics() {
    if ("performance" in window) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType("navigation")[0];
          const metrics = {
            DNS: perfData.domainLookupEnd - perfData.domainLookupStart,
            TCP: perfData.connectEnd - perfData.connectStart,
            TTFB: perfData.responseStart - perfData.requestStart,
            Download: perfData.responseEnd - perfData.responseStart,
            DOM: perfData.domContentLoadedEventEnd - perfData.responseEnd,
          };

          // Send to analytics
          gtag("event", "page_timing", metrics);
        }, 0);
      });
    }
  }

  logPerformanceMetrics();
</script>

<!-- Third-party script optimization -->
<script>
  // Intersection Observer for ads/widgets
  const lazyWidgets = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const widget = entry.target;
        if (widget.dataset.src) {
          const script = document.createElement("script");
          script.src = widget.dataset.src;
          document.head.appendChild(script);
          lazyWidgets.unobserve(widget);
        }
      }
    });
  });

  document.querySelectorAll("[data-lazy-widget]").forEach(widget => {
    lazyWidgets.observe(widget);
  });
</script>
```

## CSS Optimization Techniques

### Critical CSS Extraction

```css
/* Critical above-the-fold styles */
.critical-styles {
  /* Header styles */
  .header {
    position: fixed;
    top: 0;
    width: 100%;
    background: #fff;
    z-index: 1000;
  }

  /* Navigation styles */
  .nav {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
  }

  /* Hero section */
  .hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* Non-critical styles - load async */
.non-critical-styles {
  /* Footer, sidebar, below-fold content */
}
```

### CSS Loading Strategy

```html
<!-- Inline critical CSS -->
<style>
  /* Critical CSS here */
</style>

<!-- Async load non-critical CSS -->
<link
  rel="preload"
  href="/non-critical.css"
  as="style"
  onload="this.onload=null;this.rel='stylesheet'"
/>
<noscript><link rel="stylesheet" href="/non-critical.css" /></noscript>

<!-- JavaScript fallback for CSS loading -->
<script>
  function loadCSS(href) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  // Load non-critical CSS after page load
  window.addEventListener("load", () => {
    loadCSS("/additional-styles.css");
  });
</script>
```

## JavaScript Performance Optimization

### Async Script Loading

```javascript
// Utility for async script loading
class ScriptLoader {
  static async loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;

      script.onload = resolve;
      script.onerror = reject;

      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          script.setAttribute(key, value);
        });
      }

      document.head.appendChild(script);
    });
  }

  static async loadMultipleScripts(scripts) {
    const promises = scripts.map(script => {
      if (typeof script === "string") {
        return this.loadScript(script);
      }
      return this.loadScript(script.src, script.options);
    });

    return Promise.all(promises);
  }
}

// Usage example
const scripts = [
  { src: "/analytics.js", options: { defer: true } },
  { src: "/widgets.js", options: { async: true } },
  "/non-critical.js",
];

ScriptLoader.loadMultipleScripts(scripts)
  .then(() => console.log("All scripts loaded"))
  .catch(error => console.error("Script loading failed:", error));
```

### Event Delegation and Optimization

```javascript
// Efficient event handling for Squarespace
class SquarespaceEvents {
  constructor() {
    this.init();
  }

  init() {
    // Use event delegation for better performance
    document.addEventListener("click", this.handleClick.bind(this));
    document.addEventListener(
      "scroll",
      this.throttle(this.handleScroll.bind(this), 16)
    );

    // Intersection Observer for animations
    this.setupAnimationObserver();
  }

  handleClick(event) {
    const target = event.target;

    // Handle different click types
    if (target.matches(".gallery-item")) {
      this.handleGalleryClick(target);
    } else if (target.matches(".nav-link")) {
      this.handleNavClick(target);
    }
  }

  handleScroll() {
    // Throttled scroll handling
    const scrollY = window.scrollY;

    // Update header on scroll
    if (scrollY > 100) {
      document.body.classList.add("scrolled");
    } else {
      document.body.classList.remove("scrolled");
    }
  }

  setupAnimationObserver() {
    const animationObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".animate-on-scroll").forEach(el => {
      animationObserver.observe(el);
    });
  }

  throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }
}

new SquarespaceEvents();
```

## Third-Party Integration Optimization

### Analytics Optimization

```javascript
// Optimized Google Analytics implementation
class OptimizedAnalytics {
  constructor(measurementId) {
    this.measurementId = measurementId;
    this.loaded = false;
    this.queue = [];
    this.init();
  }

  init() {
    // Load analytics on user interaction
    this.loadOnInteraction();

    // Fallback: load after 3 seconds
    setTimeout(() => {
      if (!this.loaded) {
        this.loadAnalytics();
      }
    }, 3000);
  }

  loadOnInteraction() {
    const events = ["mousedown", "touchstart", "keydown", "scroll"];
    const loadAnalytics = () => {
      this.loadAnalytics();
      events.forEach(event => {
        document.removeEventListener(event, loadAnalytics);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, loadAnalytics, { once: true });
    });
  }

  loadAnalytics() {
    if (this.loaded) return;

    // Load gtag script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      dataLayer.push(arguments);
    };

    gtag("js", new Date());
    gtag("config", this.measurementId, {
      page_title: document.title,
      page_location: window.location.href,
    });

    // Process queued events
    this.queue.forEach(event => gtag(...event));
    this.queue = [];
    this.loaded = true;
  }

  track(...args) {
    if (this.loaded) {
      gtag(...args);
    } else {
      this.queue.push(args);
    }
  }
}

// Usage
const analytics = new OptimizedAnalytics("GA_MEASUREMENT_ID");

// Track events
analytics.track("event", "page_view");
analytics.track("event", "click", {
  event_category: "engagement",
  event_label: "header_logo",
});
```

### Social Media Widget Optimization

```javascript
// Lazy load social media widgets
class SocialWidgetLoader {
  constructor() {
    this.widgets = new Map();
    this.init();
  }

  init() {
    this.setupObserver();
    this.registerWidgets();
  }

  registerWidgets() {
    // Facebook
    this.widgets.set("facebook", {
      script: "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v12.0",
      init: () => window.FB && FB.XFBML.parse(),
    });

    // Twitter
    this.widgets.set("twitter", {
      script: "https://platform.twitter.com/widgets.js",
      init: () => window.twttr && twttr.widgets.load(),
    });

    // Instagram
    this.widgets.set("instagram", {
      script: "https://www.instagram.com/embed.js",
      init: () => window.instgrm && instgrm.Embeds.process(),
    });
  }

  setupObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const widget = entry.target;
          const type = widget.dataset.widget;

          if (this.widgets.has(type)) {
            this.loadWidget(type);
            observer.unobserve(widget);
          }
        }
      });
    });

    document.querySelectorAll("[data-widget]").forEach(widget => {
      observer.observe(widget);
    });
  }

  async loadWidget(type) {
    const widget = this.widgets.get(type);

    try {
      await this.loadScript(widget.script);
      widget.init();
    } catch (error) {
      console.error(`Failed to load ${type} widget:`, error);
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

new SocialWidgetLoader();
```

## Caching and Service Worker Implementation

### Service Worker for Squarespace

```javascript
// sw.js - Service Worker for Squarespace sites
const CACHE_NAME = "squarespace-v1";
const STATIC_CACHE = "static-v1";
const DYNAMIC_CACHE = "dynamic-v1";

const STATIC_ASSETS = [
  "/",
  "/assets/main.css",
  "/assets/fonts/primary.woff2",
  "/favicon.ico",
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(
              cacheName =>
                cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  const { request } = event;

  // Cache strategy based on request type
  if (request.destination === "image") {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
  } else if (request.url.includes("/s/")) {
    // Squarespace assets
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  }
});

// Cache strategies
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.error("Cache first strategy failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}
```

### Cache Control Implementation

```javascript
// Cache management for Squarespace
class SquarespaceCache {
  constructor() {
    this.cacheName = "squarespace-cache-v1";
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
    this.init();
  }

  async init() {
    if ("caches" in window) {
      await this.setupCache();
      this.preloadCriticalResources();
    }
  }

  async setupCache() {
    this.cache = await caches.open(this.cacheName);
  }

  async preloadCriticalResources() {
    const criticalResources = [
      "/universal/styles-compressed/base-5b5089ad71-min.css",
      "/universal/scripts-compressed/compatibility-cbe4ef5eb5-min.js",
      window.location.pathname,
    ];

    try {
      await this.cache.addAll(criticalResources);
      console.log("Critical resources cached");
    } catch (error) {
      console.error("Failed to cache critical resources:", error);
    }
  }

  async cacheResource(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await this.cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      // Try to serve from cache
      const cachedResponse = await this.cache.match(url);
      return cachedResponse || Promise.reject(error);
    }
  }

  async cleanExpiredCache() {
    const requests = await this.cache.keys();
    const now = Date.now();

    for (const request of requests) {
      const response = await this.cache.match(request);
      const dateHeader = response.headers.get("date");

      if (dateHeader) {
        const responseDate = new Date(dateHeader).getTime();
        if (now - responseDate > this.maxAge) {
          await this.cache.delete(request);
        }
      }
    }
  }
}

const cacheManager = new SquarespaceCache();

// Clean cache periodically
setInterval(
  () => {
    cacheManager.cleanExpiredCache();
  },
  60 * 60 * 1000
); // Every hour
```

## Performance Monitoring and Analytics

### Core Web Vitals Tracking

```javascript
// Core Web Vitals monitoring for Squarespace
class CoreWebVitalsTracker {
  constructor() {
    this.vitals = {};
    this.init();
  }

  async init() {
    // Load web-vitals library
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import(
      "https://unpkg.com/web-vitals@3/dist/web-vitals.js"
    );

    // Track each metric
    getCLS(this.handleCLS.bind(this));
    getFID(this.handleFID.bind(this));
    getFCP(this.handleFCP.bind(this));
    getLCP(this.handleLCP.bind(this));
    getTTFB(this.handleTTFB.bind(this));
  }

  handleCLS(metric) {
    this.vitals.cls = metric.value;
    this.sendMetric("CLS", metric.value);
  }

  handleFID(metric) {
    this.vitals.fid = metric.value;
    this.sendMetric("FID", metric.value);
  }

  handleFCP(metric) {
    this.vitals.fcp = metric.value;
    this.sendMetric("FCP", metric.value);
  }

  handleLCP(metric) {
    this.vitals.lcp = metric.value;
    this.sendMetric("LCP", metric.value);
  }

  handleTTFB(metric) {
    this.vitals.ttfb = metric.value;
    this.sendMetric("TTFB", metric.value);
  }

  sendMetric(name, value) {
    // Send to Google Analytics
    if (typeof gtag !== "undefined") {
      gtag("event", name, {
        event_category: "Web Vitals",
        value: Math.round(value),
        metric_value: value,
        metric_delta: value,
        non_interaction: true,
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomAnalytics(name, value);
  }

  async sendToCustomAnalytics(name, value) {
    try {
      await fetch("/api/analytics/vitals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metric: name,
          value: value,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error("Failed to send custom analytics:", error);
    }
  }

  getVitalsReport() {
    return this.vitals;
  }
}

const vitalsTracker = new CoreWebVitalsTracker();
```

### Performance Budget Monitoring

```javascript
// Performance budget monitoring
class PerformanceBudget {
  constructor() {
    this.budgets = {
      totalSize: 2 * 1024 * 1024, // 2MB
      imageSize: 1 * 1024 * 1024, // 1MB
      jsSize: 500 * 1024, // 500KB
      cssSize: 100 * 1024, // 100KB
      fontSize: 100 * 1024, // 100KB
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
    };

    this.init();
  }

  async init() {
    await this.checkResourceBudgets();
    this.setupPerformanceObserver();
  }

  async checkResourceBudgets() {
    if (!("performance" in window)) return;

    const resources = performance.getEntriesByType("resource");
    const budgetReport = {
      totalSize: 0,
      imageSize: 0,
      jsSize: 0,
      cssSize: 0,
      fontSize: 0,
      violations: [],
    };

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      budgetReport.totalSize += size;

      if (resource.initiatorType === "img") {
        budgetReport.imageSize += size;
      } else if (resource.name.includes(".js")) {
        budgetReport.jsSize += size;
      } else if (resource.name.includes(".css")) {
        budgetReport.cssSize += size;
      } else if (resource.name.includes(".woff")) {
        budgetReport.fontSize += size;
      }
    });

    // Check violations
    Object.keys(this.budgets).forEach(budget => {
      if (budgetReport[budget] > this.budgets[budget]) {
        budgetReport.violations.push({
          type: budget,
          actual: budgetReport[budget],
          budget: this.budgets[budget],
          overage: budgetReport[budget] - this.budgets[budget],
        });
      }
    });

    if (budgetReport.violations.length > 0) {
      console.warn("Performance budget violations:", budgetReport.violations);
      this.reportViolations(budgetReport.violations);
    }
  }

  setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === "largest-contentful-paint") {
            if (entry.startTime > this.budgets.lcp) {
              this.reportViolation("LCP", entry.startTime, this.budgets.lcp);
            }
          }
        });
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
    }
  }

  reportViolation(type, actual, budget) {
    console.warn(`Performance budget violation: ${type}`, {
      actual,
      budget,
      overage: actual - budget,
    });

    // Send to analytics
    if (typeof gtag !== "undefined") {
      gtag("event", "performance_budget_violation", {
        event_category: "Performance",
        violation_type: type,
        actual_value: actual,
        budget_value: budget,
      });
    }
  }

  reportViolations(violations) {
    violations.forEach(violation => {
      this.reportViolation(violation.type, violation.actual, violation.budget);
    });
  }
}

new PerformanceBudget();
```

## Mobile Performance Optimization

### Touch and Gesture Optimization

```javascript
// Mobile-specific optimizations for Squarespace
class MobileOptimizer {
  constructor() {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.init();
  }

  init() {
    if (this.isMobile) {
      this.optimizeTouch();
      this.optimizeViewport();
      this.reducePaintComplexity();
    }
  }

  optimizeTouch() {
    // Eliminate 300ms click delay
    document.addEventListener("touchstart", () => {}, { passive: true });

    // Optimize scroll performance
    document.addEventListener(
      "touchmove",
      e => {
        if (e.touches.length > 1) {
          e.preventDefault(); // Prevent zoom
        }
      },
      { passive: false }
    );

    // Add touch feedback
    const touchElements = document.querySelectorAll("a, button, .clickable");
    touchElements.forEach(element => {
      element.addEventListener(
        "touchstart",
        () => {
          element.classList.add("touch-active");
        },
        { passive: true }
      );

      element.addEventListener(
        "touchend",
        () => {
          setTimeout(() => {
            element.classList.remove("touch-active");
          }, 150);
        },
        { passive: true }
      );
    });
  }

  optimizeViewport() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
      input.addEventListener("focus", () => {
        if (input.type !== "range") {
          const viewport = document.querySelector('meta[name="viewport"]');
          viewport.content =
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
        }
      });

      input.addEventListener("blur", () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        viewport.content = "width=device-width, initial-scale=1.0";
      });
    });
  }

  reducePaintComplexity() {
    // Use transform instead of changing layout properties
    const animatedElements = document.querySelectorAll(".animate");
    animatedElements.forEach(element => {
      element.style.willChange = "transform, opacity";
    });

    // Optimize background images for mobile
    const backgrounds = document.querySelectorAll(
      '[style*="background-image"]'
    );
    backgrounds.forEach(bg => {
      const style = bg.getAttribute("style");
      const imageUrl = style.match(/url\(['"]?(.*?)['"]?\)/)?.[1];

      if (imageUrl && imageUrl.includes("squarespace-cdn.com")) {
        const mobileUrl = imageUrl + "?format=750w";
        bg.style.backgroundImage = `url(${mobileUrl})`;
      }
    });
  }
}

new MobileOptimizer();
```

### Progressive Web App Features

```javascript
// PWA implementation for Squarespace
class SquarespacePWA {
  constructor() {
    this.init();
  }

  async init() {
    this.registerServiceWorker();
    this.setupManifest();
    this.addInstallPrompt();
  }

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("SW registered:", registration);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.showUpdateNotification();
            }
          });
        });
      } catch (error) {
        console.error("SW registration failed:", error);
      }
    }
  }

  setupManifest() {
    // Generate manifest.json
    const manifest = {
      name: document.title,
      short_name: document.title.substring(0, 12),
      description:
        document.querySelector('meta[name="description"]')?.content || "",
      start_url: "/",
      display: "standalone",
      theme_color: "#000000",
      background_color: "#ffffff",
      icons: [
        {
          src: "/favicon-192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/favicon-512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], {
      type: "application/json",
    });
    const manifestURL = URL.createObjectURL(manifestBlob);

    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = manifestURL;
    document.head.appendChild(link);
  }

  addInstallPrompt() {
    let deferredPrompt;

    window.addEventListener("beforeinstallprompt", e => {
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install button
      const installButton = document.getElementById("install-button");
      if (installButton) {
        installButton.style.display = "block";
        installButton.addEventListener("click", () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === "accepted") {
              console.log("App installed");
            }
            deferredPrompt = null;
          });
        });
      }
    });
  }

  showUpdateNotification() {
    const notification = document.createElement("div");
    notification.className = "update-notification";
    notification.innerHTML = `
            <p>A new version is available!</p>
            <button onclick="window.location.reload()">Update</button>
            <button onclick="this.parentElement.remove()">Later</button>
        `;
    document.body.appendChild(notification);
  }
}

new SquarespacePWA();
```

## Performance Testing and Validation

### Automated Performance Testing

```javascript
// Performance testing suite for Squarespace
class PerformanceTester {
  constructor() {
    this.tests = [];
    this.results = [];
    this.init();
  }

  init() {
    this.registerTests();
    this.runTests();
  }

  registerTests() {
    this.tests = [
      this.testPageLoadTime,
      this.testImageOptimization,
      this.testCSSOptimization,
      this.testJSOptimization,
      this.testMobilePerformance,
    ];
  }

  async runTests() {
    console.log("Running performance tests...");

    for (const test of this.tests) {
      try {
        const result = await test.call(this);
        this.results.push(result);
      } catch (error) {
        console.error("Test failed:", error);
      }
    }

    this.generateReport();
  }

  async testPageLoadTime() {
    const navigation = performance.getEntriesByType("navigation")[0];
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    return {
      name: "Page Load Time",
      value: loadTime,
      unit: "ms",
      passed: loadTime < 3000,
      benchmark: 3000,
    };
  }

  async testImageOptimization() {
    const images = document.querySelectorAll("img");
    let unoptimizedCount = 0;
    let totalSize = 0;

    const resources = performance.getEntriesByType("resource");
    resources.forEach(resource => {
      if (resource.initiatorType === "img") {
        totalSize += resource.transferSize || 0;

        // Check if image is optimized
        if (
          !resource.name.includes("format=webp") &&
          !resource.name.includes("format=") &&
          resource.transferSize > 100000
        ) {
          // > 100KB
          unoptimizedCount++;
        }
      }
    });

    return {
      name: "Image Optimization",
      value: unoptimizedCount,
      unit: "unoptimized images",
      passed: unoptimizedCount === 0,
      benchmark: 0,
      details: {
        totalImages: images.length,
        totalSize: totalSize,
        unoptimizedCount: unoptimizedCount,
      },
    };
  }

  async testCSSOptimization() {
    const cssResources = performance
      .getEntriesByType("resource")
      .filter(resource => resource.name.includes(".css"));

    const totalCSSSize = cssResources.reduce(
      (sum, resource) => sum + (resource.transferSize || 0),
      0
    );

    return {
      name: "CSS Optimization",
      value: totalCSSSize,
      unit: "bytes",
      passed: totalCSSSize < 100000, // < 100KB
      benchmark: 100000,
      details: {
        fileCount: cssResources.length,
        totalSize: totalCSSSize,
      },
    };
  }

  async testJSOptimization() {
    const jsResources = performance
      .getEntriesByType("resource")
      .filter(resource => resource.name.includes(".js"));

    const totalJSSize = jsResources.reduce(
      (sum, resource) => sum + (resource.transferSize || 0),
      0
    );

    return {
      name: "JavaScript Optimization",
      value: totalJSSize,
      unit: "bytes",
      passed: totalJSSize < 500000, // < 500KB
      benchmark: 500000,
      details: {
        fileCount: jsResources.length,
        totalSize: totalJSSize,
      },
    };
  }

  async testMobilePerformance() {
    const isMobile = window.innerWidth < 768;
    const connection = navigator.connection;
    const effectiveType = connection?.effectiveType || "unknown";

    // Simulate mobile conditions
    const mobileScore = this.calculateMobileScore();

    return {
      name: "Mobile Performance",
      value: mobileScore,
      unit: "score",
      passed: mobileScore > 80,
      benchmark: 80,
      details: {
        isMobile: isMobile,
        connectionType: effectiveType,
        viewportWidth: window.innerWidth,
      },
    };
  }

  calculateMobileScore() {
    let score = 100;

    // Deduct points for various issues
    const images = document.querySelectorAll("img");
    const unlazyImages = Array.from(images).filter(
      img =>
        !img.hasAttribute("loading") || img.getAttribute("loading") !== "lazy"
    );
    score -= unlazyImages.length * 5;

    // Check for touch optimization
    const touchElements = document.querySelectorAll("a, button");
    const untouchedElements = Array.from(touchElements).filter(el => {
      const styles = getComputedStyle(el);
      return parseInt(styles.minHeight) < 44; // iOS touch target size
    });
    score -= untouchedElements.length * 2;

    return Math.max(0, score);
  }

  generateReport() {
    console.log("Performance Test Results:");
    console.table(this.results);

    const failedTests = this.results.filter(result => !result.passed);
    if (failedTests.length > 0) {
      console.warn("Failed tests:", failedTests);
    }

    // Send results to analytics
    this.sendResultsToAnalytics();
  }

  sendResultsToAnalytics() {
    if (typeof gtag !== "undefined") {
      this.results.forEach(result => {
        gtag("event", "performance_test", {
          event_category: "Performance",
          test_name: result.name,
          test_value: result.value,
          test_passed: result.passed,
        });
      });
    }
  }
}

// Run tests after page load
window.addEventListener("load", () => {
  setTimeout(() => {
    new PerformanceTester();
  }, 2000);
});
```

## Best Practices Summary

### Implementation Checklist

1. **Image Optimization**
   - [ ] Implement WebP format support
   - [ ] Add lazy loading for all images
   - [ ] Use responsive image sets
   - [ ] Compress images to appropriate quality

2. **Code Optimization**
   - [ ] Minify CSS and JavaScript
   - [ ] Implement critical CSS inlining
   - [ ] Use async/defer for non-critical scripts
   - [ ] Remove unused code

3. **Caching Strategy**
   - [ ] Implement service worker
   - [ ] Set up browser caching
   - [ ] Use CDN for static assets
   - [ ] Enable compression

4. **Performance Monitoring**
   - [ ] Set up Core Web Vitals tracking
   - [ ] Implement performance budgets
   - [ ] Monitor real user metrics
   - [ ] Regular performance audits

5. **Mobile Optimization**
   - [ ] Optimize for touch interfaces
   - [ ] Implement PWA features
   - [ ] Test on real devices
   - [ ] Optimize for slow networks

## Conclusion

Optimizing Squarespace performance requires a multi-faceted approach combining image optimization, code efficiency, caching strategies, and careful monitoring. While Squarespace imposes some limitations, the techniques outlined in this guide can significantly improve site performance and user experience.

Key takeaways:

- **Core Web Vitals** are essential for SEO and user experience
- **Image optimization** provides the biggest performance gains
- **JavaScript optimization** reduces blocking and improves interactivity
- **Caching strategies** improve repeat visit performance
- **Mobile optimization** is crucial for modern web standards

By implementing these optimizations systematically and monitoring their impact, you can achieve significant performance improvements that translate to better user engagement and search rankings.

---

_Remember to test all optimizations thoroughly and monitor their impact on your specific Squarespace site's performance metrics._
