// Production-ready theme toggle script
(() => {
  // State management
  let currentTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");

  // Apply theme to DOM
  function applyTheme() {
    localStorage.setItem("theme", currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);

    const themeBtn = document.querySelector("#theme-btn");
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", currentTheme);
    }

    // Update theme-color meta tag
    requestAnimationFrame(() => {
      const bgColor = getComputedStyle(document.body).backgroundColor;
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute("content", bgColor);
      }
    });
  }

  // Toggle theme
  function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme();
  }

  // Initialize theme button
  function initThemeButton() {
    const themeBtn = document.querySelector("#theme-btn");
    if (!themeBtn) return;

    // Remove any existing listeners
    const newBtn = themeBtn.cloneNode(true);
    themeBtn.parentNode.replaceChild(newBtn, themeBtn);

    // Add single click listener
    newBtn.addEventListener("click", toggleTheme);
  }

  // Apply theme immediately
  applyTheme();

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeButton);
  } else {
    initThemeButton();
  }

  // Handle Astro view transitions
  document.addEventListener("astro:after-swap", () => {
    applyTheme();
    initThemeButton();
  });

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", e => {
      currentTheme = e.matches ? "dark" : "light";
      applyTheme();
    });
  } else {
    // Fallback for older browsers
    mediaQuery.addListener(e => {
      currentTheme = e.matches ? "dark" : "light";
      applyTheme();
    });
  }
})();
