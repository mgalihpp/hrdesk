# Section conversion contract (READ FULLY before editing)

You are porting ONE section of the Webflow template `sasdesk.webflow.io` into a
React server component. The entire page's visual styling already lives in
`app/webflow.css` (the complete, exact Webflow template stylesheet) and is applied
through the Webflow **class names**. Your only job: emit React/JSX that renders the
identical markup using those exact class names, so the result matches the reference
pixel-for-pixel.

## Input
Read `reference/sections/<FILE>.html` — the extracted raw HTML for your section
(it is a single minified line). That file is the source of truth for structure,
classes, text, image URLs, and inline SVGs.

## Output
Create `app/components/<NAME>.tsx`:
- `export default function <Name>() { return ( ... ); }`
- Do **NOT** add `"use client"`. This is a static server component.
- Do **NOT** import anything. Do **NOT** add CSS. Do **NOT** modify `webflow.css`.

## Conversion rules (HTML -> JSX)
- `class="..."` -> `className="..."`. KEEP every class exactly, including `w-`
  prefixes and `data-` driven classes. Values must match the source.
- `for=` -> `htmlFor`; `tabindex` -> `tabIndex`; `maxlength` -> `maxLength`;
  `readonly` -> `readOnly`; `autofocus` -> `autoFocus`; `spellcheck` -> `spellCheck`.
- Self-close void elements: `<img ... />`, `<input ... />`, `<br />`, `<hr />`,
  `<source ... />`, `<meta ... />`, `<link ... />`.
- Inline `style="a: b; c: d"` -> `style={{ a: "b", c: "d" }}` (camelCase keys,
  string values, NO trailing semicolons inside the object).
- PRESERVE all attributes: `id`, `data-w-id`, `data-w-tab`, `data-current`,
  `data-collapse`, `data-animation`, `role`, `aria-*`, `href`, `src`, `alt`,
  `width`, `height`, `loading`, `target`, `rel`, `viewBox`, `fill`, `xmlns`,
  `type`, `name`, `placeholder`, `value`, `checked`, `disabled`.
- KEEP inline `<svg>...</svg>` blocks EXACTLY (icons/arrows). Convert only
  `class` -> `className` inside them.
- Images: keep `src` EXACTLY as the CDN URL in the source
  (`https://cdn.prod.website-files.com/...`). DROP `srcset`. Keep
  `loading="lazy"` + `width`/`height`/`alt`. Do NOT use `next/image`. Do NOT
  download assets.
- Keep the outer `<section ...>` with its `class`, `id`, `data-w-id` intact.
- PRESERVE every wrapper `<div>` (do not "simplify"; styling depends on nesting).
- Text: keep verbatim. If a text node contains `<`, `>`, `{`, `}`, or `&`, render
  it as a string literal, e.g. `{"HR & operations"}` or `{"<"}`. Bare `&` in plain
  text is fine as `&` only when not forming an entity; when in doubt wrap in
  `{"..."}`.

## Acceptance
- Component compiles under `next build` (valid JSX/TS, valid React).
- Rendered markup uses the same class names / data attributes as the source HTML.
- No new CSS, no new imports, no `"use client"`.

## Guardrails
- Skip formatters, linters, and project-wide test suites.
- Do not edit any file other than the one component you were assigned.
