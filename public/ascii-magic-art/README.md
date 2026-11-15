# ascii-magic-art (vendored — don't hand-edit)

Unmodified files from the npm package `ascii-magic-art@1.1.0` (MIT, see `LICENSE`),
source: https://github.com/kailashsr38/ascii-magic-art

Provides the `<ascii-art piece="...">` web component. The runtime is loaded once from
`src/layouts/Layout.astro` `<head>`. Uses:

- `src/pages/404.astro`: `page-404`
- per-page strip `src/components/fx/AsciiArt.astro`: the other nine pieces, one picked per
  URL. Its `PIECES` list and this folder must stay in sync (a missing file = empty strip).

Why vendored instead of a dependency or the hosted script:

- The package ships 734 pieces (5.6 MB); only the pieces we use are copied here.
- Self-hosted so no third-party script runs on the site.

Layout is load-bearing: `runtime/ascii.js` resolves pieces as `../pieces/<slug>.js`
and pieces import `../lib/kit.js`. Keep the three folders as siblings and do not
bundle them (pieces are loaded with a dynamic `import()` at runtime).

To add a piece: `npm pack ascii-magic-art@1.1.0`, copy `pieces/<slug>.js` here,
plus any `lib/*.js` it imports (`lib/scene.js`, `lib/image.js` are not copied yet).
To upgrade: replace every file from the same package version.
