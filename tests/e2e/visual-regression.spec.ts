import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport size for visual tests
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Homepage - Light Theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Homepage - Dark Theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Click theme toggle
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await themeToggle.click();
    
    // Wait for theme transition
    await page.waitForTimeout(300);
    
    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Blog Post Card Hover States', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const firstCard = page.locator('article').first();
    await firstCard.hover();
    
    await expect(firstCard).toHaveScreenshot('card-hover.png');
  });

  test('Mobile Navigation Menu', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Open mobile menu
    await page.locator('.hamburger-menu').click();
    await page.waitForTimeout(300); // Wait for animation
    
    await expect(page.locator('nav')).toHaveScreenshot('mobile-nav-open.png');
  });

  test('Search Interface', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('search-page.png', {
      fullPage: true,
    });
    
    // Test search with results
    await page.fill('input[type="search"]', 'security');
    await page.waitForTimeout(500); // Wait for search debounce
    
    await expect(page).toHaveScreenshot('search-results.png', {
      fullPage: true,
    });
  });

  test('Blog Post Layout', async ({ page }) => {
    await page.goto('/posts');
    const firstPostLink = page.locator('article a').first();
    await firstPostLink.click();
    
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('blog-post.png', {
      fullPage: true,
    });
  });

  test('Tags Page', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('tags-page.png', {
      fullPage: true,
    });
  });

  test('About Page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
    });
  });
});