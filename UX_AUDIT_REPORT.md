# UX Audit Report — Anubhav Gain Astro Blog

**Audit Date:** May 22, 2026  
**Auditor:** UX Research Specialist  
**Scope:** Core UI components, layout pages, navigation, profile widget, footer, and content structure  
**Files Audited:** 9 key source files across components, pages, config, styles, and content

---

## Executive Summary

This audit identifies **19 issues** across the Astro blog site: **4 Critical**, **6 Major**, and **9 Minor**. The most impactful problems center around (1) an extremely long sidebar bio that will overflow its container, (2) a navigation bar with 6 links that becomes cramped on tablets, (3) about and project pages that dump massive unstructured content into a single flat card, and (4) a footer with fragile nested spans that may break on narrow viewports. Addressing the critical and major issues would significantly improve readability, responsive behavior, and overall user experience.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 Major | 6 |
| 🟡 Minor | 9 |
| **Total** | **19** |

---

## Critical Issues

### C-01: Profile Bio Text Overflows Sidebar Container

- **Severity:** 🔴 Critical
- **File:** `src/config.ts` (line 65), `src/components/widget/Profile.astro` (line 24)
- **Description:** The `profileConfig.bio` string is **310 characters** long — a dense block listing every role, project, and credential. In `Profile.astro`, the bio is rendered as:
  ```html
  <div class="text-center text-neutral-400 mb-2.5 transition">{config.bio}</div>
  ```
  There is **no `max-width`, `line-clamp`, `overflow-hidden`, or truncation** applied. On the sidebar (constrained to `17.5rem` / 280px via `MainGridLayout.astro` line 74, 91), this bio will render as approximately **15–18 lines of tiny text**, dominating the sidebar and pushing the social link icons far below the fold. The sidebar becomes visually unusable.

- **Suggested Fix:**
  1. Shorten the bio to ≤80 characters: e.g., `"Security Engineer · XDR Architect · Rust & eBPF Specialist"`
  2. Add CSS constraints as a safety net in `Profile.astro`:
     ```html
     <div class="text-center text-neutral-400 mb-2.5 transition line-clamp-3 text-sm">
       {config.bio}
     </div>
     ```
  3. Consider moving the detailed bio to a tooltip or the About page only.

---

### C-02: About Page Renders 225 Lines of Unstructured Content in a Single Card

- **Severity:** 🔴 Critical
- **File:** `src/pages/about.astro`, `src/content/spec/about.md`
- **Description:** The about page template is minimal — a single `card-base` div wrapping a `<Markdown>` component that renders the entire 225-line `about.md` as one continuous wall of text. The content includes 8+ distinct sections (Professional Experience, Open-Source Projects, Industry Engagements, Education, Technical Stack, Research, Online Presence), but the layout provides zero visual differentiation between sections.

  The result is an **extremely long, monotonous scroll** (~4,000–5,000px estimated) with no visual hierarchy beyond markdown headings. Users must scroll through the entire page to find specific information. There are no interactive sections, collapsible panels, tabs, or anchor navigation.

- **Suggested Fix:**
  1. Break the content into visually distinct section cards with spacing, borders, or alternating backgrounds.
  2. Add a sticky in-page navigation or tab system for major sections (Experience, Projects, Education, etc.).
  3. Consider splitting into sub-pages or using collapsible `<details>` elements for long lists (e.g., the 11 open-source projects).
  4. Add a "quick summary" hero section at the top with key stats (222+ citations, current role, tech stack badges).

---

### C-03: No Max-Width or Overflow Constraints on Profile Bio in Sidebar

- **Severity:** 🔴 Critical
- **File:** `src/components/widget/Profile.astro` (line 24)
- **Description:** The Profile widget's bio container (`<div class="text-center text-neutral-400 mb-2.5 transition">`) has **no overflow protection**. The parent card (`<div class="card-base p-3">`) uses `overflow-hidden` via the `card-base` class, but the bio text itself will still render fully — it just won't visually escape the card bounds. Combined with the sidebar's narrow width (`lg:max-w-[17.5rem]`), the bio consumes the majority of visible sidebar space.

  Additionally, on mobile where the sidebar collapses into a horizontal profile bar, the bio text will wrap excessively, creating a visually broken compact header.

- **Suggested Fix:**
  1. Add `line-clamp-3` or `line-clamp-4` to the bio div to limit visible lines.
  2. Add `text-sm` to reduce font size.
  3. Add `overflow-hidden` directly on the bio element.
  4. Implement a "Read more" expansion mechanism if the full bio is needed.

---

### C-04: Navbar with 6 Links Overflows on Tablet Viewports (768px–1024px)

- **Severity:** 🔴 Critical
- **File:** `src/components/Navbar.astro` (lines 33–44), `src/config.ts` (lines 39–59)
- **Description:** The navbar contains **6 links**: Home, Archive, About, Projects, GitHub (mranv), and GitHub (Infopercept). The desktop link container uses `hidden md:flex` (visible at ≥768px), and each link has `px-3 lg:px-5` padding. Combined with the site title link, search icon, and theme toggle, the total horizontal content on a 768px tablet is approximately:

  - Site title: ~150px
  - 6 nav links × ~90px avg: ~540px
  - Search + theme toggle: ~90px
  - **Total: ~780px** — exceeding the 768px viewport.

  At the `md` breakpoint (768px), links will either wrap to a second line or be clipped. There is no `overflow-x-auto`, no text truncation on link labels, and no intermediate breakpoint to collapse less-important links.

  The hamburger menu (`nav-menu-switch`) is hidden on `md:` (`md:!hidden`), so tablet users have no fallback.

- **Suggested Fix:**
  1. Change the desktop breakpoint from `md` to `lg` for showing nav links: `hidden lg:flex`.
  2. Show the hamburger menu at `lg:!hidden` instead of `md:!hidden`.
  3. Alternatively, consolidate the two GitHub links into a single "GitHub" dropdown or use shorter labels ("GitHub", not "GitHub (mranv)").
  4. Add `overflow-hidden` and `text-ellipsis` on link text for safety.
  5. Consider using a priority+ pattern to show primary links and collapse secondary ones.

---

## Major Issues

### M-01: Footer Has Fragile Nested Spans That Break on Mobile

- **Severity:** 🟠 Major
- **File:** `src/components/Footer.astro` (lines 12–26)
- **Description:** The footer uses deeply nested `<span>` elements with mixed `flex`, `flex-wrap`, `hidden`, and `inline` behaviors:
  ```
  div.flex → span (©) / span.hidden (separator) / span.flex (RSS/Sitemap) / span.flex (Built with...)
  ```
  On mobile (< 1024px), the `lg:flex-row` doesn't apply, so all spans stack vertically. The separator `/` between link groups is `hidden lg:inline`, creating inconsistent spacing. The inner `flex-wrap` spans each contain text nodes, links, and separator spans, which can produce awkward line breaks mid-phrase (e.g., "Built" on one line, "with Astro" on the next).

  The outer container has no `max-width` constraint, relying on parent padding, which can cause the footer to stretch full-width on ultra-wide monitors.

- **Suggested Fix:**
  1. Simplify to a flat flex-wrap structure with consistent gap spacing.
  2. Use `gap-x-2` and separator characters as flex items rather than nested spans.
  3. Add `max-w-[var(--page-width)] mx-auto` to the footer container.
  4. Test at 320px, 375px, and 428px widths (common mobile sizes).

---

### M-02: Projects Page Uses Same Flat-Card Layout as About Page

- **Severity:** 🟠 Major
- **File:** `src/pages/projects.astro`, `src/content/spec/projects.md`
- **Description:** The projects page is structurally identical to the about page — a single `card-base` wrapping all 148 lines of content. The markdown contains 4 distinct categories (Security & Kernel Engineering, Platform & Infrastructure, Developer Tools, Enterprise Software), but these are rendered as continuous text without visual grouping.

  Each project listing includes name, description, tech tags, and bullet points. With 12+ projects, this creates an overwhelming wall of text. There are no filter/sort controls, no project cards with visual hierarchy, and no way to quickly scan projects by category.

- **Suggested Fix:**
  1. Render each project as an individual card with consistent layout (title, tags, description, link).
  2. Add category tabs or a filter bar for the 4 sections.
  3. Use a grid layout (2 columns on desktop) for project cards.
  4. Add visual tag badges for tech stack items (Rust, Go, Kubernetes, etc.).

---

### M-03: Duplicate Navigation — GitHub Links Appear in Both Navbar and Profile Sidebar

- **Severity:** 🟠 Major
- **File:** `src/config.ts` (lines 39–59, 66–76)
- **Description:** Both GitHub accounts (`mranv` and `anubhavg-icpl`) appear as:
  - Navbar links (lines 49–58) — visible on every page
  - Profile sidebar icon links (lines 67–76) — visible on pages with sidebar

  This redundancy wastes precious navbar space (contributing to overflow issue C-04) and provides no additional value since the profile sidebar is always visible alongside the navbar on desktop. Users see the same GitHub links twice simultaneously.

- **Suggested Fix:**
  1. Remove the GitHub links from the navbar — keep them only in the profile sidebar where they have icons and more context.
  2. If GitHub must be in the navbar, consolidate to a single "GitHub" link with a dropdown for both accounts.
  3. This would reduce navbar links from 6 to 4, resolving the tablet overflow issue (C-04).

---

### M-04: No Responsive Handling for Long Nav Link Labels

- **Severity:** 🟠 Major
- **File:** `src/components/Navbar.astro` (lines 34–43)
- **Description:** Two navbar links have long labels: "GitHub (mranv)" (13 chars) and "GitHub (Infopercept)" (20 chars). These labels have no `truncate`, `whitespace-nowrap`, or `max-width` constraints. On narrower desktop screens (1024px–1280px), combined with `px-3 lg:px-5` padding, the "GitHub (Infopercept)" link alone consumes ~180px of horizontal space.

  There's also an external link icon (`fa6-solid:arrow-up-right-from-square`) appended to each external link, adding ~20px per link.

- **Suggested Fix:**
  1. Shorten labels: "GitHub (mranv)" → "GitHub", "GitHub (Infopercept)" → "Infopercept".
  2. Add `truncate max-w-[8rem]` to link containers.
  3. Use icon-only representation for external links on smaller screens.

---

### M-05: About Page Has No Table of Contents Despite Having 8+ Sections

- **Severity:** 🟠 Major
- **File:** `src/pages/about.astro`, `src/layouts/MainGridLayout.astro`
- **Description:** The `siteConfig.toc.enable` is set to `true`, and the `MainGridLayout` includes a TOC component. However, the about page passes no `headings` prop to the layout. The TOC component receives an empty `headings` array and renders nothing. With 225 lines of content containing H2 and H3 headings across 8+ sections, a TOC is essential for navigation.

  The same issue applies to the projects page.

- **Suggested Fix:**
  1. Extract headings from the rendered markdown content and pass them to `MainGridLayout`:
     ```astro
     const { Content, headings } = await render(aboutPost);
     ```
  2. Pass `headings` to `<MainGridLayout headings={headings}>`.
  3. Alternatively, add a custom in-page navigation component for long content pages.

---

### M-06: Site Subtitle Is Excessively Long for SEO and UI Display

- **Severity:** 🟠 Major
- **File:** `src/config.ts` (line 13)
- **Description:** The `siteConfig.subtitle` is:
  ```
  "Security Software Engineer · DevSecOps Expert · XDR/OXDR Architect · Rust & eBPF · Windows Kernel Security · 222+ Citations"
  ```
  At **115 characters**, this exceeds the recommended 50–60 character limit for meta descriptions and will be truncated in search engine results. If this subtitle is used in any UI element (hero section, page title suffix), it will also cause layout issues.

- **Suggested Fix:**
  1. Shorten to ≤60 characters: `"Security Engineer · XDR Architect · Rust & eBPF Specialist"`
  2. Move the detailed version to the About page content only.
  3. Use the short version for `<meta name="description">`.

---

## Minor Issues

### m-01: Avatar Alt Text Is Excessively Long

- **Severity:** 🟡 Minor
- **File:** `src/components/widget/Profile.astro` (line 19)
- **Description:** The avatar `alt` attribute is: `"Anubhav Gain - Security Software Engineer at Infopercept, CEO at TechAnv Consulting, DevSecOps Expert"` (105 characters). Screen readers will announce this entire string, which is unnecessarily verbose for a profile photo. Alt text for avatars should typically be short (e.g., "Anubhav Gain" or "Photo of Anubhav Gain").
- **Suggested Fix:** Change to `"Photo of Anubhav Gain"` or `"Anubhav Gain"`.

---

### m-02: Footer Opens Internal Links in New Tabs

- **Severity:** 🟡 Minor
- **File:** `src/components/Footer.astro` (lines 16, 18)
- **Description:** The RSS and Sitemap links use `target="_blank"`, which opens them in new browser tabs. These are internal site resources and should open in the same tab. Opening new tabs for internal navigation is disorienting and violates user expectations. The links also lack `rel="noopener"` attributes.
- **Suggested Fix:** Remove `target="_blank"` from RSS and Sitemap links, or add `rel="noopener noreferrer"`.

---

### m-03: No Skip-to-Content Link for Accessibility

- **Severity:** 🟡 Minor
- **File:** `src/layouts/MainGridLayout.astro`
- **Description:** There is no "Skip to main content" link for keyboard and screen reader users. The first tab stop is the site title in the navbar, followed by all nav links, before reaching the main content area. Users must tab through 8+ elements to reach page content.
- **Suggested Fix:** Add a visually hidden skip link at the top of the layout:
  ```html
  <a href="#content-wrapper" class="sr-only focus:not-sr-only focus:absolute ...">Skip to content</a>
  ```

---

### m-04: Profile Social Links Have Identical GitHub Icons

- **Severity:** 🟡 Minor
- **File:** `src/config.ts` (lines 67–76)
- **Description:** Both GitHub profile links (mranv and anubhavg-icpl) use the same `fa6-brands:github` icon. When displayed as icon-only buttons (the multi-link layout in Profile.astro lines 26–29), users cannot distinguish between the two accounts without hovering or clicking.
- **Suggested Fix:**
  1. Add a tooltip (`title` attribute) to each icon button showing the account name.
  2. Consider using a label below each icon or a combined "GitHub" link that shows both accounts.

---

### m-05: Card Shadow Is Nearly Invisible

- **Severity:** 🟡 Minor
- **File:** `src/styles/main.css` (lines 11–12)
- **Description:** The `.card-shadow` class applies `drop-shadow-[0_2px_4px_rgba(0,0,0,0.005)]`, which has an opacity of **0.5%** — virtually invisible on all displays. This provides no visual depth or card separation, making cards blend into the background.
- **Suggested Fix:** Increase opacity to at least `0.05` (5%) or `0.08` (8%) for perceptible card elevation.

---

### m-06: No Focus Visible Styles on Interactive Elements

- **Severity:** 🟡 Minor
- **File:** `src/styles/main.css`, `src/components/Navbar.astro`, `src/components/widget/Profile.astro`
- **Description:** The `.btn-plain`, `.btn-regular`, and `.link` classes define hover and active states but no `:focus-visible` styles. Keyboard users will see the browser's default focus ring, which may not match the site's design and could be hard to see, especially in dark mode.
- **Suggested Fix:** Add `focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2` to interactive button/link classes.

---

### m-07: `text-50` Utility Class Name Is Ambiguous

- **Severity:** 🟡 Minor
- **File:** `src/styles/main.css` (lines 86–88), `src/components/Footer.astro` (line 12)
- **Description:** The class `.text-50` sets `text-black/50 dark:text-white/50` (50% opacity). The name `text-50` could be confused with Tailwind's `text-[size]` utilities (e.g., `text-sm`, `text-lg`) or font-weight. This reduces code readability for maintainers.
- **Suggested Fix:** Rename to `.text-opacity-50` or `.text-muted` for clarity.

---

### m-08: Theme Toggle Script Is Defined in Navbar but Separate from Svelte Component

- **Severity:** 🟡 Minor
- **File:** `src/components/Navbar.astro` (lines 57–65)
- **Description:** The `switchTheme()` function is defined in a `<script>` tag in `Navbar.astro`, but the actual toggle button is a Svelte component (`LightDarkSwitch.svelte`). This creates a fragile coupling — the script relies on `document.getElementById("scheme-switch")` to attach the click handler, but the button is rendered by a separate component. If the Svelte component's element ID changes, the theme toggle silently breaks.
- **Suggested Fix:** Move the theme toggle logic into the Svelte component itself, or use a shared store/event system.

---

### m-09: Content Pages Have Identical Boilerplate — No Differentiation

- **Severity:** 🟡 Minor
- **File:** `src/pages/about.astro`, `src/pages/projects.astro`
- **Description:** Both content pages have nearly identical templates (28 and 26 lines respectively), differing only in the content entry and meta strings. There is no page-specific layout customization, hero sections, or unique visual treatment. The about page could benefit from a profile hero section, while the projects page could use a grid layout.
- **Suggested Fix:** Create page-specific layouts or add conditional rendering in the template based on content type.

---

## Recommendations Summary

### Immediate Actions (Critical — Fix Before Next Deploy)

| # | Issue | Action | Effort |
|---|-------|--------|--------|
| 1 | C-01/C-03 | Shorten bio to ≤80 chars; add `line-clamp-3 text-sm overflow-hidden` to bio div | Low |
| 2 | C-04 | Change nav breakpoint from `md` to `lg`; show hamburger menu up to `lg` | Low |
| 3 | C-02 | Restructure about page with section cards and in-page navigation | Medium |

### Short-Term Actions (Major — Fix Within 1 Sprint)

| # | Issue | Action | Effort |
|---|-------|--------|--------|
| 4 | M-01 | Simplify footer to flat flex layout with consistent gaps | Low |
| 5 | M-02 | Redesign projects page with card grid and category filters | Medium |
| 6 | M-03 | Remove GitHub links from navbar; keep only in sidebar | Low |
| 7 | M-04 | Shorten external nav labels | Low |
| 8 | M-05 | Pass headings to layout for TOC rendering on content pages | Low |
| 9 | M-06 | Shorten site subtitle to ≤60 characters | Low |

### Long-Term Improvements (Minor — Backlog)

| # | Issue | Action | Effort |
|---|-------|--------|--------|
| 10 | m-01 | Shorten avatar alt text | Trivial |
| 11 | m-02 | Remove `target="_blank"` from internal footer links | Trivial |
| 12 | m-03 | Add skip-to-content link | Low |
| 13 | m-04 | Add tooltips to duplicate GitHub icons | Low |
| 14 | m-05 | Increase card shadow opacity | Trivial |
| 15 | m-06 | Add focus-visible styles to interactive elements | Low |
| 16 | m-07 | Rename `.text-50` to `.text-muted` | Trivial |
| 17 | m-08 | Refactor theme toggle coupling | Medium |
| 18 | m-09 | Create page-specific layouts | Medium |

---

## Impact Assessment

If all critical and major issues are addressed:

- **Sidebar usability** improves dramatically — profile widget becomes scannable instead of dominated by bio text
- **Tablet navigation** becomes functional — no more overflow or inaccessible hamburger menu
- **Content pages** become navigable — users can find specific information without scrolling through 4,000+ px of flat text
- **Footer** renders consistently across all viewport sizes
- **Navbar** fits comfortably within viewport width at all breakpoints ≥768px
- **Accessibility** improves with proper focus styles, skip links, and semantic structure

---

*End of UX Audit Report*
