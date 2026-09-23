# Custom UI: design tokens and the component inventory

Read the requirements below whenever creating or restyling a TypeScript page or layout section — a
`definePage`/`defineLayoutSection` under `ui/ui_main_c/`. The loop around it (author, `npm run
build`, deploy, verify) is the same as for everything else and stays in `SKILL.md`.

## Required component decisions

Token usage alone is not component correctness. Match the native control's structure, type
scale, spacing, states and interaction. These requirements apply to edits as well as new pages.

Before markup, inspect the project's shared controls and identify each needed Aspen counterpart.
For a new or changed control, inspect a native example in the running instance when available,
including its open/edit state. Then use the corresponding rows in `ui-component-tokens.md`.
Keep a short implementation note of the counterpart and shared helper chosen; no new approval
step or user-facing design document is required.

| Meaning | Required control and token families |
|---|---|
| Record reference, including an account/engagement/product selector | Lookup/typeahead (`--ap-comp-typeahead-*`), preserving record id separately from display text. Search, select, show the selected record, and clear when optional. An ordinary `<select>` or free-text id input is not a lookup. |
| Picklist or fixed choice | Select (`--ap-comp-select-*`), including the opened menu, selected/hover/focus states and keyboard operation. Picklist option text comes from metadata labels; values remain technical names. A styled closed `<select>` does not prove its browser-owned menu matches Aspen. |
| Text / numeric value | `--ap-comp-textinput-*` / `--ap-comp-numberinput-*`, respectively, including labels and error states. Numeric fields retain numeric input semantics. Do not apply select styles to these fields. |
| Record navigation | Link (`--ap-comp-link-*`) plus the verified SDK/instance navigation helper. Preserve instance and tab context; exercise the destination. |
| Table with actions above it | Table/cell tokens plus `--ap-comp-cardheader-*` for a card header. Button padding does not provide the header's outer spacing. |
| Side panel / modal | Match the chosen surface's header, body and footer using its component tokens. Use the user's requested interaction; do not substitute a modal for a requested side panel. |

Reuse or correct one shared implementation for each repeated control in the project. Put
record navigation and field styling there instead of making page-specific copies. A shared
helper is not automatically correct: validate it against the native example before reusing it.
The SDK availability rules below determine whether that implementation imports a supported
platform component or uses local markup. Do not invent imports or reach into platform internals.

## Typography and composition requirements

- Set the subtree's box sizing and public body font family explicitly. Browser controls do not
  reliably inherit the surrounding typography; apply each control's typography to the actual
  input/button/menu text as well as its wrapper. Use component typography tokens with `font`,
  not `font-size`, and check later shorthand or global rules do not reset the family or size.
- Keep label, value, table-cell and heading typography distinct. Do not flatten them with a
  blanket `font: inherit` or one font-size override. Check the computed family, size, weight and
  line height against native controls; a token appearing in source is not evidence it took effect.
- Preserve the component's field height, inner padding and surrounding spacing. In particular,
  a card header uses `--ap-comp-cardheader-padding` on all sides; zeroing its bottom padding makes
  action buttons touch the table. If a compact variant is needed, verify that variant instead
  of inventing smaller type or spacing to make the form fit.
- Follow the native surface's action placement and any explicit user preference. For a table
  card, keep its title and actions in one header, with the action group on the right. Keep help
  text only where it resolves a user decision or constraint; omit implementation explanations
  and repeated descriptions of what a label already says.
- User-requested deviations take precedence. Record deliberate differences narrowly; an
  exemption comment or successful lint run does not establish visual parity.

## Verify the rendered UI

After deploying and reloading, compare the changed UI with native Aspen controls in the same
instance, theme and viewport. Use browser screenshots plus computed-style measurements where
available. Verify the following for the affected controls, not every unrelated page:

- Typography, field heights, label gaps, table cells and action-header outer spacing match.
  Inspect a rendered control, not just its parent container.
- Open picklists and lookup results. Exercise keyboard selection, focus, dismissal, optional
  clearing, and relevant loading/empty/error states. A screenshot of a closed menu is insufficient.
- Follow changed record links and check panel open/close, focus entry and return. Use authorized
  fixtures for write interactions; visual verification does not authorize new customer data.
- Check changed styling in light and dark themes and at a narrow viewport. When a shared helper
  or stylesheet changes, inspect each affected surface type, including pages and record sections.

Report build/token checks, visual comparison and interaction checks separately. If browser
access or a native reference is unavailable, complete what can be checked and name the remaining
gap. Do not report "matches Aspen" based on token lint, a successful deploy, or backend tests.

## What a page gets, and what it doesn't

- `definePage`/`defineLayoutSection` (from `@aspen-crm/sdk`) hand you one bare `element` and take
  back `{ unmount }`. Plain DOM, or a framework root you mount yourself — the SDK's own docstring
  shows `createRoot(element)`. Confirmed from `index.d.ts` of both inspected SDK builds (npm `0.1.0`
  and the platform's `26.2.2`): those two functions, plus `@aspen-crm/sdk/navigation` and
  `@aspen-crm/sdk/request`, are the whole export surface.
- **Those inspected SDK versions expose no component library to import.** The inventory's names
  (`--ap-comp-button-*`, etc.) are token namespaces, not modules. Check the installed SDK's public
  exports once when starting UI work, and again after an SDK upgrade. Prefer supported platform
  components when available. Otherwise use shared local controls that satisfy the requirements
  above; default styling from a third-party library is not Aspen styling. Describe local controls
  accurately as local implementations, not native platform components.
- **Nothing ships the token list except these two files.** The variables exist only inside a
  running instance — not in the SDK, not in `x-cli`, not in `node_modules` — so a local build
  cannot tell a real name from a typo, and neither can the browser: a misspelled `var(--ap-…)` is
  silently unset. Copy names from here, exactly.
- **`--ap-comp-*` names live in `ui-component-tokens.md`** — all 1631 of them, across 77
  components (the 50 named at the end of this file plus their internal parts). Grep that file for
  `--ap-comp-<component>-` rather than reading it — it is 2000 lines. Still copy, never guess: the
  same silent-failure rule applies.
- **Ask first whether Aspen already ships the thing you are building.** If it does — a table, a
  select, a tag, a modal — start from that component's own tokens. If it does not, compose from
  the semantic layer. That order matters more than it sounds: see the next rule.
- **Eleven per-role font-family tokens exist and are internal**: `--ap-sem-font-family-body-bold`,
  `-body-large`, `-body-small`, `-caption`, `-display`, `-footnote`, `-heading-1`, `-heading-2`,
  `-heading-3`, `-heading-4`, `-label`. They resolve — six of them show up in the component file's
  "Resolves to" column — but never reference them. `--ap-sem-font-family-body` is the one public
  family token, and it covers every role.
- **There is no monospace token.** The system publishes one family and it is Geist. A code block
  or an id column takes its own `ui-monospace, SFMono-Regular, Menlo, monospace` stack; that is
  the one font-family hardcode the guard does not flag.
- A customer page that hardcodes `#d7dee2` borders and `system-ui` fonts is the pattern this
  replaces, not one to copy — it renders wrong in dark mode and doesn't tighten on a phone.

The token inventory below is the design system's reference for custom UI and can be re-synced
when the platform team updates it. The requirements above govern how to use it.

---

## How to use these tokens

Aspen exposes its design system to your custom UI as **CSS custom properties** (CSS variables).
You reference them with `var(...)` in your own stylesheets.

```css
.my-card {
    background-color: var(--ap-sem-color-surface-raised);
    color: var(--ap-sem-color-text-primary);
    border: var(--ap-sem-border-width-default) solid var(--ap-sem-color-border-default);
    border-radius: var(--ap-sem-radius-md);
    padding: var(--ap-sem-spacing-inner-md);
    box-shadow: var(--ap-sem-elevation-low);
}

.my-card__title {
    font-size: var(--ap-sem-font-size-heading-3);
    line-height: var(--ap-sem-line-height-heading-3);
    font-weight: var(--ap-sem-font-weight-heading-3);
    font-family: var(--ap-sem-font-family-body);
}
```

Rules that matter:

- **Nothing to install.** The tokens are available at runtime wherever your custom UI renders.
  You do not import or depend on any package to use them.
- **Never hardcode a hex color, size, or shadow.** Use the token. The hex values in this file are
  the light-theme reference only. This is enforced: a hardcode on a property the system publishes
  a token for — color, spacing, radius, border width, the type scale, elevation — is denied by a
  hook when you write it, and by `scripts/lint-ui-tokens.mjs` in CI. What the system publishes no
  token for is **not** covered and needs no ceremony: page dimensions (`width`, `height`,
  `min-width`), grid tracks, `background-size`, positional offsets, and any `calc()` composed off
  a variable. For the rare governed value that still has no right token, keep it and write
  `aspen-token-exempt: <reason>` in a comment on that line or the line above.
- **Light/dark is automatic.** Every color token carries a light and a dark value; the right one
  applies based on the user's theme. Use the token and both themes look correct for free.
- **Spacing and typography are responsive.** Several spacing and type tokens shrink automatically
  at tablet (viewport < 1024px) and phone (< 768px) widths. Use the token instead of a fixed px
  value and your layout tightens up on small screens on its own.
- **Only `var(--ap-*)` reaches your code.** Aspen's own utility classes (for example a Tailwind
  `p-4`) and its component CSS classes are NOT available inside your custom UI. Style your own
  markup with these tokens.
  - Why the tokens get through when the classes do not: custom UI renders in a **shadow root on
    the platform document**, so custom properties inherit from `:root` while the platform's
    stylesheets stay outside the tree. (Only the JavaScript is iframe-isolated.) The platform's
    **resets do not reach you either** — the guest starts at `box-sizing: content-box`, so set
    `box-sizing: border-box` on your own subtree. The platform's custom-UI e2e suite asserts all
    of this on every surface: `definePage` and the record-detail sections, in light and dark, at
    desktop and phone widths.
- **Names are not validated.** A misspelled token name silently does nothing — no error, no
  warning. Copy names exactly, and write the light value as a fallback
  (`var(--ap-sem-color-text-primary, #11171d)`) so a typo degrades to the right color instead of
  to nothing. Fallbacks are encouraged, not a deviation.
- **Rebuilding an Aspen component? Take its tokens. Building something new? Compose from the
  semantic layer.** The semantic tokens are the design vocabulary and cover most of a page, so
  they are the right default for anything Aspen does not already publish — a magnitude bar in a
  cell, a Gantt strip, a chart legend.
  - But a `<table>` in a record section renders inches from Aspen's own list views, and there
    "close enough" reads as a bug, not a style. `--ap-comp-cell-content-padding-x/y`,
    `--ap-comp-cell-border-bottom-color`, `--ap-comp-cell-bg-hover` and the 65
    `--ap-comp-table-*` names already hold those values. Re-deriving them from
    `--ap-sem-spacing-inner-*` and `--ap-sem-color-border-subtle` lands near them and not on
    them, and nothing fails to tell you.
  - This is not the pixel-perfect edge case it was once described as. Whenever you are rebuilding
    something the platform ships, matching it exactly IS the requirement, and the component's
    tokens are the short way there — fewer decisions, not more.
  - A guard denies a stylesheet that styles a `table`, `button`, `select` or `textarea` from the
    semantic layer alone. Mixing is expected and fine: paint the cells from the cell tokens, then
    accent one header with `--ap-sem-color-brand-primary` if that is what the design wants. If
    you are deliberately not building that component — a layout table, a control that has to look
    different — put `aspen-component-exempt: <reason>` in a comment anywhere in the file.

---

## Color (`--ap-sem-color-*`)

Values shown are light theme. The dark value applies automatically in dark mode. Pick a token by
role, not by the color it happens to be.

### Text

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-text-primary` | `#11171d` |
| `--ap-sem-color-text-secondary` | `#3b424a` |
| `--ap-sem-color-text-tertiary` | `#5d646c` |
| `--ap-sem-color-text-placeholder` | `#5d646c` |
| `--ap-sem-color-text-disabled` | `#cbced2` |
| `--ap-sem-color-text-danger` | `#d2291f` |
| `--ap-sem-color-text-inverse` | `#fff` |
| `--ap-sem-color-text-on-brand` | `#fff` |
| `--ap-sem-color-text-on-interactive` | `#fff` |
| `--ap-sem-color-text-primary-on-color` | `#11171d` |
| `--ap-sem-color-text-disabled-on-color` | `#cbced2` |

### Background (the page canvas)

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-background-default` | `#fff` |
| `--ap-sem-color-background-subtle` | `#fcfcfd` |
| `--ap-sem-color-background-raised` | `#fff` |
| `--ap-sem-color-background-brand` | `#fff6f2` |
| `--ap-sem-color-background-inverse` | `#11171d` |
| `--ap-sem-color-background-overlay` | `#11171d` |

### Surface (the ground a card or panel sits on)

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-surface-default` | `#fff` |
| `--ap-sem-color-surface-raised` | `#fff` |
| `--ap-sem-color-surface-secondary` | `#e1e3e6` |
| `--ap-sem-color-surface-hover` | `#eef0f3` |
| `--ap-sem-color-surface-pressed` | `#e1e3e6` |
| `--ap-sem-color-surface-selected` | `#f7fbfe` |
| `--ap-sem-color-surface-disabled` | `#eef0f3` |
| `--ap-sem-color-surface-overlay` | `#fff` |
| `--ap-sem-color-surface-inverse` | `#11171d` |

### Border

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-border-default` | `#cbced2` |
| `--ap-sem-color-border-subtle` | `#e1e3e6` |
| `--ap-sem-color-border-strong` | `#5d646c` |
| `--ap-sem-color-border-disabled` | `#e1e3e6` |
| `--ap-sem-color-border-brand` | `#a34d16` |
| `--ap-sem-color-border-danger` | `#d2291f` |
| `--ap-sem-color-border-focus` | `#fff` |
| `--ap-sem-color-border-inverse` | `#5d646c` |

### Icon

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-icon-primary` | `#11171d` |
| `--ap-sem-color-icon-secondary` | `#3b424a` |
| `--ap-sem-color-icon-tertiary` | `#5d646c` |
| `--ap-sem-color-icon-brand` | `#e3722d` |
| `--ap-sem-color-icon-danger` | `#d2291f` |
| `--ap-sem-color-icon-disabled` | `#cbced2` |
| `--ap-sem-color-icon-inverse` | `#fff` |
| `--ap-sem-color-icon-on-brand` | `#fff` |
| `--ap-sem-color-icon-on-interactive` | `#fff` |

### Brand

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-brand-primary` | `#e3722d` |
| `--ap-sem-color-brand-primary-hover` | `#864015` |
| `--ap-sem-color-brand-primary-pressed` | `#6c3515` |
| `--ap-sem-color-brand-subtle` | `#fff6f2` |

### Interactive (buttons, controls, and their states)

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-interactive-default` | `#48687d` |
| `--ap-sem-color-interactive-hover` | `#466071` |
| `--ap-sem-color-interactive-pressed` | `#445967` |
| `--ap-sem-color-interactive-focus` | `#48687d` |
| `--ap-sem-color-interactive-disabled` | `#e1e3e6` |
| `--ap-sem-color-interactive-secondary` | `#dfecf4` |
| `--ap-sem-color-interactive-subtle` | `#f7fbfe` |
| `--ap-sem-color-interactive-danger` | `#d2291f` |
| `--ap-sem-color-interactive-danger-hover` | `#ac1c0f` |
| `--ap-sem-color-interactive-danger-pressed` | `#84180e` |
| `--ap-sem-color-interactive-external` | `#f6ecd7` |
| `--ap-sem-color-interactive-external-hover` | `#9f7a26` |

### Link

| Token | Light |
| :-- | :-- |
| `--ap-sem-color-link-default` | `#4371c8` |
| `--ap-sem-color-link-hover` | `#284482` |
| `--ap-sem-color-link-disabled` | `#cbced2` |

### Feedback (status messages and states)

Each state has a main color, a `-subtle` background, and a `-text` color for text on the subtle
background.

| State | Main | Subtle background | Text |
| :-- | :-- | :-- | :-- |
| Error | `--ap-sem-color-feedback-error` `#d2291f` | `--ap-sem-color-feedback-error-subtle` `#fff9f8` | `--ap-sem-color-feedback-error-text` `#d2291f` |
| Info | `--ap-sem-color-feedback-info` `#4371c8` | `--ap-sem-color-feedback-info-subtle` `#f8fbfd` | `--ap-sem-color-feedback-info-text` `#4371c8` |
| Success | `--ap-sem-color-feedback-success` `#197037` | `--ap-sem-color-feedback-success-subtle` `#f6fbf8` | `--ap-sem-color-feedback-success-text` `#197037` |
| Warning | `--ap-sem-color-feedback-warning` `#826420` | `--ap-sem-color-feedback-warning-subtle` `#fffcf7` | `--ap-sem-color-feedback-warning-text` `#826420` |

Naming note: `danger` (in text/border/icon/interactive) is intent — a destructive action a user is
about to take. `error` (in feedback) is outcome — something that already went wrong.

---

## Typography (`--ap-sem-font-*`)

Each text role has a matching size, line-height, and weight token. Set all three together. The
sizes below are desktop; display and headings shrink automatically on phones (< 768px).

| Role | `font-size` token | `line-height` token | `font-weight` token | Desktop size / line / weight |
| :-- | :-- | :-- | :-- | :-- |
| Display | `--ap-sem-font-size-display` | `--ap-sem-line-height-display` | `--ap-sem-font-weight-display` | 64 / 72 / 700 |
| Heading 1 | `--ap-sem-font-size-heading-1` | `--ap-sem-line-height-heading-1` | `--ap-sem-font-weight-heading-1` | 32 / 40 / 600 |
| Heading 2 | `--ap-sem-font-size-heading-2` | `--ap-sem-line-height-heading-2` | `--ap-sem-font-weight-heading-2` | 28 / 36 / 600 |
| Heading 3 | `--ap-sem-font-size-heading-3` | `--ap-sem-line-height-heading-3` | `--ap-sem-font-weight-heading-3` | 24 / 32 / 600 |
| Heading 4 | `--ap-sem-font-size-heading-4` | `--ap-sem-line-height-heading-4` | `--ap-sem-font-weight-heading-4` | 20 / 28 / 600 |
| Body large | `--ap-sem-font-size-body-large` | `--ap-sem-line-height-body-large` | `--ap-sem-font-weight-body-large` | 18 / 26 / 400 |
| Body | `--ap-sem-font-size-body` | `--ap-sem-line-height-body` | `--ap-sem-font-weight-body` | 16 / 24 / 400 |
| Body bold | `--ap-sem-font-size-body-bold` | `--ap-sem-line-height-body-bold` | `--ap-sem-font-weight-body-bold` | 16 / 24 / 500 |
| Body small | `--ap-sem-font-size-body-small` | `--ap-sem-line-height-body-small` | `--ap-sem-font-weight-body-small` | 14 / 22 / 400 |
| Label | `--ap-sem-font-size-label` | `--ap-sem-line-height-label` | `--ap-sem-font-weight-label` | 14 / 22 / 500 |
| Caption | `--ap-sem-font-size-caption` | `--ap-sem-line-height-caption` | `--ap-sem-font-weight-caption` | 12 / 16 / 400 |
| Footnote | `--ap-sem-font-size-footnote` | `--ap-sem-line-height-footnote` | `--ap-sem-font-weight-footnote` | 11 / 15 / 500 |

Font family: `--ap-sem-font-family-body` = `Geist, 'Helvetica Neue', Arial, sans-serif`. One family
covers every role; use this token for `font-family`.

---

## Spacing (`--ap-sem-spacing-*`)

Use `inner-*` for padding and gaps inside a component, `layout-*` for gaps between larger blocks.
Desktop values shown; these tighten automatically on tablet (< 1024px) and phone (< 768px).

| Token | Desktop |
| :-- | :-- |
| `--ap-sem-spacing-inner-2xs` | 4px |
| `--ap-sem-spacing-inner-xs` | 8px |
| `--ap-sem-spacing-inner-sm` | 12px |
| `--ap-sem-spacing-inner-md` | 16px |
| `--ap-sem-spacing-inner-lg` | 20px |
| `--ap-sem-spacing-inner-xl` | 24px |
| `--ap-sem-spacing-layout-2xs` | 16px |
| `--ap-sem-spacing-layout-xs` | 24px |
| `--ap-sem-spacing-layout-sm` | 32px |
| `--ap-sem-spacing-layout-md` | 40px |
| `--ap-sem-spacing-layout-lg` | 64px |
| `--ap-sem-spacing-layout-xl` | 80px |
| `--ap-sem-spacing-gutter` | 24px |
| `--ap-sem-spacing-page-margin-horizontal` | 24px |
| `--ap-sem-spacing-page-margin-vertical` | 32px |

---

## Radius (`--ap-sem-radius-*`)

| Token | Value |
| :-- | :-- |
| `--ap-sem-radius-none` | 0px |
| `--ap-sem-radius-xs` | 2px |
| `--ap-sem-radius-sm` | 4px |
| `--ap-sem-radius-md` | 8px |
| `--ap-sem-radius-lg` | 12px |
| `--ap-sem-radius-xl` | 16px |
| `--ap-sem-radius-full` | 999px |

---

## Border width (`--ap-sem-border-width-*`)

| Token | Value |
| :-- | :-- |
| `--ap-sem-border-width-default` | 1px |
| `--ap-sem-border-width-emphasis` | 2px |

---

## Icon size (`--ap-sem-icon-size-*`)

| Token | Value |
| :-- | :-- |
| `--ap-sem-icon-size-sm` | 16px |
| `--ap-sem-icon-size-md` | 24px |
| `--ap-sem-icon-size-lg` | 32px |

---

## Elevation / shadow (`--ap-sem-elevation-*`)

Use for `box-shadow`. Shadows are stronger in dark mode automatically.

| Token | Use |
| :-- | :-- |
| `--ap-sem-elevation-low` | Resting cards, subtle lift |
| `--ap-sem-elevation-medium` | Raised surfaces, dropdowns |
| `--ap-sem-elevation-high` | Popovers, menus |
| `--ap-sem-elevation-overlay` | Modals and large overlays |
| `--ap-sem-elevation-focus` | Focus ring; apply on `:focus-visible` |

---

## Component tokens (`--ap-comp-*`)

Every Aspen component publishes its own tokens, each aliasing a semantic token above. **These are
not the advanced case — they are the right starting point whenever you are rebuilding a component
Aspen already ships** (for example `--ap-comp-button-radius`,
`--ap-comp-button-primary-bg-default`). The alias means you gain the match for free and lose
nothing: a component token follows the same theme and the same responsive steps as the semantic
token behind it.

Compose from the semantic tokens for what has no Aspen counterpart. That is most of a page, which
is why the semantic layer is still the bulk of any stylesheet — but it is a different question
from "how should my table look".

Pattern: `--ap-comp-<component>-<property>[-<variant>][-<state>]`.

Components with published tokens: accordion, avatar, badge, banner, breadcrumb, button, calendar,
card, cell, checkbox, checkboxgroup, contactpill, cursorpagination, dateinput, datepicker,
daterange, datetimepicker, document, fileupload, icon, link, listitem, menu, metadata, modal,
multiselect, navbar, numberinput, overflowmenu, pagination, passwordinput, phoneinput, radio,
radiogroup, search, segmentedbuttons, select, sidenav, sidepanel, stepper, switch, table, tabs,
tag, textarea, textinput, timeline, timepicker, tooltip, typeahead.
