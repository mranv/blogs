import { test, expect } from '@playwright/test';

test.describe('Component Functionality Tests', () => {
  test.describe('Header Component', () => {
    test('Logo links to homepage', async ({ page }) => {
      await page.goto('/posts');
      await page.click('.logo');
      await expect(page).toHaveURL('/');
    });

    test('Navigation active states', async ({ page }) => {
      // Test Posts page
      await page.goto('/posts');
      const postsLink = page.locator('nav a[href="/posts/"]');
      await expect(postsLink).toHaveClass(/active/);
      
      // Test Tags page
      await page.goto('/tags');
      const tagsLink = page.locator('nav a[href="/tags/"]');
      await expect(tagsLink).toHaveClass(/active/);
      
      // Test About page
      await page.goto('/about');
      const aboutLink = page.locator('nav a[href="/about/"]');
      await expect(aboutLink).toHaveClass(/active/);
    });

    test('Mobile menu toggle', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const hamburger = page.locator('.hamburger-menu');
      const menuItems = page.locator('#menu-items');
      
      // Initially closed
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      await expect(menuItems).toHaveClass(/display-none/);
      
      // Open menu
      await hamburger.click();
      await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
      await expect(menuItems).not.toHaveClass(/display-none/);
      
      // Close menu
      await hamburger.click();
      await expect(hamburger).toHaveAttribute('aria-expanded', 'false');
      await expect(menuItems).toHaveClass(/display-none/);
    });

    test('Skip to content link', async ({ page }) => {
      await page.goto('/');
      
      // Focus skip link
      await page.keyboard.press('Tab');
      const skipLink = page.locator('#skip-to-content');
      await expect(skipLink).toBeFocused();
      
      // Click skip link
      await skipLink.click();
      
      // Should focus main content
      const mainContent = page.locator('#main-content');
      await expect(mainContent).toBeInViewport();
    });
  });

  test.describe('Theme Toggle', () => {
    test('Theme persistence', async ({ page }) => {
      await page.goto('/');
      
      // Get initial theme
      const initialTheme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      
      // Toggle theme
      await page.click('[aria-label="Toggle theme"]');
      
      // Check theme changed
      const newTheme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      expect(newTheme).not.toBe(initialTheme);
      
      // Navigate to another page
      await page.goto('/posts');
      
      // Theme should persist
      const persistedTheme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      expect(persistedTheme).toBe(newTheme);
      
      // Check localStorage
      const storedTheme = await page.evaluate(() => 
        localStorage.getItem('theme')
      );
      expect(storedTheme).toBe(newTheme);
    });

    test('System preference detection', async ({ page }) => {
      // Clear any stored theme
      await page.goto('/');
      await page.evaluate(() => localStorage.removeItem('theme'));
      
      // Emulate dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      
      const theme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      expect(theme).toBe('dark');
    });

    test('Theme toggle animation', async ({ page }) => {
      await page.goto('/');
      
      const themeToggle = page.locator('[aria-label="Toggle theme"]');
      
      // Check for transition
      const hasTransition = await themeToggle.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return styles.transition !== 'none';
      });
      expect(hasTransition).toBe(true);
    });
  });

  test.describe('Card Component', () => {
    test('Card hover effects', async ({ page }) => {
      await page.goto('/');
      
      const firstCard = page.locator('article').first();
      
      // Get initial styles
      const initialStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      // Hover over card
      await firstCard.hover();
      
      // Wait for animation
      await page.waitForTimeout(300);
      
      // Get hover styles
      const hoverStyles = await firstCard.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      // Styles should change on hover
      expect(hoverStyles.transform).not.toBe(initialStyles.transform);
    });

    test('Card navigation', async ({ page }) => {
      await page.goto('/');
      
      const firstCard = page.locator('article a').first();
      const cardTitle = await firstCard.locator('h2, h3').textContent();
      
      await firstCard.click();
      
      // Should navigate to post
      await expect(page).toHaveURL(/\/posts\/.+/);
      
      // Post title should match
      const postTitle = await page.locator('h1').textContent();
      expect(postTitle).toBe(cardTitle);
    });

    test('Date formatting', async ({ page }) => {
      await page.goto('/');
      
      const dateElements = page.locator('time');
      const count = await dateElements.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const dateEl = dateElements.nth(i);
        const datetime = await dateEl.getAttribute('datetime');
        const displayText = await dateEl.textContent();
        
        // Should have valid datetime attribute
        expect(datetime).toMatch(/^\d{4}-\d{2}-\d{2}/);
        
        // Display text should be formatted
        expect(displayText).toBeTruthy();
        expect(displayText).not.toBe(datetime);
      }
    });
  });

  test.describe('Search Component', () => {
    test('Search functionality', async ({ page }) => {
      await page.goto('/search');
      
      const searchInput = page.locator('input[type="search"]');
      const resultsContainer = page.locator('[data-test="search-results"]');
      
      // Initial state - no results
      await expect(resultsContainer).toBeEmpty();
      
      // Type search query
      await searchInput.fill('security');
      
      // Wait for debounce
      await page.waitForTimeout(500);
      
      // Should show results
      const results = resultsContainer.locator('article, li');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Search keyboard navigation', async ({ page }) => {
      await page.goto('/search');
      
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Press down arrow to navigate results
      await page.keyboard.press('ArrowDown');
      
      // First result should be focused
      const firstResult = page.locator('[data-test="search-results"] a').first();
      await expect(firstResult).toBeFocused();
      
      // Press Enter to navigate
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/posts\/.+/);
    });

    test('Search no results state', async ({ page }) => {
      await page.goto('/search');
      
      const searchInput = page.locator('input[type="search"]');
      await searchInput.fill('xyznonexistentquery123');
      await page.waitForTimeout(500);
      
      // Should show no results message
      const noResults = page.locator('[data-test="no-results"]');
      await expect(noResults).toBeVisible();
      await expect(noResults).toContainText(/no results found/i);
    });

    test('Search input clear', async ({ page }) => {
      await page.goto('/search');
      
      const searchInput = page.locator('input[type="search"]');
      const clearButton = page.locator('[data-test="clear-search"]');
      
      // Type and clear
      await searchInput.fill('test');
      await clearButton.click();
      
      // Input should be empty
      await expect(searchInput).toHaveValue('');
      
      // Results should be cleared
      const results = page.locator('[data-test="search-results"]');
      await expect(results).toBeEmpty();
    });
  });

  test.describe('Pagination', () => {
    test('Pagination navigation', async ({ page }) => {
      await page.goto('/posts');
      
      const pagination = page.locator('[data-test="pagination"]');
      
      // Check if pagination exists (if there are enough posts)
      if (await pagination.count() > 0) {
        const nextButton = pagination.locator('[data-test="next-page"]');
        
        if (await nextButton.isEnabled()) {
          await nextButton.click();
          await expect(page).toHaveURL(/\/posts\/2/);
          
          // Previous button should now be visible
          const prevButton = pagination.locator('[data-test="prev-page"]');
          await expect(prevButton).toBeVisible();
          await expect(prevButton).toBeEnabled();
        }
      }
    });

    test('Pagination accessibility', async ({ page }) => {
      await page.goto('/posts');
      
      const pagination = page.locator('[data-test="pagination"]');
      
      if (await pagination.count() > 0) {
        // Should have proper ARIA labels
        await expect(pagination).toHaveAttribute('role', 'navigation');
        await expect(pagination).toHaveAttribute('aria-label', /pagination/i);
        
        // Current page should be marked
        const currentPage = pagination.locator('[aria-current="page"]');
        await expect(currentPage).toBeVisible();
      }
    });
  });

  test.describe('Tag Component', () => {
    test('Tag navigation', async ({ page }) => {
      await page.goto('/tags');
      
      const firstTag = page.locator('[data-test="tag-link"]').first();
      const tagName = await firstTag.textContent();
      
      await firstTag.click();
      
      // Should navigate to tag page
      await expect(page).toHaveURL(/\/tags\/.+/);
      
      // Page should show tag name
      const pageTitle = page.locator('h1');
      await expect(pageTitle).toContainText(tagName || '');
    });

    test('Tag count display', async ({ page }) => {
      await page.goto('/tags');
      
      const tags = page.locator('[data-test="tag-item"]');
      const count = await tags.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const tag = tags.nth(i);
        const countElement = tag.locator('[data-test="tag-count"]');
        
        // Should display post count
        const countText = await countElement.textContent();
        expect(countText).toMatch(/\d+/);
      }
    });
  });
});

function _greaterThan(expected: number) {
  return {
    pass: (actual: number) => actual > expected,
    message: () => `expected ${expected} to be greater than ${expected}`
  };
}