import { test, expect } from '@playwright/test';

const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  wide: { width: 1920, height: 1080 }
};

test.describe('Responsive Design Tests', () => {
  Object.entries(viewports).forEach(([name, viewport]) => {
    test.describe(`${name} viewport (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(viewport);
      });

      test('Navigation adapts correctly', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        if (viewport.width < 640) {
          // Mobile: hamburger menu should be visible
          const hamburger = page.locator('.hamburger-menu');
          await expect(hamburger).toBeVisible();
          
          // Desktop menu should be hidden
          const desktopMenu = page.locator('#menu-items');
          await expect(desktopMenu).toHaveClass(/display-none/);
          
          // Test mobile menu functionality
          await hamburger.click();
          await expect(desktopMenu).not.toHaveClass(/display-none/);
        } else {
          // Desktop: hamburger should be hidden
          const hamburger = page.locator('.hamburger-menu');
          await expect(hamburger).toBeHidden();
          
          // Desktop menu should be visible
          const desktopMenu = page.locator('#menu-items');
          await expect(desktopMenu).toBeVisible();
        }
      });

      test('Content width and padding', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const main = page.locator('main');
        const mainBox = await main.boundingBox();
        
        // Check content doesn't overflow viewport
        expect(mainBox?.width).toBeLessThanOrEqual(viewport.width);
        
        // Check appropriate padding
        const padding = await main.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            left: parseInt(style.paddingLeft),
            right: parseInt(style.paddingRight)
          };
        });
        
        if (viewport.width < 640) {
          expect(padding.left + padding.right).toBeGreaterThanOrEqual(32);
        } else {
          expect(padding.left + padding.right).toBeGreaterThanOrEqual(48);
        }
      });

      test('Typography scales appropriately', async ({ page }) => {
        await page.goto('/posts');
        await page.waitForLoadState('networkidle');
        
        const heading = page.locator('h1').first();
        const fontSize = await heading.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        
        const fontSizeNum = parseInt(fontSize);
        
        if (viewport.width < 640) {
          expect(fontSizeNum).toBeGreaterThanOrEqual(24);
          expect(fontSizeNum).toBeLessThanOrEqual(32);
        } else {
          expect(fontSizeNum).toBeGreaterThanOrEqual(32);
          expect(fontSizeNum).toBeLessThanOrEqual(48);
        }
      });

      test('Blog cards layout', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const cards = page.locator('article');
        const cardCount = await cards.count();
        
        if (cardCount > 1) {
          const firstCard = await cards.first().boundingBox();
          const secondCard = await cards.nth(1).boundingBox();
          
          if (viewport.width < 768) {
            // Cards should stack vertically on mobile
            expect(secondCard?.y).toBeGreaterThan(firstCard?.y! + firstCard?.height!);
          }
        }
      });

      test('Images are responsive', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const images = page.locator('img');
        const imageCount = await images.count();
        
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const box = await img.boundingBox();
          
          if (box) {
            // Images shouldn't overflow viewport
            expect(box.width).toBeLessThanOrEqual(viewport.width);
            
            // Images should have appropriate sizes
            if (viewport.width < 640) {
              expect(box.width).toBeLessThanOrEqual(viewport.width - 32);
            }
          }
        }
      });

      test('Touch targets are adequate size', async ({ page }) => {
        if (viewport.width >= 768) {
          test.skip();
        }
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Check all clickable elements
        const clickables = page.locator('a, button');
        const count = await clickables.count();
        
        for (let i = 0; i < count; i++) {
          const element = clickables.nth(i);
          const box = await element.boundingBox();
          
          if (box && await element.isVisible()) {
            // WCAG 2.1 recommends 44x44 pixels minimum
            expect(box.width).toBeGreaterThanOrEqual(44);
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test('Horizontal scrolling is prevented', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
        
        // Check specific sections
        const sections = ['header', 'main', 'footer'];
        for (const section of sections) {
          const element = page.locator(section);
          if (await element.count() > 0) {
            const box = await element.boundingBox();
            if (box) {
              expect(box.width).toBeLessThanOrEqual(viewport.width);
            }
          }
        }
      });

      test('Code blocks handle overflow', async ({ page }) => {
        // Navigate to a blog post with code
        await page.goto('/posts');
        const firstPost = page.locator('article a').first();
        await firstPost.click();
        
        const codeBlocks = page.locator('pre');
        const codeCount = await codeBlocks.count();
        
        if (codeCount > 0) {
          for (let i = 0; i < codeCount; i++) {
            const code = codeBlocks.nth(i);
            const overflow = await code.evaluate(el => 
              window.getComputedStyle(el).overflowX
            );
            
            // Code blocks should scroll horizontally if needed
            expect(['auto', 'scroll']).toContain(overflow);
          }
        }
      });
    });
  });

  test('Orientation changes are handled', async ({ page, browserName }) => {
    if (browserName !== 'chromium') {
      test.skip();
    }
    
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const portraitScreenshot = await page.screenshot();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(300);
    
    const landscapeScreenshot = await page.screenshot();
    
    // Content should adapt without breaking
    expect(portraitScreenshot).not.toEqual(landscapeScreenshot);
  });
});