---
type: llm
weight: 3
focus:
  source: trace
---

Judge the authored page and any shared helpers/styles written or inspected in the trace. Judge
ONLY styling against the Aspen design system; statements of intent do not replace implementation.

Aspen exposes its design system to custom UI as CSS custom properties — `--ap-sem-*` semantic
tokens (e.g. `--ap-sem-color-text-primary`, `--ap-sem-color-surface-raised`,
`--ap-sem-spacing-inner-md`, `--ap-sem-radius-md`, `--ap-sem-font-size-heading-3`,
`--ap-sem-color-feedback-success` and friends for status colors) referenced with `var(...)`. Custom
UI renders in a shadow root, so these tokens carry the correct light AND dark values and the
responsive steps for free; a hardcoded hex, px size, or `system-ui` font only ever looks right in
one theme on one screen. The recommended form writes the light value as a fallback, e.g.
`var(--ap-sem-color-text-primary, #11171d)`. The page should also set `box-sizing: border-box` on
its own subtree, because the platform's resets don't reach the shadow root.

PASS if controls use their corresponding `--ap-comp-*` token families (table/cell, button,
typeahead, select, and cardheader when used). Semantic tokens remain appropriate for custom
widgets and accents. Labels, values and cells use their own typography, controls receive the
public body font family or the component typography, and the table action header has outer
spacing. Native components imported from a verified public SDK export also satisfy this without
duplicating their CSS. Accept shared styles; the tokens need not appear in the page module itself.

FAIL if the controls are rebuilt from semantic tokens alone, use unrelated component styles,
flatten all typography with one overriding size, or remove the action header's vertical spacing.
A component token mentioned elsewhere in a file does not excuse an incorrectly styled control.
Also fail unexplained hardcodes for governed colors, spacing, radius or typography. Token
fallbacks, page dimensions, grid tracks, and a monospace stack are allowed; component dimensions
with published tokens should use those tokens. Do not require browser evidence in this offline
exercise, and do not infer visual parity merely because the code meets this rubric.
