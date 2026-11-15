# React Bits components (vendored, unmodified)

Source: https://github.com/DavidHDev/react-bits `src/ts-tailwind/` at commit `cf2801031f07f53d4684e65b961bde7c2e2a6921`
(copied 2026-11-15). Licence: MIT + Commons Clause, see `LICENSE.md`: fine to use inside
this site, not to resell or republish the components on their own.

Copied by hand, not with `npx shadcn add` (docs/UI_UPGRADE_PLAN.md: no CLIs that run
network code in the repo). Only components that need nothing beyond `react` and `motion`
(both already installed) were taken; most backgrounds need `ogl`/`three`/`gsap`.

| Component | Used in |
|---|---|
| ClickSpark | `layouts/MainGridLayout.astro`: wraps page content, every page |
| ScrollVelocity | `Footer.astro`: topic marquee, every page |
| LetterGlitch, BlurText, DecryptedText, Magnet | home hero, `pages/[...page].astro` |
| RotatingText, StarBorder | home hero (topic rotator, About button) |
| FuzzyText, DecryptedText | `pages/404.astro` |
| CountUp | post word/minute counts `pages/posts/[...slug].astro`; archive totals `pages/archive.astro` |
| DotField + ShinyText | banner on `pages/about.astro` |
| ShapeGrid + ShinyText | banner on `pages/projects.astro` |
| GlareHover | avatar in `widget/Profile.astro`, every page |

Landmine: canvas/WebGL components (ClickSpark, LetterGlitch, FuzzyText, DotField, ShapeGrid,
StarBorder) and ShinyText/GlareHover take literal colours,
not CSS variables, so they cannot follow the theme switch. Pass colours that read on both
black and bone paper (the signal orange `#ce5e32`, the muted ink `#958f87`).
Tried and dropped 2026-11-15: GradualBlur on the ASCII strip (smeared the glyphs into a bright band)
and Radar behind the 404 (drew nothing in headless Chromium, so it could not be verified).
Don't hand-edit the .tsx files; to upgrade, re-copy from the same upstream commit.
