# Aspen Component Tokens (`--ap-comp-*`)

The complete set of Aspen component tokens. Companion to `ui-design-tokens.md` — read that first;
it carries the rules. This file is 2000 lines: grep it for `--ap-comp-<component>-`, never read it
whole.

Use these only when recreating a specific Aspen component and needing an exact match.
For general styling, compose from the semantic (`--ap-sem-*`) tokens instead.

Reference any of these in your own CSS with `var(--ap-comp-...)`. The **Resolves to**
column shows the semantic token or literal each one currently aliases; use the
`--ap-comp-*` name, not the value it points at.

Total: 1631 tokens across 77 components.

## Components

[accordion](#accordion)  [avatar](#avatar)  [badge](#badge)  [banner](#banner)  [baseclose](#baseclose)  [basenomenu](#basenomenu)  [basewithmenu](#basewithmenu)  [breadcrumb](#breadcrumb)  [button](#button)  [calendar](#calendar)  [card](#card)  [cardfooter](#cardfooter)  [cardheader](#cardheader)  [cell](#cell)  [checkbox](#checkbox)  [checkboxgroup](#checkboxgroup)  [contactpill](#contactpill)  [contacttypeahead](#contacttypeahead)  [cursorpagination](#cursorpagination)  [cursorpaginationbase](#cursorpaginationbase)  [datecell](#datecell)  [dateinput](#dateinput)  [datemenu](#datemenu)  [datepicker](#datepicker)  [daterange](#daterange)  [datetimepicker](#datetimepicker)  [document](#document)  [fileupload](#fileupload)  [filtermini](#filtermini)  [followbar](#followbar)  [followminicard](#followminicard)  [groupbase](#groupbase)  [icon](#icon)  [link](#link)  [listitem](#listitem)  [menu](#menu)  [menubase](#menubase)  [metadata](#metadata)  [metadatagroup](#metadatagroup)  [modal](#modal)  [modalfooter](#modalfooter)  [modalheader](#modalheader)  [multiselect](#multiselect)  [navbar](#navbar)  [numberinput](#numberinput)  [overflowmenu](#overflowmenu)  [pagination](#pagination)  [passwordinput](#passwordinput)  [phoneinput](#phoneinput)  [radio](#radio)  [radiobase](#radiobase)  [radiogroup](#radiogroup)  [relbar](#relbar)  [relminicard](#relminicard)  [search](#search)  [segmentbase](#segmentbase)  [segmentedbuttons](#segmentedbuttons)  [select](#select)  [sidenav](#sidenav)  [sidenavitem](#sidenavitem)  [sidepanel](#sidepanel)  [sidepanelfooter](#sidepanelfooter)  [stepper](#stepper)  [switch](#switch)  [table](#table)  [tabs](#tabs)  [tag](#tag)  [textarea](#textarea)  [textinput](#textinput)  [timeline](#timeline)  [timelinearrow](#timelinearrow)  [timelinebase](#timelinebase)  [timelinelabel](#timelinelabel)  [timepicker](#timepicker)  [tooltip](#tooltip)  [typeahead](#typeahead)  [typeaheadmulti](#typeaheadmulti)

---

### accordion

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-accordion-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-accordion-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-accordion-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-accordion-padding-removepadding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-accordion-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-accordion-icon-size` | `24px` |
| `--ap-comp-accordion-label-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-accordion-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-accordion-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-accordion-description-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-accordion-description-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-accordion-description-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-accordion-body-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-accordion-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-accordion-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-accordion-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-accordion-bg-default-collapsed` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-accordion-border-color-default-collapsed` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-accordion-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-accordion-border-color-hover` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-accordion-bg-default-expanded` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-accordion-border-color-default-expanded` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-accordion-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-accordion-bg-focus-expanded` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-accordion-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-accordion-border-color-disabled` | `var(--ap-sem-color-border-subtle)` |

### avatar

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-avatar-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-avatar-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-avatar-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-avatar-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-avatar-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-avatar-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-avatar-icon-size` | `24px` |
| `--ap-comp-avatar-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-avatar-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-avatar-menu-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-avatar-menu-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-avatar-menu-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-avatar-menu-header-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-avatar-menu-name-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-avatar-menu-name-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-avatar-menu-sublabel-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-avatar-menu-sublabel-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-avatar-menu-option-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-avatar-menu-option-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-avatar-menu-option-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-avatar-menu-logout-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-avatar-menu-logout-icon-size` | `24px` |
| `--ap-comp-avatar-menu-logout-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-avatar-menu-logout-color` | `var(--ap-sem-color-text-primary)` |

### badge

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-badge-default-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-badge-default-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-badge-default-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-badge-default-text-color` | `var(--ap-sem-color-text-inverse)` |
| `--ap-comp-badge-default-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-badge-default-bg-info` | `var(--ap-sem-color-feedback-info)` |
| `--ap-comp-badge-default-bg-danger` | `var(--ap-sem-color-feedback-error)` |
| `--ap-comp-badge-default-bg-success` | `var(--ap-sem-color-feedback-success)` |
| `--ap-comp-badge-default-bg-warning` | `var(--ap-sem-color-feedback-warning)` |
| `--ap-comp-badge-dot-size` | `8px` |
| `--ap-comp-badge-dot-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-badge-dot-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-badge-dot-bg-info` | `var(--ap-sem-color-feedback-info)` |
| `--ap-comp-badge-dot-bg-danger` | `var(--ap-sem-color-feedback-error)` |
| `--ap-comp-badge-dot-bg-success` | `var(--ap-sem-color-feedback-success)` |
| `--ap-comp-badge-dot-bg-warning` | `var(--ap-sem-color-feedback-warning)` |

### banner

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-banner-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-banner-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-banner-border-width` | `1px` |
| `--ap-comp-banner-icon-text-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-banner-title-body-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-banner-icon-size` | `24px` |
| `--ap-comp-banner-typography-title` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-banner-typography-body` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-banner-warning-bg` | `var(--ap-sem-color-feedback-warning-subtle)` |
| `--ap-comp-banner-warning-border` | `var(--ap-sem-color-feedback-warning)` |
| `--ap-comp-banner-warning-icon-color` | `var(--ap-sem-color-feedback-warning)` |
| `--ap-comp-banner-warning-title-color` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-banner-warning-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-banner-info-bg` | `var(--ap-sem-color-feedback-info-subtle)` |
| `--ap-comp-banner-info-border` | `var(--ap-sem-color-feedback-info)` |
| `--ap-comp-banner-info-icon-color` | `var(--ap-sem-color-feedback-info)` |
| `--ap-comp-banner-info-title-color` | `var(--ap-sem-color-feedback-info-text)` |
| `--ap-comp-banner-info-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-banner-success-bg` | `var(--ap-sem-color-feedback-success-subtle)` |
| `--ap-comp-banner-success-border` | `var(--ap-sem-color-feedback-success)` |
| `--ap-comp-banner-success-icon-color` | `var(--ap-sem-color-feedback-success)` |
| `--ap-comp-banner-success-title-color` | `var(--ap-sem-color-feedback-success-text)` |
| `--ap-comp-banner-success-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-banner-error-bg` | `var(--ap-sem-color-feedback-error-subtle)` |
| `--ap-comp-banner-error-border` | `var(--ap-sem-color-feedback-error)` |
| `--ap-comp-banner-error-icon-color` | `var(--ap-sem-color-feedback-error)` |
| `--ap-comp-banner-error-title-color` | `var(--ap-sem-color-feedback-error-text)` |
| `--ap-comp-banner-error-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-banner-highlight-bg` | `var(--ap-sem-color-interactive-subtle)` |
| `--ap-comp-banner-highlight-border` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-banner-highlight-icon-color` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-banner-highlight-title-color` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-banner-highlight-body-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-banner-close-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-banner-buttons-gap` | `var(--ap-sem-spacing-inner-md)` |

### baseclose

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-baseclose-radius-left` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-baseclose-radius-right` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-baseclose-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-baseclose-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-baseclose-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-baseclose-right-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-baseclose-iconbtn-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-baseclose-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-baseclose-icon-size` | `24px` |
| `--ap-comp-baseclose-internal-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-baseclose-internal-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-baseclose-external-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-baseclose-external-text` | `var(--ap-sem-color-feedback-warning-text)` |

### basenomenu

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-basenomenu-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-basenomenu-internal-default-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basenomenu-internal-default-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basenomenu-internal-hover-bg` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-basenomenu-internal-hover-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-basenomenu-internal-focus-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basenomenu-internal-focus-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basenomenu-external-default-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basenomenu-external-default-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basenomenu-external-hover-bg` | `var(--ap-sem-color-interactive-external-hover)` |
| `--ap-comp-basenomenu-external-hover-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-basenomenu-external-focus-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basenomenu-external-focus-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basenomenu-disabled-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-basenomenu-disabled-text` | `var(--ap-sem-color-text-disabled)` |

### basewithmenu

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-basewithmenu-radius-button` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-basewithmenu-radius-menu` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-basewithmenu-chevron-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-basewithmenu-internal-default-button-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-default-button-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basewithmenu-internal-default-menu-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-buttonhover-button-bg` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-basewithmenu-internal-buttonhover-button-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-basewithmenu-internal-buttonhover-menu-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-buttonfocus-button-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-buttonfocus-button-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basewithmenu-internal-buttonfocus-menu-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-menuhover-button-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-menuhover-button-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basewithmenu-internal-menuhover-menu-bg` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-basewithmenu-internal-menufocus-button-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-menufocus-menu-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-menuactive-button-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-basewithmenu-internal-menuactive-button-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-basewithmenu-internal-menuactive-menu-bg` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-basewithmenu-internal-disabled-button-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-basewithmenu-internal-disabled-button-text` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-basewithmenu-internal-disabled-menu-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-basewithmenu-external-default-button-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-default-button-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basewithmenu-external-default-menu-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-buttonhover-button-bg` | `var(--ap-sem-color-interactive-external-hover)` |
| `--ap-comp-basewithmenu-external-buttonhover-button-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-basewithmenu-external-buttonhover-menu-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-buttonfocus-button-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-buttonfocus-button-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basewithmenu-external-buttonfocus-menu-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-menuhover-button-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-menuhover-button-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basewithmenu-external-menuhover-menu-bg` | `var(--ap-sem-color-interactive-external-hover)` |
| `--ap-comp-basewithmenu-external-menufocus-button-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-menufocus-menu-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-menuactive-button-bg` | `var(--ap-sem-color-interactive-external)` |
| `--ap-comp-basewithmenu-external-menuactive-button-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-basewithmenu-external-menuactive-menu-bg` | `var(--ap-sem-color-feedback-warning-subtle)` |
| `--ap-comp-basewithmenu-external-disabled-button-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-basewithmenu-external-disabled-button-text` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-basewithmenu-external-disabled-menu-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-basewithmenu-tooltip-bg` | `var(--ap-sem-color-surface-inverse)` |
| `--ap-comp-basewithmenu-tooltip-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-basewithmenu-tooltip-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-basewithmenu-tooltip-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-basewithmenu-tooltip-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-basewithmenu-tooltip-color` | `var(--ap-sem-color-text-inverse)` |
| `--ap-comp-basewithmenu-menuactive-container-gap` | `var(--ap-sem-spacing-inner-2xs)` |

### breadcrumb

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-breadcrumb-item-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-breadcrumb-item-text-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-breadcrumb-item-text-color-hover` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-breadcrumb-item-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-breadcrumb-item-radius-hover` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-item-text-color-focus` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-breadcrumb-item-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-breadcrumb-item-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-breadcrumb-item-radius-focus` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-item-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-breadcrumb-item-active-text-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-breadcrumb-item-active-text-color-hover` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-breadcrumb-item-active-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-breadcrumb-item-active-radius-hover` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-item-active-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-breadcrumb-item-truncated-text-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-breadcrumb-item-truncated-text-color-hover` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-breadcrumb-item-truncated-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-breadcrumb-item-truncated-radius-hover` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-item-truncated-text-color-focus` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-breadcrumb-item-truncated-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-breadcrumb-item-truncated-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-breadcrumb-item-truncated-radius-focus` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-item-truncated-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-breadcrumb-item-truncated-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-breadcrumb-item-truncated-active-text-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-breadcrumb-item-truncated-active-bg-default` | `var(--ap-sem-color-surface-pressed)` |
| `--ap-comp-breadcrumb-item-truncated-active-radius-default` | `var(--ap-sem-radius-md)` |
| `--ap-comp-breadcrumb-menu-elevation` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-breadcrumb-separator-text-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-breadcrumb-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |

### button

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-button-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-button-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-button-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-button-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-button-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-button-icon-size` | `24px` |
| `--ap-comp-button-min-width` | `100px` |
| `--ap-comp-button-icon-color-primary` | `var(--ap-sem-color-icon-on-interactive)` |
| `--ap-comp-button-icon-color-primary-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-button-icon-color-secondary-flat` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-icon-color-secondary-flat-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-button-icon-color-secondary-flat-danger-default` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-icon-color-secondary-flat-danger-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-button-primary-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-primary-text-default` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-bg-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-button-primary-text-hover` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-bg-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-primary-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-primary-text-focus` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-button-primary-text-disabled` | `var(--ap-sem-color-text-disabled-on-color)` |
| `--ap-comp-button-primary-danger-bg-default` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-primary-danger-text-default` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-danger-bg-hover` | `var(--ap-sem-color-interactive-danger-hover)` |
| `--ap-comp-button-primary-danger-text-hover` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-danger-bg-focus` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-primary-danger-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-primary-danger-text-focus` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-button-primary-danger-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-button-primary-danger-text-disabled` | `var(--ap-sem-color-text-disabled-on-color)` |
| `--ap-comp-button-secondary-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-button-secondary-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-text-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-secondary-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-button-secondary-border-color-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-button-secondary-border-width-hover` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-text-hover` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-secondary-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-secondary-text-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-secondary-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-button-secondary-border-width-disabled` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-text-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-button-secondary-danger-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-danger-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-button-secondary-danger-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-danger-text-default` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-secondary-danger-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-button-secondary-danger-border-color-hover` | `var(--ap-sem-color-interactive-danger-hover)` |
| `--ap-comp-button-secondary-danger-border-width-hover` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-danger-text-hover` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-secondary-danger-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-danger-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-secondary-danger-text-focus` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-secondary-danger-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-secondary-danger-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-button-secondary-danger-border-width-disabled` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-button-secondary-danger-text-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-button-flat-padding-x` | `0px` |
| `--ap-comp-button-flat-bg-default` | `transparent` |
| `--ap-comp-button-flat-text-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-flat-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-button-flat-text-hover` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-flat-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-flat-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-flat-text-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-button-flat-bg-disabled` | `transparent` |
| `--ap-comp-button-flat-text-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-button-flat-danger-bg-default` | `transparent` |
| `--ap-comp-button-flat-danger-text-default` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-flat-danger-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-button-flat-danger-text-hover` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-flat-danger-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-button-flat-danger-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-button-flat-danger-text-focus` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-button-flat-danger-bg-disabled` | `transparent` |
| `--ap-comp-button-flat-danger-text-disabled` | `var(--ap-sem-color-text-disabled)` |

### calendar

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-calendar-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-calendar-header-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-calendar-header-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-calendar-navicon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-calendar-monthlabel-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-calendar-monthlabel-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-calendar-grid-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-calendar-weekday-size` | `40px` |
| `--ap-comp-calendar-weekday-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-calendar-weekday-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-calendar-weekday-color` | `var(--ap-sem-color-text-secondary)` |

### card

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-card-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-card-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-card-radius` | `var(--ap-sem-radius-md)` |

### cardfooter

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-cardfooter-buttons-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cardfooter-buttons-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-cardfooter-buttons-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-cardfooter-buttons-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cardfooter-buttons-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-cardfooter-more-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cardfooter-more-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-cardfooter-more-no-border` | `none` |

### cardheader

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-cardheader-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cardheader-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-cardheader-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-cardheader-border-width-bottom` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-cardheader-border-color-bottom` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-cardheader-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-cardheader-left-gap` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-cardheader-titledesc-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-cardheader-chevron-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-cardheader-chevron-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-cardheader-chevron-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-cardheader-title-typography` | `var(--ap-sem-font-weight-heading-2) var(--ap-sem-font-size-heading-2)/var(--ap-sem-line-height-heading-2) var(--ap-sem-font-family-heading-2)` |
| `--ap-comp-cardheader-title-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-cardheader-title-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-cardheader-description-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-cardheader-description-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-cardheader-description-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-cardheader-right-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cardheader-caption-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-cardheader-caption-color` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-cardheader-caption-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### cell

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-cell-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-cell-content-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cell-content-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-cell-action-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-cell-action-width` | `64px` |
| `--ap-comp-cell-border-bottom-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-cell-border-bottom-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-cell-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-cell-text-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-cell-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-cell-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-cell-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-cell-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-cell-inlineedit-border-width` | `var(--ap-sem-border-width-emphasis)` |
| `--ap-comp-cell-inlineedit-border-color` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-cell-action-icon-size` | `24px` |
| `--ap-comp-cell-action-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### checkbox

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-checkbox-box-size` | `16px` |
| `--ap-comp-checkbox-box-hit-padding` | `4px` |
| `--ap-comp-checkbox-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-checkbox-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-checkbox-glyph-size` | `12px` |
| `--ap-comp-checkbox-unselected-border-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-checkbox-unselected-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-checkbox-unselected-border-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-checkbox-unselected-bg-hover` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-checkbox-unselected-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-checkbox-unselected-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-checkbox-unselected-border-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-checkbox-unselected-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-checkbox-unselected-border-error` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-checkbox-unselected-border-error-hover` | `var(--ap-sem-color-interactive-danger-hover)` |
| `--ap-comp-checkbox-selected-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-checkbox-selected-bg-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-checkbox-selected-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-checkbox-selected-bg-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-checkbox-selected-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-checkbox-selected-bg-error` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-checkbox-selected-bg-error-hover` | `var(--ap-sem-color-interactive-danger-hover)` |
| `--ap-comp-checkbox-selected-bg-error-focus` | `var(--ap-sem-color-interactive-danger)` |
| `--ap-comp-checkbox-glyph-color-default` | `var(--ap-sem-color-icon-on-interactive)` |
| `--ap-comp-checkbox-glyph-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-checkbox-label-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-checkbox-label-caption-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-checkbox-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-checkbox-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-checkbox-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-checkbox-caption-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-checkbox-caption-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-checkbox-description-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-checkbox-description-color` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-checkbox-error-message-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-checkbox-error-message-color` | `var(--ap-sem-color-text-danger)` |

### checkboxgroup

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-checkboxgroup-gap-label-to-list` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-checkboxgroup-gap-items` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-checkboxgroup-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-checkboxgroup-label-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-checkboxgroup-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-checkboxgroup-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### contactpill

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-contactpill-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-contactpill-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-contactpill-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-contactpill-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-contactpill-focus-shadow` | `var(--ap-sem-elevation-focus)` |

### contacttypeahead

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-contacttypeahead-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-contacttypeahead-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-contacttypeahead-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-contacttypeahead-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-contacttypeahead-focus-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-contacttypeahead-focus-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-contacttypeahead-focus-shadow` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-contacttypeahead-typing-row-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-contacttypeahead-typing-row-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-contacttypeahead-typing-row-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-contacttypeahead-cursor-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-contacttypeahead-cursor-color` | `var(--ap-sem-color-text-primary)` |

### cursorpagination

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-cursorpagination-width` | `860px` |
| `--ap-comp-cursorpagination-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-cursorpagination-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-cursorpagination-summary-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-cursorpagination-summary-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-cursorpagination-buttons-gap` | `var(--ap-sem-spacing-inner-2xs)` |

### cursorpaginationbase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-cursorpaginationbase-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-cursorpaginationbase-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-cursorpaginationbase-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-cursorpaginationbase-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-cursorpaginationbase-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-cursorpaginationbase-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-cursorpaginationbase-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-cursorpaginationbase-border-color-default` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-cursorpaginationbase-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-cursorpaginationbase-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-cursorpaginationbase-icon-size` | `24px` |
| `--ap-comp-cursorpaginationbase-icon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-cursorpaginationbase-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### datecell

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-datecell-size` | `40px` |
| `--ap-comp-datecell-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datecell-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datecell-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-datecell-default-bg` | `transparent` |
| `--ap-comp-datecell-default-text` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datecell-hover-bg` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-datecell-hover-text` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datecell-focus-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datecell-focus-text` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datecell-focus-shadow` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-datecell-disabled-text` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datecell-selected-default-bg` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-datecell-selected-default-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-datecell-selected-hover-bg` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-datecell-selected-hover-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-datecell-selected-focus-bg` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-datecell-selected-focus-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-datecell-selected-disabled-bg` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-datecell-selected-disabled-text` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datecell-range-default-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-datecell-range-default-text` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datecell-range-hover-bg` | `var(--ap-sem-color-interactive-subtle)` |
| `--ap-comp-datecell-range-hover-text` | `var(--ap-sem-color-text-primary)` |

### dateinput

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-dateinput-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-dateinput-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-dateinput-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-dateinput-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-dateinput-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-dateinput-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-dateinput-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-dateinput-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-dateinput-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-dateinput-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-dateinput-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-dateinput-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-dateinput-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-dateinput-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-dateinput-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-dateinput-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-dateinput-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-dateinput-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-dateinput-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-dateinput-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-dateinput-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-dateinput-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### datemenu

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-datemenu-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-datemenu-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-datemenu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datemenu-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datemenu-shadow` | `var(--ap-sem-elevation-low)` |

### datepicker

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-datepicker-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-datepicker-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-datepicker-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datepicker-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datepicker-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-datepicker-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datepicker-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datepicker-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-datepicker-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datepicker-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-datepicker-field-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datepicker-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-datepicker-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-datepicker-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-datepicker-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-datepicker-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-datepicker-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-datepicker-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-datepicker-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datepicker-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-datepicker-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datepicker-calicon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-datepicker-calicon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-datepicker-calicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-datepicker-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-datepicker-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-datepicker-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datepicker-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-datepicker-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### daterange

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-daterange-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-daterange-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-daterange-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-daterange-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-daterange-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-daterange-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-daterange-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-daterange-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-daterange-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-daterange-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-daterange-field-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-daterange-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-daterange-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-daterange-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-daterange-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-daterange-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-daterange-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-daterange-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-daterange-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-daterange-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-daterange-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-daterange-calicon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-daterange-calicon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-daterange-calicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-daterange-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-daterange-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-daterange-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-daterange-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-daterange-errormsg-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-daterange-cell-endpoint-bg` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-daterange-cell-endpoint-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-daterange-cell-inrange-bg` | `var(--ap-sem-color-interactive-secondary)` |
| `--ap-comp-daterange-cell-inrange-text` | `var(--ap-sem-color-text-primary)` |

### datetimepicker

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-datetimepicker-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-datetimepicker-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-datetimepicker-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datetimepicker-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datetimepicker-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-datetimepicker-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datetimepicker-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datetimepicker-field-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-datetimepicker-field-border-color-readonly` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-datetimepicker-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datetimepicker-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-datetimepicker-field-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datetimepicker-field-bg-readonly` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-datetimepicker-field-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datetimepicker-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-datetimepicker-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-datetimepicker-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-datetimepicker-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-datetimepicker-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-datetimepicker-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-datetimepicker-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datetimepicker-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-datetimepicker-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datetimepicker-calicon-size` | `24px` |
| `--ap-comp-datetimepicker-calicon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-datetimepicker-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-datetimepicker-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-datetimepicker-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-datetimepicker-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-datetimepicker-errormsg-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-datetimepicker-menu-offset-top` | `76px` |
| `--ap-comp-datetimepicker-menu-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-datetimepicker-menu-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-datetimepicker-menu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datetimepicker-menu-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-datetimepicker-menu-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-datetimepicker-calendar-header-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datetimepicker-calendar-header-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datetimepicker-calendar-navicon-size` | `24px` |
| `--ap-comp-datetimepicker-calendar-monthlabel-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-datetimepicker-calendar-monthlabel-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-datetimepicker-calendar-weekday-size` | `40px` |
| `--ap-comp-datetimepicker-calendar-weekday-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datetimepicker-calendar-weekday-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-datetimepicker-calendar-weekday-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-datetimepicker-calendar-datecell-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-datetimepicker-calendar-datecell-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-datetimepicker-calendar-datecell-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-datetimepicker-calendar-datecell-color` | `var(--ap-sem-color-text-primary)` |

### document

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-document-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-document-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-document-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-document-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-document-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-document-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-document-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-document-filename-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-document-filename-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-document-filename-color-link` | `var(--ap-sem-color-link-default)` |
| `--ap-comp-document-filesize-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-document-closeicon-size` | `24px` |
| `--ap-comp-document-closeicon-color` | `var(--ap-sem-color-icon-primary)` |

### fileupload

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-fileupload-dropzone-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-fileupload-dropzone-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-fileupload-dropzone-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-fileupload-dropzone-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-fileupload-dropzone-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-fileupload-dropzone-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-fileupload-dropzone-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-fileupload-dropzone-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-fileupload-dropzone-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-fileupload-dropzone-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-fileupload-icon-size` | `24px` |
| `--ap-comp-fileupload-label-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-fileupload-label-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-fileupload-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-fileupload-error-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-fileupload-error-dropzone-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-fileupload-error-dropzone-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-fileupload-error-dropzone-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-fileupload-error-dropzone-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-fileupload-error-dropzone-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-fileupload-error-dropzone-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-fileupload-error-dropzone-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-fileupload-error-dropzone-border-color-hover` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-fileupload-error-dropzone-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-fileupload-error-label-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-fileupload-error-message-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-fileupload-error-message-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-fileupload-spinner-size` | `20px` |
| `--ap-comp-fileupload-uploaded-gap` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-fileupload-uploaded-errormsg-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-fileupload-uploaded-errormsg-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-fileupload-clearall-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-fileupload-clearall-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-fileupload-clearall-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-fileupload-clearall-color` | `var(--ap-sem-color-interactive-default)` |

### filtermini

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-filtermini-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-filtermini-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-filtermini-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-filtermini-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-filtermini-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-filtermini-title-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-filtermini-title-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-filtermini-condition-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-filtermini-condition-rows-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-filtermini-divider-text-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-filtermini-divider-text-color` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-filtermini-actions-gap` | `var(--ap-sem-spacing-inner-md)` |

### followbar

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-followbar-star-size` | `32px` |
| `--ap-comp-followbar-star-color-unfilled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-followbar-star-color-filled` | `var(--ap-sem-color-brand-primary)` |
| `--ap-comp-followbar-padding-x` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-followbar-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-followbar-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-followbar-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-followbar-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-followbar-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-followbar-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-followbar-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-followbar-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-followbar-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-followbar-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-followbar-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |

### followminicard

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-followminicard-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-followminicard-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-followminicard-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-followminicard-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-followminicard-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-followminicard-title-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-followminicard-title-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-followminicard-list-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-followminicard-list-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-followminicard-list-radius` | `var(--ap-sem-radius-sm)` |

### groupbase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-groupbase-height` | `48px` |
| `--ap-comp-groupbase-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-groupbase-padding-x` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-groupbase-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-groupbase-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-groupbase-icon-size` | `24px` |
| `--ap-comp-groupbase-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-groupbase-text-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-groupbase-icon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-groupbase-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-groupbase-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-groupbase-text-color-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-groupbase-icon-color-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-groupbase-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-groupbase-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-groupbase-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-groupbase-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-groupbase-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### icon

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-icon-button-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-icon-button-padding-flat` | `0px` |
| `--ap-comp-icon-button-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-icon-button-icon-size` | `24px` |

### link

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-link-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-link-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-link-color-default` | `var(--ap-sem-color-link-default)` |
| `--ap-comp-link-color-hover` | `var(--ap-sem-color-link-hover)` |
| `--ap-comp-link-color-focus` | `var(--ap-sem-color-link-default)` |
| `--ap-comp-link-color-disabled` | `var(--ap-sem-color-link-disabled)` |
| `--ap-comp-link-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-link-shadow-focus` | `var(--ap-sem-elevation-focus)` |

### listitem

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-listitem-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-listitem-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-listitem-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-listitem-text-gap-stacked` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-listitem-text-gap-inline-default` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-listitem-text-gap-inline-hoverselected` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-listitem-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-listitem-divider-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-listitem-height-stacked` | `102px` |
| `--ap-comp-listitem-height-inline` | `48px` |
| `--ap-comp-listitem-caption-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-listitem-label-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-listitem-description-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-listitem-helptext-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-listitem-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-listitem-caption-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-listitem-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-listitem-description-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-listitem-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-listitem-bg-selected` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-listitem-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-listitem-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-listitem-leading-icon-size` | `24px` |
| `--ap-comp-listitem-leading-icon-color-enabled` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-listitem-leading-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-listitem-trailing-icon-size` | `24px` |
| `--ap-comp-listitem-trailing-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-listitem-trailing-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-listitem-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-listitem-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-listitem-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### menu

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-menu-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-menu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-menu-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-menu-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-menu-padding-scrolling` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-menu-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-menu-loading-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-menu-grouplabel-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-menu-grouplabel-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-menu-grouplabel-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-menu-divider-note` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-menu-scrollbar-track-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-menu-scrollbar-track-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-menu-scrollbar-track-padding-x` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-menu-scrollbar-track-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-menu-scrollbar-thumb-bg` | `var(--ap-sem-color-surface-hover)` |

### menubase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-menubase-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-menubase-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-menubase-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-menubase-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-menubase-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-menubase-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-menubase-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-menubase-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-menubase-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-menubase-label-color-destructive` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-menubase-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-menubase-sublabel-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-menubase-sublabel-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-menubase-sublabel-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-menubase-icon-size` | `24px` |
| `--ap-comp-menubase-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-menubase-icon-color-destructive` | `var(--ap-sem-color-icon-danger)` |
| `--ap-comp-menubase-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-menubase-selectedcheck-size` | `24px` |
| `--ap-comp-menubase-selectedcheck-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-menubase-viewmore-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-menubase-viewmore-color` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-menubase-viewmore-sublabel-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-menubase-viewmore-sublabel-color` | `var(--ap-sem-color-text-secondary)` |

### metadata

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-metadata-item-gap` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-metadata-label-value-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-metadata-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-metadata-label-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-metadata-value-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-metadata-value-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-metadata-trailing-icon-size` | `24px` |
| `--ap-comp-metadata-trailing-icon-color` | `var(--ap-sem-color-icon-primary)` |

### metadatagroup

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-metadatagroup-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-metadatagroup-gap` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-metadatagroup-item-width` | `200px` |

### modal

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-modal-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-modal-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-modal-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-modal-width-small` | `480px` |
| `--ap-comp-modal-width-medium` | `720px` |
| `--ap-comp-modal-width-large` | `1024px` |

### modalfooter

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-modalfooter-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-modalfooter-padding-y` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-modalfooter-gap` | `var(--ap-sem-spacing-inner-md)` |

### modalheader

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-modalheader-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-modalheader-padding-y` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-modalheader-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-modalheader-title-typography` | `var(--ap-sem-font-weight-heading-2) var(--ap-sem-font-size-heading-2)/var(--ap-sem-line-height-heading-2) var(--ap-sem-font-family-heading-2)` |
| `--ap-comp-modalheader-title-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-modalheader-icon-size` | `24px` |
| `--ap-comp-modalheader-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-modalheader-close-radius` | `var(--ap-sem-radius-md)` |

### multiselect

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-multiselect-stack-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-multiselect-field-height` | `48px` |
| `--ap-comp-multiselect-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-multiselect-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-multiselect-tags-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-multiselect-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-multiselect-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-multiselect-chevron-icon-size` | `24px` |
| `--ap-comp-multiselect-chevron-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-multiselect-chevron-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-multiselect-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-multiselect-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-multiselect-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-multiselect-required-asterisk-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-multiselect-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-multiselect-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-multiselect-placeholder-color` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-multiselect-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-multiselect-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-multiselect-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-multiselect-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-multiselect-text-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-multiselect-helper-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-multiselect-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-multiselect-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-multiselect-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-multiselect-helper-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-multiselect-helper-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-multiselect-tag-bg` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-multiselect-tag-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-multiselect-tag-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-multiselect-tag-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-multiselect-tag-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-multiselect-tag-text-color` | `var(--ap-sem-color-text-secondary)` |

### navbar

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-navbar-item-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-navbar-item-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-navbar-item-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-navbar-item-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-navbar-item-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-navbar-item-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-navbar-item-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-navbar-item-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-navbar-label-typography-default` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-navbar-label-typography-active` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-navbar-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-navbar-label-color-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-navbar-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-navbar-chevron-size` | `24px` |
| `--ap-comp-navbar-chevron-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-navbar-chevron-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-navbar-flyout-offset-top` | `52px` |
| `--ap-comp-navbar-flyout-width` | `218px` |
| `--ap-comp-navbar-width` | `1440px` |
| `--ap-comp-navbar-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-navbar-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-navbar-items-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-navbar-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-navbar-border-width-bottom` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-navbar-border-color-bottom` | `var(--ap-sem-color-border-subtle)` |

### numberinput

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-numberinput-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-numberinput-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-numberinput-label-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-numberinput-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-numberinput-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-numberinput-required-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-numberinput-field-height` | `48px` |
| `--ap-comp-numberinput-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-numberinput-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-numberinput-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-numberinput-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-numberinput-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-numberinput-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-numberinput-field-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-numberinput-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-numberinput-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-numberinput-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-numberinput-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-numberinput-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-numberinput-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-numberinput-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-numberinput-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-numberinput-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-numberinput-leadingicon-size` | `24px` |
| `--ap-comp-numberinput-leadingicon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-numberinput-leadingicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-numberinput-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-numberinput-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-numberinput-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-numberinput-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-numberinput-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### overflowmenu

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-overflowmenu-icon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-overflowmenu-default-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-overflowmenu-default-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-overflowmenu-default-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-overflowmenu-default-border-color` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-overflowmenu-default-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-overflowmenu-default-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-overflowmenu-default-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-overflowmenu-default-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-overflowmenu-flat-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-overflowmenu-flat-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-overflowmenu-flat-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-overflowmenu-flat-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-overflowmenu-active-trigger-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-overflowmenu-active-trigger-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-overflowmenu-active-trigger-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-overflowmenu-active-trigger-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-overflowmenu-active-trigger-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-overflowmenu-dropdown-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-overflowmenu-option-destructive-color` | `var(--ap-sem-color-text-danger)` |

### pagination

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-pagination-container-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-pagination-container-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-pagination-container-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-pagination-container-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-pagination-button-group-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-pagination-count-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-pagination-count-text-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-pagination-page-padding-x` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-pagination-page-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-pagination-page-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-pagination-page-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-pagination-page-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-pagination-page-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-pagination-page-border-color-default` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-pagination-page-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-pagination-page-text-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-pagination-page-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-pagination-page-border-color-hover` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-pagination-page-text-color-hover` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-pagination-page-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-pagination-page-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-pagination-page-text-color-focus` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-pagination-page-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-pagination-page-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-pagination-page-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-pagination-page-bg-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-pagination-page-text-color-active` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-pagination-nav-button-padding` | `0px` |
| `--ap-comp-pagination-nav-button-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-pagination-nav-button-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-pagination-nav-button-icon-size` | `24px` |
| `--ap-comp-pagination-nav-button-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-pagination-ellipsis-icon-size` | `24px` |
| `--ap-comp-pagination-ellipsis-icon-color` | `var(--ap-sem-color-icon-primary)` |

### passwordinput

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-passwordinput-stack-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-passwordinput-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-passwordinput-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-passwordinput-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-passwordinput-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-passwordinput-icon-size` | `24px` |
| `--ap-comp-passwordinput-required-asterisk-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-passwordinput-required-asterisk-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-passwordinput-label-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-passwordinput-field-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-passwordinput-helper-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-passwordinput-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-passwordinput-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-passwordinput-text-color-novalue` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-passwordinput-text-color-hasvalue` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-passwordinput-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-passwordinput-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-passwordinput-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-passwordinput-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-passwordinput-text-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-passwordinput-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-passwordinput-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-passwordinput-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-passwordinput-icon-color` | `var(--ap-sem-color-icon-primary)` |

### phoneinput

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-phoneinput-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-phoneinput-fieldgap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-phoneinput-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-phoneinput-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-phoneinput-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-phoneinput-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-phoneinput-field-height` | `48px` |
| `--ap-comp-phoneinput-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-phoneinput-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-phoneinput-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-phoneinput-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-phoneinput-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-phoneinput-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-phoneinput-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-phoneinput-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-phoneinput-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-phoneinput-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-phoneinput-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-phoneinput-inputtext-color-hovererror` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-phoneinput-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-phoneinput-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-phoneinput-inputtext-color-readonly` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-phoneinput-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-phoneinput-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### radio

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-radio-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-radio-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-radio-description-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-radio-caption-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-radio-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-radio-description-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-radio-description-color-readonly` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-radio-caption-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-radio-caption-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-radio-caption-color-readonly` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-radio-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### radiobase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-radiobase-size` | `24px` |
| `--ap-comp-radiobase-ring-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-radiobase-ring-color-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-radiobase-ring-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-radiobase-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-radiobase-selected-ring-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-radiobase-selected-dot-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-radiobase-selected-ring-color-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-radiobase-selected-dot-color-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-radiobase-selected-ring-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-radiobase-selected-dot-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### radiogroup

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-radiogroup-gap-label-to-list` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-radiogroup-gap-items` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-radiogroup-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-radiogroup-label-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-radiogroup-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-radiogroup-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### relbar

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-relbar-bar-width` | `6px` |
| `--ap-comp-relbar-bar-gap` | `3px` |
| `--ap-comp-relbar-bar-radius` | `var(--ap-sem-radius-xs)` |
| `--ap-comp-relbar-bar-color-filled` | `var(--ap-sem-color-brand-primary)` |
| `--ap-comp-relbar-bar-color-unfilled` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-relbar-recency-dot-gap` | `2px` |
| `--ap-comp-relbar-recency-dot-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-relbar-recency-dot-color` | `var(--ap-sem-color-brand-primary)` |
| `--ap-comp-relbar-bars-dots-gap` | `3px` |
| `--ap-comp-relbar-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-relbar-gap` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-relbar-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-relbar-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-relbar-label-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-relbar-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-relbar-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-relbar-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-relbar-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-relbar-border-color-hover` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-relbar-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-relbar-border-color-active` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-relbar-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-relbar-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-relbar-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-relbar-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### relminicard

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-relminicard-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-relminicard-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-relminicard-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-relminicard-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-relminicard-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-relminicard-section-label-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-relminicard-section-label-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-relminicard-buttons-gap` | `var(--ap-sem-spacing-inner-md)` |

### search

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-search-height` | `48px` |
| `--ap-comp-search-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-search-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-search-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-search-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-search-width-full` | `284px` |
| `--ap-comp-search-width-textonly` | `252px` |
| `--ap-comp-search-width-icononly` | `48px` |
| `--ap-comp-search-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-search-icon-size` | `24px` |
| `--ap-comp-search-icon-color` | `var(--ap-sem-color-icon-secondary)` |
| `--ap-comp-search-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-search-close-icon-size` | `24px` |
| `--ap-comp-search-close-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-search-close-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-search-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-search-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-search-text-color-default` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-search-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-search-border-color-hover` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-search-text-color-hover` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-search-bg-filled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-search-border-color-filled` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-search-text-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-search-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-search-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-search-text-color-focus` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-search-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-search-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-search-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-search-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-search-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-search-text-color-error` | `var(--ap-sem-color-text-danger)` |

### segmentbase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-segmentbase-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-segmentbase-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-segmentbase-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-segmentbase-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-segmentbase-icon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-segmentbase-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-segmentbase-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-segmentbase-unselected-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-segmentbase-unselected-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-segmentbase-unselected-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-segmentbase-unselected-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-segmentbase-unselected-text-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-segmentbase-unselected-text-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-segmentbase-unselected-icon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-segmentbase-unselected-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-segmentbase-selected-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-segmentbase-selected-bg-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-segmentbase-selected-bg-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-segmentbase-selected-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-segmentbase-selected-text-default` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-segmentbase-selected-text-disabled` | `var(--ap-sem-color-text-disabled-on-color)` |
| `--ap-comp-segmentbase-selected-icon-color-default` | `var(--ap-sem-color-icon-inverse)` |
| `--ap-comp-segmentbase-selected-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### segmentedbuttons

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-segmentedbuttons-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-segmentedbuttons-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-segmentedbuttons-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-segmentedbuttons-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-segmentedbuttons-border-color-enabled` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-segmentedbuttons-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |

### select

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-select-field-height` | `48px` |
| `--ap-comp-select-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-select-field-icon-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-select-stack-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-select-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-select-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-select-chevron-icon-size` | `24px` |
| `--ap-comp-select-chevron-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-select-chevron-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-select-required-asterisk-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-select-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-select-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-select-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-select-field-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-select-field-text-color-novalue` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-select-field-text-color-hasvalue` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-select-field-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-select-field-text-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-select-helper-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-select-helper-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-select-helper-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-select-error-message-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-select-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-select-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-select-field-border-color-hover` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-select-field-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-select-field-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-select-field-bg-active` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-border-color-active` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-select-field-bg-filled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-border-color-filled` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-select-field-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-select-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-select-menu-elevation` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-select-menu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-select-menu-padding` | `var(--ap-sem-spacing-inner-2xs)` |

### sidenav

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-sidenav-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-sidenav-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-sidenav-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-sidenav-expanded-width` | `232px` |
| `--ap-comp-sidenav-collapsed-width` | `56px` |
| `--ap-comp-sidenav-toggle-icon-size` | `24px` |
| `--ap-comp-sidenav-toggle-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-sidenav-toggle-radius` | `var(--ap-sem-radius-md)` |

### sidenavitem

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-sidenavitem-height` | `48px` |
| `--ap-comp-sidenavitem-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-sidenavitem-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-sidenavitem-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-sidenavitem-icon-size` | `24px` |
| `--ap-comp-sidenavitem-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-sidenavitem-typography-active` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-sidenavitem-group-chevron-size` | `24px` |
| `--ap-comp-sidenavitem-group-children-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-sidenavitem-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-sidenavitem-text-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-sidenavitem-icon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-sidenavitem-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-sidenavitem-bg-active` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-sidenavitem-text-color-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-sidenavitem-icon-color-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-sidenavitem-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-sidenavitem-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-sidenavitem-bg-disabled` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-sidenavitem-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-sidenavitem-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### sidepanel

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-sidepanel-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-sidepanel-shadow` | `var(--ap-sem-elevation-medium)` |
| `--ap-comp-sidepanel-width-large` | `640px` |
| `--ap-comp-sidepanel-width-medium` | `540px` |
| `--ap-comp-sidepanel-width-small` | `480px` |
| `--ap-comp-sidepanel-slot-height` | `848px` |
| `--ap-comp-sidepanel-scrollbar-track-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-sidepanel-scrollbar-track-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-sidepanel-scrollbar-track-padding-x` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-sidepanel-scrollbar-track-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-sidepanel-scrollbar-track-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-sidepanel-scrollbar-thumb-bg` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-sidepanel-scrollbar-thumb-radius` | `4px` |
| `--ap-comp-sidepanel-scrollbar-thumb-width` | `8px` |
| `--ap-comp-sidepanel-scrollbar-thumb-height` | `125px` |
| `--ap-comp-sidepanel-header-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-sidepanel-header-padding-y` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-sidepanel-header-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-sidepanel-header-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-sidepanel-header-title-typography` | `var(--ap-sem-font-weight-heading-2) var(--ap-sem-font-size-heading-2)/var(--ap-sem-line-height-heading-2) var(--ap-sem-font-family-heading-2)` |
| `--ap-comp-sidepanel-header-title-color` | `var(--ap-sem-color-text-primary)` |

### sidepanelfooter

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-sidepanelfooter-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-sidepanelfooter-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-sidepanelfooter-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-sidepanelfooter-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-sidepanelfooter-buttons-gap` | `var(--ap-sem-spacing-inner-md)` |

### stepper

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-stepper-item-width` | `256px` |
| `--ap-comp-stepper-item-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-stepper-items-gap` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-stepper-bar-height` | `8px` |
| `--ap-comp-stepper-bar-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-stepper-label-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-stepper-label-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-stepper-label-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-stepper-label-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-stepper-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-stepper-icon-size` | `24px` |
| `--ap-comp-stepper-bar-bg-upcoming` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-stepper-bar-bg-active-complete` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-stepper-bar-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-stepper-upcoming-bg-default` | `transparent` |
| `--ap-comp-stepper-upcoming-text-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-stepper-upcoming-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-stepper-upcoming-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-stepper-upcoming-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-stepper-upcoming-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-stepper-active-bg-default` | `transparent` |
| `--ap-comp-stepper-active-text-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-stepper-active-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-stepper-active-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-stepper-active-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-stepper-active-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-stepper-complete-bg-default` | `transparent` |
| `--ap-comp-stepper-complete-text-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-stepper-complete-icon-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-stepper-complete-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-stepper-complete-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-stepper-complete-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-stepper-complete-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-stepper-complete-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### switch

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-switch-track-width` | `40px` |
| `--ap-comp-switch-track-padding` | `2px` |
| `--ap-comp-switch-track-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-switch-thumb-size` | `20px` |
| `--ap-comp-switch-thumb-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-switch-checkicon-size` | `12px` |
| `--ap-comp-switch-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-switch-off-track-bg-default` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-switch-off-track-bg-focus` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-switch-off-track-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-switch-off-thumb-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-switch-off-thumb-bg-disabled` | `var(--ap-sem-color-surface-inverse)` |
| `--ap-comp-switch-on-track-bg-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-switch-on-track-bg-focus` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-switch-on-track-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-switch-on-thumb-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-switch-on-thumb-bg-disabled` | `var(--ap-sem-color-surface-inverse)` |
| `--ap-comp-switch-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-switch-label-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-switch-label-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-switch-helptext-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-switch-helptext-color` | `var(--ap-sem-color-text-tertiary)` |

### table

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-table-header-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-table-header-text-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-table-header-text-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-table-header-text-width` | `221px` |
| `--ap-comp-table-header-action-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-table-header-action-width` | `64px` |
| `--ap-comp-table-header-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-table-header-text-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-table-header-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-table-header-bg-default` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-table-header-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-table-header-bg-focus` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-table-header-bg-filtermenuactive` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-table-header-bg-default-actiontype` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-table-header-bg-hover-actiontype` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-table-header-bg-disabled-actiontype` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-table-header-bg-selected-actiontype` | `var(--ap-sem-color-surface-selected)` |
| `--ap-comp-table-header-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-table-header-draghandle-size` | `24px` |
| `--ap-comp-table-header-draghandle-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-table-header-sorticon-size` | `24px` |
| `--ap-comp-table-header-filtericon-size` | `24px` |
| `--ap-comp-table-header-addcolicon-size` | `24px` |
| `--ap-comp-table-header-badge-bg` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-table-header-badge-text-color` | `var(--ap-sem-color-text-inverse)` |
| `--ap-comp-table-header-badge-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-table-header-badge-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-table-header-badge-width` | `25px` |
| `--ap-comp-table-header-badge-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-table-header-menu-offset-top` | `48px` |
| `--ap-comp-table-header-menu-width-selected` | `200px` |
| `--ap-comp-table-header-menu-width-menuactive` | `221px` |
| `--ap-comp-table-header-menu-removecolumn-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-table-outer-gap` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-table-container-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-table-container-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-table-container-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-table-container-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-table-actionbar-gap` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-table-actionbar-height` | `48px` |
| `--ap-comp-table-search-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-table-search-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-table-search-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-table-search-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-table-search-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-table-search-placeholder-color` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-table-pagination-padding-x` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-table-pagination-padding-y` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-table-pagination-summary-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-table-pagination-summary-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-table-pagination-items-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-table-pagination-item-padding-x` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-table-pagination-item-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-table-pagination-item-radius` | `var(--ap-sem-radius-sm)` |
| `--ap-comp-table-pagination-item-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-table-pagination-item-border-default-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-table-pagination-item-border-default-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-table-pagination-item-text-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-table-pagination-item-bg-active` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-table-pagination-item-text-active` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-table-pagination-item-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-table-pagination-chevron-size` | `24px` |
| `--ap-comp-table-empty-padding` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-table-empty-typography` | `var(--ap-sem-font-weight-body-large) var(--ap-sem-font-size-body-large)/var(--ap-sem-line-height-body-large) var(--ap-sem-font-family-body-large)` |
| `--ap-comp-table-empty-text-color` | `var(--ap-sem-color-text-tertiary)` |

### tabs

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-tabs-min-width` | `120px` |
| `--ap-comp-tabs-outer-padding` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tabs-outer-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tabs-underline-width` | `var(--ap-sem-border-width-emphasis)` |
| `--ap-comp-tabs-label-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-tabs-label-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tabs-label-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-tabs-label-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-tabs-focus-shadow` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-tabs-hover-bg` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-tabs-underline-color-selected` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-tabs-label-color-selected` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-tabs-underline-color-unselected` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-tabs-label-color-unselected-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-tabs-label-color-unselected-hoverfocus` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-tabs-underline-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-tabs-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### tag

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-tag-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tag-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-tag-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tag-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-tag-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-tag-icon-size` | `24px` |
| `--ap-comp-tag-dismiss-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-tag-default-solid-bg` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-tag-default-solid-text` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-tag-default-subtle-bg` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-tag-default-subtle-text` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-tag-info-solid-bg` | `var(--ap-sem-color-feedback-info)` |
| `--ap-comp-tag-info-solid-text` | `var(--ap-sem-color-feedback-info-subtle)` |
| `--ap-comp-tag-info-subtle-bg` | `var(--ap-sem-color-feedback-info-subtle)` |
| `--ap-comp-tag-info-subtle-text` | `var(--ap-sem-color-feedback-info-text)` |
| `--ap-comp-tag-danger-solid-bg` | `var(--ap-sem-color-feedback-error)` |
| `--ap-comp-tag-danger-solid-text` | `var(--ap-sem-color-feedback-error-subtle)` |
| `--ap-comp-tag-danger-subtle-bg` | `var(--ap-sem-color-feedback-error-subtle)` |
| `--ap-comp-tag-danger-subtle-text` | `var(--ap-sem-color-feedback-error-text)` |
| `--ap-comp-tag-success-solid-bg` | `var(--ap-sem-color-feedback-success)` |
| `--ap-comp-tag-success-solid-text` | `var(--ap-sem-color-feedback-success-subtle)` |
| `--ap-comp-tag-success-subtle-bg` | `var(--ap-sem-color-feedback-success-subtle)` |
| `--ap-comp-tag-success-subtle-text` | `var(--ap-sem-color-feedback-success-text)` |
| `--ap-comp-tag-warning-solid-bg` | `var(--ap-sem-color-feedback-warning)` |
| `--ap-comp-tag-warning-solid-text` | `var(--ap-sem-color-feedback-warning-subtle)` |
| `--ap-comp-tag-warning-subtle-bg` | `var(--ap-sem-color-feedback-warning-subtle)` |
| `--ap-comp-tag-warning-subtle-text` | `var(--ap-sem-color-feedback-warning-text)` |
| `--ap-comp-tag-interactive-solid-bg` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-tag-interactive-solid-text` | `var(--ap-sem-color-text-on-interactive)` |
| `--ap-comp-tag-interactive-subtle-bg` | `var(--ap-sem-color-interactive-subtle)` |
| `--ap-comp-tag-interactive-subtle-text` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-tag-brand-solid-bg` | `var(--ap-sem-color-brand-primary)` |
| `--ap-comp-tag-brand-solid-text` | `var(--ap-sem-color-text-on-brand)` |
| `--ap-comp-tag-brand-subtle-bg` | `var(--ap-sem-color-brand-subtle)` |
| `--ap-comp-tag-brand-subtle-text` | `var(--ap-sem-color-brand-primary)` |

### textarea

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-textarea-stack-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-textarea-field-height` | `183px` |
| `--ap-comp-textarea-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-textarea-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-textarea-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-textarea-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-textarea-required-asterisk-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-textarea-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-textarea-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-textarea-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textarea-field-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-textarea-field-text-color-novalue` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-textarea-field-text-color-hasvalue` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-textarea-field-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textarea-counter-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-textarea-counter-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-textarea-counter-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textarea-helper-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-textarea-helper-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-textarea-helper-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textarea-error-message-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-textarea-error-message-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-textarea-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textarea-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-textarea-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-textarea-border-color-hover` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-textarea-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textarea-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-textarea-bg-readonly` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-textarea-border-color-readonly` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-textarea-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-textarea-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-textarea-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textarea-border-color-error` | `var(--ap-sem-color-border-danger)` |

### textinput

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-textinput-stack-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-textinput-field-height` | `48px` |
| `--ap-comp-textinput-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-textinput-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-textinput-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-textinput-border-width-default` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-textinput-trailing-icon-size` | `24px` |
| `--ap-comp-textinput-trailing-icon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-textinput-trailing-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-textinput-required-asterisk-color` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-textinput-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-textinput-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-textinput-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textinput-field-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-textinput-field-text-color-novalue` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-textinput-field-text-color-hasvalue` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-textinput-field-text-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textinput-field-text-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-textinput-helper-typography` | `var(--ap-sem-font-weight-caption) var(--ap-sem-font-size-caption)/var(--ap-sem-line-height-caption) var(--ap-sem-font-family-caption)` |
| `--ap-comp-textinput-helper-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-textinput-helper-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-textinput-helper-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-textinput-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textinput-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-textinput-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-textinput-border-color-hover` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-textinput-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textinput-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-textinput-bg-readonly` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-textinput-border-color-readonly` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-textinput-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-textinput-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-textinput-bg-error` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-textinput-border-color-error` | `var(--ap-sem-color-border-danger)` |

### timeline

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-timeline-entries-gap` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-timeline-dot-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-timeline-dot-border-color` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-timeline-dot-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-timeline-dot-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-timeline-list-radius` | `var(--ap-sem-radius-md)` |

### timelinearrow

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-timelinearrow-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-timelinearrow-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-timelinearrow-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-timelinearrow-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-timelinearrow-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-timelinearrow-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-timelinearrow-border-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-timelinearrow-border-color-hover` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-timelinearrow-border-color-disabled` | `var(--ap-sem-color-interactive-disabled)` |
| `--ap-comp-timelinearrow-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-timelinearrow-icon-size` | `var(--ap-sem-icon-size-md)` |
| `--ap-comp-timelinearrow-icon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-timelinearrow-icon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |

### timelinebase

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-timelinebase-gap` | `var(--ap-sem-spacing-inner-md)` |

### timelinelabel

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-timelinelabel-gap-arrow-content` | `var(--ap-sem-spacing-inner-xl)` |
| `--ap-comp-timelinelabel-gap-content-stack` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-timelinelabel-gap-label-caption` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-timelinelabel-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-timelinelabel-color-default` | `var(--ap-sem-color-interactive-default)` |
| `--ap-comp-timelinelabel-color-hover` | `var(--ap-sem-color-interactive-hover)` |
| `--ap-comp-timelinelabel-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-timelinelabel-caption-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-timelinelabel-caption-color-default` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-timelinelabel-caption-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-timelinelabel-description-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-timelinelabel-description-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-timelinelabel-description-color-disabled` | `var(--ap-sem-color-text-disabled)` |

### timepicker

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-timepicker-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-timepicker-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-timepicker-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-timepicker-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-timepicker-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-timepicker-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-timepicker-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-timepicker-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-timepicker-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-timepicker-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-timepicker-field-bg-readonly` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-timepicker-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-timepicker-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-timepicker-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-timepicker-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-timepicker-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-timepicker-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-timepicker-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-timepicker-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-timepicker-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-timepicker-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-timepicker-clockicon-size` | `24px` |
| `--ap-comp-timepicker-clockicon-color` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-timepicker-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-timepicker-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-timepicker-helptext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-timepicker-errormsg-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-timepicker-errormsg-color` | `var(--ap-sem-color-text-danger)` |

### tooltip

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-tooltip-padding` | `var(--ap-sem-spacing-inner-md)` |
| `--ap-comp-tooltip-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-tooltip-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-tooltip-bg` | `var(--ap-sem-color-surface-inverse)` |
| `--ap-comp-tooltip-text-color` | `var(--ap-sem-color-text-inverse)` |
| `--ap-comp-tooltip-header-typography` | `var(--ap-sem-font-weight-body-bold) var(--ap-sem-font-size-body-bold)/var(--ap-sem-line-height-body-bold) var(--ap-sem-font-family-body-bold)` |
| `--ap-comp-tooltip-body-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-tooltip-caret-color` | `var(--ap-sem-color-surface-inverse)` |

### typeahead

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-typeahead-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeahead-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-typeahead-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeahead-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-typeahead-field-height` | `48px` |
| `--ap-comp-typeahead-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-typeahead-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeahead-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeahead-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-typeahead-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeahead-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-typeahead-field-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeahead-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-typeahead-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-typeahead-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-typeahead-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-typeahead-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-typeahead-searchicon-size` | `24px` |
| `--ap-comp-typeahead-searchicon-color-default` | `var(--ap-sem-color-icon-secondary)` |
| `--ap-comp-typeahead-searchicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-typeahead-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-typeahead-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-typeahead-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-typeahead-inputtext-color-filled` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeahead-inputtext-color-typing` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeahead-inputtext-color-active` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeahead-clearicon-size` | `24px` |
| `--ap-comp-typeahead-clearicon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-typeahead-clearicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-typeahead-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-typeahead-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-typeahead-helptext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-typeahead-menu-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeahead-menu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeahead-menu-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeahead-menu-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeahead-menu-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-typeahead-option-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-typeahead-option-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-typeahead-option-text-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeahead-option-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeahead-option-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeahead-option-shadow-highlighted` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-typeahead-scrollbar-track-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-typeahead-scrollbar-track-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-typeahead-scrollbar-track-padding-x` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeahead-scrollbar-track-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeahead-scrollbar-thumb-bg` | `var(--ap-sem-color-surface-hover)` |

### typeaheadmulti

| Token | Resolves to |
| :-- | :-- |
| `--ap-comp-typeaheadmulti-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeaheadmulti-label-typography` | `var(--ap-sem-font-weight-body-small) var(--ap-sem-font-size-body-small)/var(--ap-sem-line-height-body-small) var(--ap-sem-font-family-body-small)` |
| `--ap-comp-typeaheadmulti-label-color-default` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeaheadmulti-label-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-typeaheadmulti-field-height` | `48px` |
| `--ap-comp-typeaheadmulti-field-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-typeaheadmulti-field-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-field-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeaheadmulti-field-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-typeaheadmulti-field-bg-default` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeaheadmulti-field-bg-hover` | `var(--ap-sem-color-surface-hover)` |
| `--ap-comp-typeaheadmulti-field-bg-focus` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeaheadmulti-field-bg-disabled` | `var(--ap-sem-color-surface-disabled)` |
| `--ap-comp-typeaheadmulti-field-border-color-default` | `var(--ap-sem-color-border-default)` |
| `--ap-comp-typeaheadmulti-field-border-color-error` | `var(--ap-sem-color-border-danger)` |
| `--ap-comp-typeaheadmulti-field-border-color-disabled` | `var(--ap-sem-color-border-disabled)` |
| `--ap-comp-typeaheadmulti-field-shadow-focus` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-typeaheadmulti-searchicon-size` | `24px` |
| `--ap-comp-typeaheadmulti-searchicon-color-default` | `var(--ap-sem-color-icon-secondary)` |
| `--ap-comp-typeaheadmulti-searchicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-typeaheadmulti-inputtext-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-typeaheadmulti-inputtext-color-placeholder` | `var(--ap-sem-color-text-placeholder)` |
| `--ap-comp-typeaheadmulti-inputtext-color-disabled` | `var(--ap-sem-color-text-disabled)` |
| `--ap-comp-typeaheadmulti-inputtext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-typeaheadmulti-inputtext-color-typing` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeaheadmulti-inputtext-color-active` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeaheadmulti-clearicon-size` | `24px` |
| `--ap-comp-typeaheadmulti-clearicon-color-default` | `var(--ap-sem-color-icon-primary)` |
| `--ap-comp-typeaheadmulti-clearicon-color-disabled` | `var(--ap-sem-color-icon-disabled)` |
| `--ap-comp-typeaheadmulti-helptext-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-typeaheadmulti-helptext-color-default` | `var(--ap-sem-color-text-tertiary)` |
| `--ap-comp-typeaheadmulti-helptext-color-error` | `var(--ap-sem-color-text-danger)` |
| `--ap-comp-typeaheadmulti-tags-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-tag-bg` | `var(--ap-sem-color-surface-secondary)` |
| `--ap-comp-typeaheadmulti-tag-radius` | `var(--ap-sem-radius-full)` |
| `--ap-comp-typeaheadmulti-tag-padding-x` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-tag-padding-y` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeaheadmulti-tag-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-tag-typography` | `var(--ap-sem-font-weight-label) var(--ap-sem-font-size-label)/var(--ap-sem-line-height-label) var(--ap-sem-font-family-label)` |
| `--ap-comp-typeaheadmulti-tag-text-color` | `var(--ap-sem-color-text-secondary)` |
| `--ap-comp-typeaheadmulti-tag-remove-icon-size` | `24px` |
| `--ap-comp-typeaheadmulti-tag-remove-icon-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeaheadmulti-tag-remove-icon-color` | `var(--ap-sem-color-icon-secondary)` |
| `--ap-comp-typeaheadmulti-menu-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeaheadmulti-menu-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeaheadmulti-menu-padding` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeaheadmulti-menu-gap` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeaheadmulti-menu-shadow` | `var(--ap-sem-elevation-low)` |
| `--ap-comp-typeaheadmulti-option-padding` | `var(--ap-sem-spacing-inner-sm)` |
| `--ap-comp-typeaheadmulti-option-gap` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-option-typography` | `var(--ap-sem-font-weight-body) var(--ap-sem-font-size-body)/var(--ap-sem-line-height-body) var(--ap-sem-font-family-body)` |
| `--ap-comp-typeaheadmulti-option-text-color` | `var(--ap-sem-color-text-primary)` |
| `--ap-comp-typeaheadmulti-option-bg` | `var(--ap-sem-color-surface-default)` |
| `--ap-comp-typeaheadmulti-option-radius` | `var(--ap-sem-radius-md)` |
| `--ap-comp-typeaheadmulti-option-shadow-highlighted` | `var(--ap-sem-elevation-focus)` |
| `--ap-comp-typeaheadmulti-scrollbar-track-border-width` | `var(--ap-sem-border-width-default)` |
| `--ap-comp-typeaheadmulti-scrollbar-track-border-color` | `var(--ap-sem-color-border-subtle)` |
| `--ap-comp-typeaheadmulti-scrollbar-track-padding-x` | `var(--ap-sem-spacing-inner-2xs)` |
| `--ap-comp-typeaheadmulti-scrollbar-track-padding-y` | `var(--ap-sem-spacing-inner-xs)` |
| `--ap-comp-typeaheadmulti-scrollbar-thumb-bg` | `var(--ap-sem-color-surface-hover)` |
