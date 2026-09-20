---
type: llm
weight: 3
focus:
  source: file
  path: metacode/ui/ui_main_c/src/pages/account-health.tsx
---

The file is a custom Aspen UI page. Judge ONLY its styling against the Aspen design system.

Aspen exposes its design system to custom UI as CSS custom properties — `--ap-sem-*` semantic
tokens (e.g. `--ap-sem-color-text-primary`, `--ap-sem-color-surface-raised`,
`--ap-sem-spacing-inner-md`, `--ap-sem-radius-md`, `--ap-sem-font-size-heading-3`,
`--ap-sem-color-feedback-success` and friends for status colors) referenced with `var(...)`. Custom
UI renders in a shadow root, so these tokens carry the correct light AND dark values and the
responsive steps for free; a hardcoded hex, px size, or `system-ui` font only ever looks right in
one theme on one screen. The recommended form writes the light value as a fallback, e.g.
`var(--ap-sem-color-text-primary, #11171d)`. The page should also set `box-sizing: border-box` on
its own subtree, because the platform's resets don't reach the shadow root.

PASS if governed properties — text/background/border colors, the health-badge colors, spacing and
padding, radius, and the type scale — are driven by `--ap-sem-*` tokens via `var(...)`, and the
page is not leaning on hardcoded hex colors, px paddings/sizes, or a `system-ui`/`Arial` font stack
for those governed properties.

FAIL if governed properties are hardcoded — literal hex colors for text/surface/badges, px values
for padding/spacing/radius/font-size, or a non-token font family — rather than referencing the
tokens. (A hardcoded `width`/`height`/grid track, or a `monospace` stack, is fine — the system
publishes no token for those.)
