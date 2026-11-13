# UI Upgrade Plan — React component libraries

Status: **phase 1 built** (2026-11-13), not yet committed or deployed. Delete this file once it ships.

## Shipped in phase 1

| Effect | Source | File | Tech |
|---|---|---|---|
| Reading-progress ring = back to top (post pages) | Skiper UI 89 | `src/components/fx/ReadingProgress.tsx` | React + motion |
| Scramble headline (404) | Animata gibberish-text | `src/components/fx/ScrambleText.tsx` | React |
| Cursor spotlight border (post cards) | Vengeance glow-border-card | `fx.css` + `fx/SpotlightTracker.astro` | CSS + 1 listener |
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
