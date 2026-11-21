# UI Upgrade Plan — React component libraries

Status: phases 1 and 2 shipped to main (b0b2dda, d971637); rows below are kept as the map of what lives where.

## Phase 2 — "Paper & Ink" restyle (2026-11-15)

The whole site was restyled after the ryoku.dev design system: black paper, bone ink,
1px hairlines, 2px corners, no glow. This **supersedes the Obsidian Copper palette** below.

| What | Where |
|---|---|
| Palette tokens (paper / ink ×4 / signal); every legacy token derives from them | `src/styles/variables.styl` |
| Hairline + tint tokens, component overrides, grain, effects switched off | `src/styles/ryoku.css` (imported last in `Layout.astro`) |
| Fonts: Fraunces (headings), Space Grotesk (body), Space Mono (code) | `Layout.astro` imports, `tailwind.config.cjs` |
| All `rounded-*` → 2px; `white` remapped to bone ink | `tailwind.config.cjs` |
| Banner image off | `src/config.ts` (`banner.enable`) |
| Footer rebuilt as tagline + link columns; widget titles are `.eyebrow` labels | `Footer.astro`, `widget/WidgetLayout.astro` |

| Home hero (headline), dark theme as default | `src/pages/[...page].astro`, `src/constants/constants.ts` |
| ASCII art strip on every page, piece picked by URL hash at build time | `src/components/fx/AsciiArt.astro`, rendered by `MainGridLayout.astro` (`art={false}` opts out) |
| Home hero globe (WebGL, `cobe@2.0.1`), follows the theme switch; live visitor dots polled from `functions/api/visitors.ts` (check: `node --experimental-strip-types scripts/check-visitors.mjs`) | `src/components/fx/Globe.tsx` |
| Code blocks: `github-light` base theme, dark theme under `html.dark` | `astro.config.mjs` (`expressiveCode`) |
| Native platform features from GoogleChrome/modern-web-guidance: `color-scheme` per theme, `accent-color`, `text-wrap: pretty` in prose, `content-visibility` on post cards, `text-scale` meta, `color-scheme`/`theme-color` metas synced to the theme switch. Found with `modern-web-guidance legacy-scan src` (0.0.203). Skipped on purpose: speculation rules and cross-document view transitions (Swup does client-side navigation), `scrollbar-color` (OverlayScrollbars owns scrollbars) | `src/styles/ryoku.css` (PLATFORM), `Layout.astro` head |
| React Bits effects (14 components): click sparks, footer marquee, avatar glare (all pages); hero, post counters, archive totals, about/projects banners, fuzzy 404 | `src/components/reactbits/` (see its README) |

## Phase 3 — Ink layer (2026-11-22)

Sumi-e motion that plays without interaction, so every visitor sees it. All in Paper & Ink tokens;
everything is off under `prefers-reduced-motion`.

| What | Where |
|---|---|
| Type Garden toy at `/type-garden/` (port of Akshat Agarwal's Type Garden): Sumi, Kintsugi, Sashiko, Garden looks; typewriter intro, `?words=a,b`; navbar "Garden" link is `external: true` so Swup never swaps it in | `public/type-garden/index.html` (one file on purpose, see its header) |
| Ink Type: headings typed in on view (post title + hanko seal, card titles, post h2/h3, archive years), brush stroke under post h2s, ink-spread post images, printed code blocks, blockquote rules, end-of-post ensō, ensō loader during Swup visits, `[data-ink-cycle]` taglines (About, Projects, 404), footer seal, seasonal falling marks over the home hero (`?season=` to preview) | `public/ink-type.js` (what each part does: its header comment); hooks: `data-ink-type`, `data-ink-cycle`, `data-ink-stamp`, `data-ink-fin`, `data-petals` |

| Reader switch "Calm motion": theme panel (desktop) + footer "Motion: ink/calm" (all screens); `html.ink-calm`, stored in localStorage, stops `ink-type.js` and `ink-fx.js` | `window.inkCalm` inline in `Layout.astro` head; `LightDarkSwitch.svelte`; `Footer.astro` |
| Garden share: Link button (`?words=&look=&pal=`), remembers look + palette per browser, own share card `og.png` | `public/type-garden/index.html` |

Landmine: the typed-heading selector lives twice, in `ink-type.js` (`SEL`) and in the
`ink-type-wait` rule in `Layout.astro`'s `<head>`; change both together.

Phase-1 effect class names still exist in markup (spotlight-card, holo-sweep, rainbow-badge,
border-trail), but their CSS is pruned: glow.css lost the neon/holo/rainbow/glass utilities,
ambient body::before glows and all keyframes; fx.css lost spotlight-card and border-trail.
`ryoku.css` "EFFECTS OFF" now holds only the flat replacements (tag focus fill, avatar hairline
frame, focus ring). Text-roll, glow-btn, scramble text and the reading-progress ring still run.

Landmines: `color-mix(in ...)` cannot go in a `.styl` file (Stylus parses `in` as an operator).
Font stacks (`--font-*`) must be set in `ryoku.css`, not `variables.styl`: Stylus emits them as one
quoted string, which is an invalid family and falls back to Times.
`astro dev` runs out of heap on this repo (1,600+ posts, even at 8 GB); verify with `pnpm build`.
Build memory: the Cloudflare Pages builder OOM-kills the build (log shows `Killed`, exit 137) when
peak RSS gets too high, and a failed build leaves the previous deploy live with no other signal.
`legacy: { collections: true }` in `astro.config.mjs` keeps the peak at ~6.5 GB (9.1 GB without);
it also means the posts schema must not declare `slug`. Anything that grows rendered post HTML
(e.g. another Expressive Code theme) raises the peak: measure before pushing.

## Shipped in phase 1

| Effect | Source | File | Tech |
|---|---|---|---|
| Reading-progress ring = back to top (post pages) | Skiper UI 89 | `src/components/fx/ReadingProgress.tsx` | React + motion |
| Scramble headline (404) | replaced 2026-11-15 by React Bits DecryptedText / FuzzyText | `src/components/reactbits/` | React |
| ~~Cursor spotlight border (post cards)~~ removed 2026-11-22 (flat design hid it) | Vengeance glow-border-card | (deleted) | |
| Text-roll hover (navbar links) | Skiper UI 58 | `fx/TextRoll.astro` + `fx.css` | CSS |
| Border trail (profile avatar) | Animata animated-border-trail | `fx.css` | CSS |
| Glow button (newsletter submit) | Vengeance radial-glow-button | `fx.css` | CSS |

Also in phase 1: palette "Obsidian Copper" in `src/styles/variables.styl` (graphite/ink neutrals,
copper accent, teal secondary glow; replaces the cream/plum theme), `--hue: 50` defined (it was
referenced by oklch() colours but never set), and the About page rewritten in a first-person voice.

Rule kept: React only where state is needed; everything stateless is CSS in `src/styles/fx.css`.
Skiper UI free tier requires attribution: credit is in `Footer.astro` — keep it.

Next candidates: Skiper 41 progressive blur (TOC/sidebar edges), Animata marquee (tags),
Vengeance stagger/flip text (home hero), more on request.

Goal: use animated components from Skiper UI, Vengeance UI and Animata on the blog,
restyled to our own theme tokens so light/dark mode stays coherent.

## Libraries

| Library | What it is | How to get source |
|---|---|---|
| Animata (`codse/animata`, animata.design) | Free copy-paste React + Tailwind + Motion | Clone repo to scratchpad, read, copy files |
| Skiper UI (skiper-ui.com) | shadcn-style React; **some components paid** | Read source from docs/registry JSON; free tier only |
| Vengeance UI | React + Radix + Framer Motion, CLI-distributed | Read source from docs/registry; don't run CLI |

Rule: **do not run `npx shadcn add` / `npx vengeance-ui`** — they execute network code
and write into the repo. Fetch source, read it, then copy it in by hand.

## Blockers (fix first)

1. FIXED: sharp's install script builds from source when it finds a system libvips
   (Arch ships libvips 8.18.7). Install with `SHARP_IGNORE_GLOBAL_LIBVIPS=1 pnpm install`
   (fish: `env SHARP_IGNORE_GLOBAL_LIBVIPS=1 pnpm install`).
2. DONE: `pnpm check` passes; functions/ typecheck clean with strictNullChecks.

## Uncommitted work already on disk (commit separately, before UI work)

Newsletter security fixes in `functions/`, `email-worker/src/index.ts`, `src/utils/content-utils.ts`,
plus `git rm anubhav` (stray Wazuh XML):
signed (HMAC) unsubscribe links, XSS escape on unsubscribed page, admin secret header-only,
constant-time worker auth, cheaper admin stats, 7-day TTL on unconfirmed signups, build log noise removed.
Deploy note: Pages project needs `EMAIL_WORKER_SECRET`; deploy Worker + Pages together;
old unsubscribe links now show the "invalid link" page.

## Steps

1. **Deps** — add `@astrojs/react`, `react`, `react-dom`, `motion`, `clsx`, `tailwind-merge`.
   Check `@astrojs/react` peer range vs `astro@5.12.5` (`npm view @astrojs/react peerDependencies`).
   Pin exact versions released ≥7 days ago.
2. **Config**
   - `astro.config.mjs`: add `react()` integration; add a `vendor-react` manualChunks bucket
     for `react|react-dom|motion|framer`.
   - `tailwind.config.cjs`: make sure `content` globs include `.tsx`/`.jsx`.
   - `tsconfig.json`: `jsx: "react-jsx"`, `jsxImportSource: "react"` if missing.
   - `src/lib/cn.ts`: `clsx` + `tailwind-merge` helper the components expect.
3. **Tailwind v3 compatibility** — site is Tailwind 3.4. Many current shadcn/Skiper components
   assume v4 (`@theme`, `tw-animate-css`, v4-only utilities). Rewrite those per component;
   do **not** upgrade Tailwind as a side effect.
4. **Token mapping** — replace `bg-primary`, `border-border`, `text-muted-foreground` etc. with ours:
   `var(--primary)`, `var(--line-divider)`, `var(--card-bg)`, `text-50/75/90`
   (see `src/styles/variables.styl`, `tailwind.config.cjs`).
5. **Components → surfaces** (~6–8 total, bounded; add more on request):
   | Surface | File | Candidate |
   |---|---|---|
   | Home post cards | `src/components/PostCard.astro` | spotlight / glow / tilt card |
   | Profile card | `src/components/widget/Profile.astro` | animated border / reflective card |
   | Navbar | `src/components/Navbar.astro` | animated nav pill / hover highlight |
   | Newsletter box | `src/components/widget/Newsletter.astro` | animated input + shimmer button |
   | Tags / categories | `src/components/widget/Tags.astro` | marquee or hover chips |
   | 404 | `src/pages/404.astro` | animated text / hero |
6. **Hydration** — use `client:visible` / `client:idle`. Sidebar ships to all 1,614 post pages:
   keep motion-heavy components off it unless chosen deliberately. Respect `prefers-reduced-motion`.
7. **swup landmine** — swup swaps `main` and `#toc` on client navigation. Test each island by
   navigating *to* its page from another page, not only on hard load.
8. **Verify** — `pnpm check`, then `pnpm build` (long: 1,614 posts + pagefind; run in background).
   Visual check only via the dev-servers rule's throwaway port range, killed afterwards.
