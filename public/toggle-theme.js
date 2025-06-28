// Optimized theme toggle script
(() => {
  let e =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light");
  function t() {
    localStorage.setItem("theme", e),
      document.documentElement.setAttribute("data-theme", e);
    const t = document.querySelector("#theme-btn");
    t && t.setAttribute("aria-label", e);
    requestAnimationFrame(() => {
      const t = getComputedStyle(document.body).backgroundColor;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", t);
    });
  }
  t(),
    window.addEventListener("load", () => {
      function e() {
        t(),
          document
            .querySelector("#theme-btn")
            ?.addEventListener("click", () => {
              (e = "light" === e ? "dark" : "light"), t();
            });
      }
      e(), document.addEventListener("astro:after-swap", e);
    }),
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: t }) => {
        (e = t ? "dark" : "light"), t();
      });
})();
