## Wrapping and setup

No provider/root wrapper is required — every component is a plain function
component, self-contained. No dark mode is configured (no `.dark` class
toggle) — this admin panel is light-mode only.

## Styling idiom: plain Tailwind utilities, default palette

Unlike the storefront, this admin panel uses Tailwind's **default, unbranded
palette** — `gray`, `black`, `white`, `red`, etc. straight from Tailwind, no
custom color tokens or component classes. Style with ordinary utilities
(`bg-gray-900`, `text-gray-500`, `rounded-lg`, `border`, `shadow-sm`) rather
than inventing brand tokens that don't exist here. Read `styles.css` (which
`@import`s `_ds_bundle.css`) for the exact compiled rule set before adding
anything.

The one plugin in play is `@tailwindcss/typography` — use the `prose` class
(and `prose-sm`, `prose-invert`, etc.) for any block of rendered markdown/rich
text, rather than hand-styling headings/lists/links; `MarkdownContent` and
`MarkdownEditor` already rely on it.

A custom `progress` animation utility exists (`animate-progress` — a
scaleX loading-bar keyframe) for progress-bar/loading-bar UI.

## Where the truth lives

- `styles.css` → `@import`s `_ds_bundle.css`, the real compiled Tailwind
  output for this admin panel.
- Per-component `.prompt.md` files under `components/general/<Name>/`.

## Example

```jsx
import { Sidebar, EmptyState, SubmitButton } from '<pkg>';

<div className="flex min-h-screen bg-white">
  <Sidebar />
  <main className="flex-1 p-6">
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <EmptyState />
      <SubmitButton>Save changes</SubmitButton>
    </div>
  </main>
</div>
```
