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
      function n() {
        document.querySelector("#theme-btn")?.addEventListener("click", () => {
          e = "light" === e ? "dark" : "light";
          t();
        });
      }
      n(), document.addEventListener("astro:after-swap", n);
    }),
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", ({ matches: m }) => {
        e = m ? "dark" : "light";
        t();
      });
})();
