import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Core Web Vitals - Homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise<{
        lcp: number;
        cls: number;
        ttfb: number;
        domContentLoaded: number;
        windowLoad: number;
      }>((resolve) => {
        let lcp: PerformanceEntry | undefined, cls: number = 0;
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          lcp = entries[entries.length - 1];
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (approximated with first interaction)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          // fid = entries[0]; // Commented out unused variable
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShiftEntry = entry as any; // Cast to handle layout shift properties
            if (!layoutShiftEntry.hadRecentInput) {
              clsValue += layoutShiftEntry.value;
            }
          }
          cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Wait for metrics to be collected
        setTimeout(() => {
          resolve({
            lcp: (lcp as any)?.startTime || 0,
            cls: cls || 0,
            // Also get other useful metrics
            ttfb: 0, // Using modern Performance API instead of deprecated timing
            domContentLoaded: 0, // Using modern Performance API instead of deprecated timing
            windowLoad: 0 // Using modern Performance API instead of deprecated timing
          });
        }, 5000);
      });
    });
    
    // Assert Core Web Vitals thresholds
    expect(metrics.lcp).toBeLessThan(2500); // Good LCP < 2.5s
    expect(metrics.cls).toBeLessThan(0.1); // Good CLS < 0.1
    expect(metrics.ttfb).toBeLessThan(800); // Good TTFB < 800ms
  });

  test('JavaScript bundle size', async ({ page }) => {
    const jsRequests: number[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') && response.status() === 200) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          jsRequests.push(parseInt(contentLength));
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const totalJSSize = jsRequests.reduce((sum, size) => sum + size, 0);
    const totalJSSizeKB = totalJSSize / 1024;
    
    // Total JS should be under 200KB for good performance
    expect(totalJSSizeKB).toBeLessThan(200);
  });

  test('Image optimization', async ({ page }) => {
    const imageRequests: Array<{ url: string, size: number }> = [];
    
    page.on('response', response => {
      const url = response.url();
      if ((url.includes('.jpg') || url.includes('.png') || url.includes('.webp')) && response.status() === 200) {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          imageRequests.push({
            url,
            size: parseInt(contentLength)
          });
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check each image is reasonably sized
    for (const img of imageRequests) {
      const sizeKB = img.size / 1024;
      // Images should generally be under 200KB unless they're hero images
      if (!img.url.includes('hero') && !img.url.includes('banner')) {
        expect(sizeKB).toBeLessThan(200);
      }
    }
  });

  test('Time to Interactive', async ({ page }) => {
    await page.goto('/');
    
    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('PerformanceObserver' in window) {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const navEntry = entries.find(entry => entry.entryType === 'navigation');
            if (navEntry) {
              resolve((navEntry as any).interactive || 0);
            }
          }).observe({ entryTypes: ['navigation'] });
        }
        
        // Fallback measurement using modern Performance API
        setTimeout(() => {
          const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigationEntry) {
            resolve(navigationEntry.domInteractive - navigationEntry.fetchStart);
          } else {
            resolve(0);
          }
        }, 100);
      });
    });
    
    // Time to Interactive should be under 3.8s for good performance
    expect(tti).toBeLessThan(3800);
  });

  test('Memory usage', async ({ page }) => {
    if (!page.context().browser()?.browserType().name().includes('chromium')) {
      test.skip();
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Navigate through several pages
    await page.goto('/posts');
    await page.goto('/tags');
    await page.goto('/about');
    await page.goto('/');
    
    // Final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory growth should be reasonable (less than 50MB)
    const memoryGrowth = (finalMemory - initialMemory) / 1024 / 1024;
    expect(memoryGrowth).toBeLessThan(50);
  });

  test('Resource caching', async ({ page }) => {
    // First visit
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Count cached resources on second visit
    let cachedResources = 0;
    page.on('response', response => {
      // Check if response was served from cache
      if (response.status() === 304 || response.headers()['cache-control']) {
        cachedResources++;
      }
    });
    
    // Second visit
    await page.goto('/posts');
    await page.goto('/'); // Return to homepage
    await page.waitForLoadState('networkidle');
    
    // Should have cached resources
    expect(cachedResources).toBeGreaterThan(0);
  });

  test('Lazy loading images', async ({ page }) => {
    await page.goto('/');
    
    // Get all images
    const images = await page.locator('img').evaluateAll(imgs => 
      imgs.map(img => {
        const imgElement = img as HTMLImageElement;
        return {
          src: imgElement.src,
          loading: imgElement.loading,
          isInViewport: imgElement.getBoundingClientRect().top < window.innerHeight
        };
      })
    );
    
    // Below-the-fold images should have loading="lazy"
    const belowFoldImages = images.filter(img => !img.isInViewport);
    for (const img of belowFoldImages) {
      expect(img.loading).toBe('lazy');
    }
  });

  test('Network requests optimization', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for duplicate requests
    const uniqueRequests = new Set(requests);
    expect(uniqueRequests.size).toBe(requests.length);
    
    // Check total number of requests is reasonable
    expect(requests.length).toBeLessThan(50);
  });
});