// Simple theme toggle handler that runs immediately
(function () {
  // Get stored theme or system preference
  function getTheme() {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // Apply theme immediately to prevent flash
  const theme = getTheme();
  document.documentElement.setAttribute("data-theme", theme);
})();
