import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('Homepage accessibility - Light theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Homepage accessibility - Dark theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Switch to dark theme
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('#skip-to-content');
    await expect(skipLink).toBeFocused();
    
    // Test navigation items are reachable
    await page.keyboard.press('Tab'); // Logo
    await page.keyboard.press('Tab'); // Posts
    await page.keyboard.press('Tab'); // Tags
    await page.keyboard.press('Tab'); // About
    await page.keyboard.press('Tab'); // Search
    
    const searchButton = page.locator('[aria-label="search"]');
    await expect(searchButton).toBeFocused();
    
    // Test theme toggle
    await page.keyboard.press('Tab');
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeFocused();
  });

  test('ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check main navigation has proper ARIA
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('role', 'navigation');
    
    // Check theme toggle has proper ARIA
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible();
    
    // Check search has proper ARIA
    const searchButton = page.locator('[aria-label="search"]');
    await expect(searchButton).toBeVisible();
    
    // Check mobile menu button ARIA
    const isMobile = await page.viewportSize()?.width! < 640;
    if (isMobile) {
      const menuButton = page.locator('.hamburger-menu');
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      await menuButton.click();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    }
  });

  test('Color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('.color-contrast')
      .analyze();
    
    const contrastViolations = results.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('Form accessibility - Search', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    // Check search input has label
    const searchInput = page.locator('input[type="search"]');
    const labelText = await page.locator('label[for="search-input"]').textContent();
    expect(labelText).toBeTruthy();
    
    // Check search results are announced
    await searchInput.fill('test');
    await page.waitForTimeout(500);
    
    const resultsRegion = page.locator('[role="region"][aria-live="polite"]');
    await expect(resultsRegion).toBeVisible();
  });

  test('Focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test focus trap in mobile menu
    const isMobile = await page.viewportSize()?.width! < 640;
    if (isMobile) {
      await page.locator('.hamburger-menu').click();
      
      // Tab through menu items
      await page.keyboard.press('Tab'); // First menu item
      await page.keyboard.press('Tab'); // Second menu item
      await page.keyboard.press('Tab'); // Third menu item
      await page.keyboard.press('Tab'); // Fourth menu item
      
      // Should cycle back to first item or close button
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['A', 'BUTTON']).toContain(focusedElement);
    }
  });

  test('Heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check there's only one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check heading levels are sequential
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('Image alt texts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const altText = await img.getAttribute('alt');
      expect(altText).toBeTruthy();
    }
  });
});

test.describe('Screen reader tests', () => {
  test('Landmarks are properly defined', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();
    
    // Check for navigation landmark
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for header landmark
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Check for footer landmark
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});