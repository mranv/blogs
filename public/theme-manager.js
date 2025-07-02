// Production-ready theme manager with event delegation
class ThemeManager {
  constructor() {
    this.theme = this.getStoredTheme() || this.getSystemTheme();
    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.initialized = false;

    // Apply theme immediately to prevent flash
    this.applyTheme();

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  getStoredTheme() {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  }

  getSystemTheme() {
    return this.mediaQuery.matches ? "dark" : "light";
  }

  applyTheme() {
    // Store theme
    try {
      localStorage.setItem("theme", this.theme);
    } catch (e) {
      // Handle localStorage errors gracefully
    }

    // Add transition class for smooth theme changes
    if (
      this.initialized &&
      !document.documentElement.classList.contains("theme-transition")
    ) {
      document.documentElement.classList.add("theme-transition");

      // Remove transition class after animation completes
      setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 300);
    }

    // Apply to DOM
    document.documentElement.setAttribute("data-theme", this.theme);

    // Update button aria-label
    const btn = document.getElementById("theme-btn");
    if (btn) {
      btn.setAttribute(
        "aria-label",
        `Current theme: ${this.theme}. Click to toggle.`
      );
    }

    // Update theme-color meta with smooth transition
    requestAnimationFrame(() => {
      const bgColor = getComputedStyle(document.body).backgroundColor;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", bgColor);
      }
    });
  }

  toggle() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.applyTheme();

    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent("theme-changed", {
        detail: { theme: this.theme },
      })
    );
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Use event delegation for better performance
    document.addEventListener("click", e => {
      const btn = e.target.closest("#theme-btn");
      if (btn) {
        e.preventDefault();
        this.toggle();
      }
    });

    // Direct handler as fallback
    const themeBtn = document.getElementById("theme-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", e => {
        e.preventDefault();
        this.toggle();
      });
    }

    // Handle Astro view transitions
    document.addEventListener("astro:after-swap", () => {
      this.applyTheme();
    });

    // Listen for system theme changes
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener("change", e => {
        // Only auto-switch if user hasn't manually set a preference
        if (!this.getStoredTheme()) {
          this.theme = e.matches ? "dark" : "light";
          this.applyTheme();
        }
      });
    } else {
      // Fallback for older browsers
      this.mediaQuery.addEventListener("change", e => {
        if (!this.getStoredTheme()) {
          this.theme = e.matches ? "dark" : "light";
          this.applyTheme();
        }
      });
    }
  }
}

// Initialize theme manager
window.themeManager = new ThemeManager();
