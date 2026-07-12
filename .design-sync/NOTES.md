# design-sync notes — bikribazaar-adminfront

Separate design-system project from the storefront sync (different repo dir,
different Claude Design project). Same repo, same approach: no dedicated
component-library package here either — `bikribazaar-adminfront/components/`
is a Next.js app's component folder, synced via the `package` shape with a
hand-written entry + process shim, same as the storefront. Floor cards only
for this first sync.

## Setup decisions

- **Custom entry** (`bikribazaar-adminfront/.ds-entry.ts`): re-exports each
  component's real name (`BikriMark` is a named export; the rest are
  `export default` — re-exported as `export { default as Name }`).
  `components/Nav.tsx` is excluded — it's dead code (`export {}` only, marked
  "SUPERSEDED — safe to delete" in a comment; the live nav is `Sidebar.tsx`).
- **Process shim** (`.ds-process-shim.ts`): `lib/api.ts`, `lib/auth.ts`,
  `lib/store-context.ts` read `process.env.*` at module scope. Same fix as
  the storefront sync — set `globalThis.process = { env: {} }` before any
  component module evaluates.
- **`cfg.cssEntry`**: same as storefront — Tailwind v3 config-based, no
  static compiled stylesheet in the repo. Compiled one with
  `npx tailwindcss -i ./app/globals.css -o ./.ds-compiled-globals.css
  --config ./tailwind.config.ts`, committed as
  `bikribazaar-adminfront/.ds-compiled-globals.css`. `cfg.buildCmd` records
  the regen command — re-run before every re-sync if `app/globals.css` or
  `tailwind.config.ts` change.
- **`cfg.componentSrcMap`**: pins all 10 real components to their `.tsx`
  paths (same reason as storefront: real `--entry`, no `.d.ts` anywhere, so
  the auto export scan finds nothing on its own).

## Known render warns (triaged, not bugs)

- **`[FONT_MISSING] Cambria`** — not a brand font; it's the generic serif
  fallback baked into `@tailwindcss/typography`'s default `.prose` font
  stack (`Georgia, Cambria, "Times New Roman", Times, serif`), not something
  this app ships or needs to. No action needed.
- **`BikriMark` `[RENDER_THIN]`** — it's a small logomark glyph (an "B"
  wordmark, ~24-32px), so "no text / near-empty paint" is the shape of a
  correct render, not a failure. Confirmed visually on the contact sheet
  (small red mark, top-left of its card).

## Re-sync risks

- `.ds-compiled-globals.css` is a generated snapshot — re-run `cfg.buildCmd`
  whenever `app/globals.css` or `tailwind.config.ts` changes, or previews
  drift from the real app.
- `.ds-entry.ts` is hand-maintained — a new file added to `components/` needs
  a matching export line here and a `componentSrcMap` pin, or it won't sync.
- No provider configured. `ProductForm`/`ImageUploader`/`VariantStockControls`
  etc. render via floor-card crash-prevention defaults, not real store data —
  treat this as "the building blocks exist and are on-brand," not "these are
  validated against live data."
- The bundle inlines ~50 npm packages (Tiptap editor + deps for
  `MarkdownEditor`) — expect a larger `_ds_bundle.js` (~2MB) than the
  storefront sync.

## Regenerating the compiled CSS + rebuilding

```sh
cd bikribazaar-adminfront
npx tailwindcss -i ./app/globals.css -o ./.ds-compiled-globals.css --config ./tailwind.config.ts
cd ..
node .ds-sync/resync.mjs --config .design-sync-adminfront/config.json \
  --node-modules ./bikribazaar-adminfront/node_modules --out ./ds-bundle-adminfront
```
