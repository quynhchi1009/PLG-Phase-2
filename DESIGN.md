---
name: AsiaVerify Portal (PLG Billing)
description: A quiet, exact billing ledger inside the navy AsiaVerify Portal shell.
colors:
  interactive-primary: "#00735f"
  interactive-control: "#004d3f"
  interactive-accent: "#e5f1e8"
  interactive-accent-hover: "#d6e9da"
  interactive-selected: "#edf5ef"
  interactive-secondary: "#626262"
  border-accent: "#8fcaa9"
  chrome-accent: "#2fbf87"
  navy-700: "#1f3954"
  navy-900: "#111a24"
  navy-950: "#0b1016"
  background-system: "#111a24"
  content-primary: "#1b1c1e"
  content-main: "#444444"
  content-tertiary: "#6b6b6b"
  content-link: "#004d3f"
  base-light: "#ffffff"
  base-contrast: "#f8f8f8"
  background-subtle: "#f1f1f1"
  border-subtle: "#e3e3e3"
  border-neutral: "#a5a5a5"
  sentiment-positive: "#1b813d"
  sentiment-negative: "#d14343"
  sentiment-warning: "#ffaa52"
  sentiment-negative-elevated: "#ffefef"
  sentiment-warning-elevated: "#fff6e8"
  content-on-negative-elevated: "#95231e"
  content-on-warning-elevated: "#9a6200"
typography:
  headline:
    fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  price:
    fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  section-title:
    fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  card-title:
    fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.25
  section-label:
    fontFamily: "Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
  badge:
    fontFamily: "'Open Sans', 'Segoe UI', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  xl: "14px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.interactive-primary}"
    textColor: "{colors.base-light}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.interactive-control}"
  button-secondary:
    backgroundColor: "{colors.base-light}"
    textColor: "{colors.interactive-primary}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.interactive-accent}"
  button-current:
    backgroundColor: "{colors.interactive-selected}"
    textColor: "{colors.interactive-control}"
    rounded: "{rounded.md}"
  button-sm:
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "32px"
  badge-accent:
    backgroundColor: "{colors.interactive-selected}"
    textColor: "{colors.interactive-control}"
    typography: "{typography.badge}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "22px"
  card:
    backgroundColor: "{colors.base-light}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.base-light}"
    textColor: "{colors.content-primary}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  dialog:
    backgroundColor: "{colors.base-light}"
    textColor: "{colors.content-main}"
    rounded: "{rounded.xl}"
    padding: "32px 32px 24px"
  toast:
    backgroundColor: "{colors.background-system}"
    rounded: "{rounded.lg}"
    padding: "8px 8px 8px 16px"
  sidebar-item:
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
---

# Design System: AsiaVerify Portal (PLG Billing)

## Overview

**Creative North Star: "The Quiet Ledger"**

The AsiaVerify Portal is a navy-framed workspace: a gradient top bar and sidebar that every product shares, and inside it a pale, near-white working floor of hairline-edged cards. Billing extends that world without competing with it. The content area reads like a ledger: exact amounts and dates set in Roboto with tabular numerals, sections divided by single hairline rules, and one green voice reserved for actions, the plan price and confirmation marks.

Density is moderate and administrative: 14px Open Sans body, 24px card padding, 20px gutters. Depth is almost absent on the working floor (a barely-there card shadow) and is spent only on things that float: tooltips, toasts and the modal dialog. Good news and the recommended choice are carried by soft green tints, never by saturated fills; cancellation and warnings use the sheet's sentiment tokens in their elevated (tinted) form.

Every colour comes from the AsiaVerify Colour Tokens sheet, in light and dark, and the semantic name in code is the sheet's name (`content.main` is `--color-content-main`). The navy chrome is constant across themes; only the working floor flips.

**Key Characteristics:**
- Navy gradient chrome (navy-700 to navy-950), identical in light and dark.
- White cards on an off-white floor, 1px subtle hairlines, near-flat shadow.
- One interactive green for actions, prices and checks; pale green tints for good news and the featured option.
- Roboto for every heading, Open Sans for everything else (figures and money included); tabular numerals wherever figures align.
- Multi-step flows reshape a single dialog rather than stacking new ones.

## Colors

A restrained neutral floor with a single deep-teal-green voice, framed by navy chrome; all values are generated from the brand token sheet and flip for dark mode.

### Primary
- **Registry Green** (interactive-primary): primary buttons, the plan label, checkmarks, switch-on, active tab underline, meter fill, focus outline. In dark mode it lifts to a brighter teal for contrast.
- **Deep Ledger Green** (interactive-control): hover for primary buttons, the plan price, accent badge and "current" button text, perk-box titles.
- **Pale Ledger Tint** (interactive-selected): background for good-news notices, the featured yearly plan and its comparison column, the dialog hero band, the "current plan" button and accent badges.
- **Mint Hairline** (border-accent): the edge that always accompanies a green tint (notices, featured plan, perk box, accent badge).
- **Soft Mint Wash** (interactive-accent / accent-hover): secondary-button hover, input focus halo and text selection.

### Secondary
- **Chrome Signal Green** (chrome-accent): only on navy chrome: the "Asia" in the logo, the active-nav edge bar, "New" tags and the notification count. Never on the working floor.

### Neutral
- **Portal Navy** (navy-700, navy-900, navy-950): top bar (90deg) and sidebar (180deg) gradients; navy-900 doubles as background-system for tooltips and toasts.
- **Ink** (content-primary): headings, strong values, table emphasis.
- **Body Graphite** (content-main): running text.
- **Quiet Graphite** (content-tertiary): hints, meta lines, table sub-lines, inactive tabs, legends.
- **Ledger Link** (content-link): inline links and text buttons.
- **Paper White** (base-light): cards, dialogs, inputs.
- **Floor Grey** (base-contrast): page background, payment-method well, reason-step aside, table row hover.
- **Subtle Fill** (background-subtle): switch track, meter track, segmented-tab rail, ghost hover.
- **Hairline** (border-subtle): every card edge and section divider.
- **Control Grey** (interactive-secondary): unchecked switch, checkbox and input strokes.

### Sentiment
- **Positive / Negative / Warning** (sentiment-*, with their -elevated tints and content-on-*-elevated ink): status badges, error and warning notices, the low-credit meter (warning), field errors (negative).

### Named Rules
**The Sheet Is Law Rule.** Colours enter only through `--color-*` tokens generated from the AsiaVerify Colour Tokens sheet. Never hand-edit a value or introduce a hex that is not on the sheet; regenerate instead.

**The Navy Stays Navy Rule.** Chrome (top bar, sidebar) uses the navy and chrome-* tokens in both themes. Chrome Signal Green belongs to the chrome; Registry Green belongs to the working floor.

**The Featured Plan Exception.** On the Upgrade page the featured Growth plan card is set in Portal Navy (the chrome gradient) with white text, Chrome Signal Green credit figures and checks, and a warning-tinted savings badge, as the product design specifies (confirmed by the product owner, Oct 2026). This is the only navy surface on the working floor.

**The Tint, Not Fill Rule.** Good news and "recommended" are expressed by Pale Ledger Tint plus a Mint Hairline, never by a saturated green surface. Saturated green is for things you can press.

## Typography

**Display Font:** Roboto (with Helvetica Neue, Arial), weights 500 and 700
**Body Font:** Open Sans (with Segoe UI, system-ui), weights 400, 600 and 700

**Character:** Roboto gives headings a firm, compact authority; Open Sans keeps long administrative text open and readable at 14px. Both are self-hosted via Fontsource.

### Hierarchy
- **Headline** (Roboto 700, 26px, 1.25, -0.01em): page titles; drops to 22px under 760px.
- **Price** (Open Sans 700, 26px, tabular numerals): plan prices, plan credits and the credit balance; the unit ("/ billed monthly") follows at 16px 500. Smaller mini-plan price is 22px.
- **Section Title** (Roboto 700, 22px): in-page section heads such as the comparison block; the lapsed-plan title uses 500.
- **Title** (Roboto 700, 18px): dialog titles, plan names; 500 weight in green for the subscription card label.
- **Card Title** (Roboto 500, 18px): card headers such as "Subscription settings", offer titles (700).
- **Section Label** (Roboto 700, 14px): headings inside a card or dialog: "Subscription plan breakdown", "Changed your mind?", "Current credit balance", notice titles, perk-box titles, tier names, comparison plan names. Roboto ships 500 and 700 only, so heading weights are one of those two.
- **Body** (Open Sans 400, 14px, 1.5): running text; ledes cap at 46ch in dialogs and 72ch under page titles.
- **Body Small** (Open Sans 400, 13px): hints, notices text, facts lists, legends, toasts.
- **Label** (Open Sans 600, 14px): buttons, setting labels, tab labels, table emphasis.
- **Badge** (Open Sans 600, 12px): status and accent badges; also table sub-lines at 400.

### Named Rules
**The One Figure Size Rule.** On Billing (PM layout: plan card left, Subscription settings right) the three numbers a customer checks share one size: plan price, plan credits and the credit balance are all Open Sans 700, 26px, Deep Ledger Green, each followed by a 14px tertiary unit ("/billed monthly", "credits per month", "of 535 remaining"). Card titles sit above them at 18px 500; section labels ("Subscription plan breakdown", "Changed your mind?", "Current credit balance", notice titles) are Roboto 14px 700; body and hints are 14px. No figure is enlarged beyond the others.

**The Ledger Numerals Rule.** Every amount, credit count, date column and pager count uses tabular numerals (`font-variant-numeric: tabular-nums`); body text keeps lining numerals.

**The Two Families Rule.** Every heading is Roboto: h1–h6, card and dialog titles, section labels, notice titles, plan names and the top-bar product title. Everything else is Open Sans, including prices, credit figures, buttons, labels, tables and tooltips. In code, `base.css` owns the rule: h1–h6 plus the heading-styled classes share one `font-family: var(--font-head)` selector list, and new heading-styled classes join that list rather than setting the font themselves.

## Layout

The shell is a CSS grid: a 56px sticky top bar across, a 236px sticky sidebar (68px collapsed) and a fluid main column. Pages cap at 1240px with 32px/40px/48px padding (top/sides/bottom), dropping to 24px/16px/40px under 760px.

Page heads are a title, a one-paragraph lede and a single hairline rule beneath (24px below, 24px after). Content below sits in cards; inside a card, sibling sections are separated by a hairline with 20px above and below rather than by nested cards.

Spacing is a 4px-based scale (4, 8, 12, 16, 20, 24, 32, 40, 48). Card padding is 24px (20px on mobile); grid gutters are 20px; card-to-section gaps are 32px.

Breakpoints, from the build: plan cards stack at 1100px; the two-column billing grid stacks at 1040px; the sidebar becomes an off-canvas drawer with a scrim at 900px; page and dialog padding tighten and two-pane dialogs stack at 760px; the top bar title hides at 520px; segmented tabs stack at 480px.

## Elevation & Depth

A near-flat, hybrid system. The working floor relies on hairline borders and tonal steps (Floor Grey under Paper White) for structure; the card shadow is so faint it only softens edges. Real elevation is spent on things that float above the page: tooltips, toasts, the mobile drawer and dialogs, each over a navy-tinted scrim.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgb(14 15 12 / 0.04), 0 2px 8px -2px rgb(14 15 12 / 0.06)`): resting cards only.
- **Pop** (`box-shadow: 0 8px 24px -6px rgb(11 16 22 / 0.22), 0 2px 6px rgb(11 16 22 / 0.08)`): tooltips, toasts, skip link.
- **Dialog** (`box-shadow: 0 28px 56px -16px rgb(11 16 22 / 0.38), 0 4px 12px rgb(11 16 22 / 0.1)`): modal dialogs and the mobile sidebar drawer.

### Named Rules
**The Hairline First Rule.** Separate with a 1px Hairline before reaching for a shadow or another card. Shadows are for things that float.

## Shapes

Gently rounded, never pillowy. Controls (buttons, inputs, sidebar items, notices, tooltips) use a 6px radius; badges and checkboxes 4px; cards, toasts, perk boxes and the segmented rail 10px; dialogs and plan columns 14px. Pills (999px) are reserved for the switch, the credit meter and the notification count. Icons are Lucide line icons at 16 to 20px; feature icons in dialogs and offers sit in a white circle ringed by a Mint Hairline.

## Components

### Buttons
Solid, compact and unmistakably green.
- **Shape:** 6px radius, 40px tall (32px small), 600 weight label.
- **Primary:** Registry Green fill, white label; hover deepens to Deep Ledger Green; active adds a slight inset press.
- **Secondary:** white with a 1px Registry Green border and green label; hover fills with Soft Mint Wash.
- **Ghost:** transparent, Body Graphite; hover Subtle Fill. **Link-style:** transparent, green label, underline on hover.
- **Current:** Pale Ledger Tint with Mint Hairline and Deep Ledger Green label, inert; marks the plan the user already has.
- **Quiet:** neutral fill with disabled ink; still focusable so it can explain why it is not yet actionable.
- **Text button:** underlined link-coloured text; the quiet variant (13px, tertiary) is used for destructive exits like "Cancel subscription".
- **Focus:** 2px Registry Green outline, 2px offset, everywhere; chrome controls switch the outline to Chrome Signal Green.

### Badges
- **Style:** 22px tall, 4px radius, 1px border, 12px 600 label.
- **Variants:** positive (sentiment-positive-elevated, Mint Hairline), warning, accent (Pale Ledger Tint), neutral (Subtle Fill).

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Paper White on Floor Grey.
- **Shadow Strategy:** Card shadow only (see Elevation).
- **Border:** 1px Hairline.
- **Internal Padding:** 24px; internal sections split by hairlines.
- **Featured plan:** Pale Ledger Tint with an inset Mint Hairline, 14px radius; unfeatured plan columns are borderless on desktop and gain a hairline when stacked.

### Inputs / Fields
- **Style:** 40px (34px small), 1px Control Grey stroke, 6px radius, white fill; hover darkens the stroke.
- **Focus:** stroke turns Registry Green with a 3px Soft Mint Wash halo.
- **Error:** negative stroke plus a 13px 600 negative message reserved below.
- **Checkbox:** 18px, 4px radius, 1.5px stroke; checked fills Registry Green. **Switch:** 40x22 pill, green when on, 220ms thumb slide.

### Notices
Grid of icon, text and optional dismiss; 6px radius, 1px border, 13px text with a 600 title. Positive uses Pale Ledger Tint; negative and warning use the sentiment elevated pairs. Enters with a 4px drop-in fade.

### Tabs
- **Line tabs:** 600 labels in Quiet Graphite, 24px apart over a hairline; selected turns Ink with a 2px inset Registry Green underline.
- **Segmented tabs:** Subtle Fill rail (10px radius, 4px padding); selected segment is white with a soft lift and green label.

### Tables
Collapsed, tabular-numeral tables with 12px/16px cells, hairline row dividers, 13px 600 headers and Floor Grey row hover; first column is flush left. Secondary lines sit beneath at 12px tertiary.

### Navigation
Navy sidebar: 40px rows, 6px radius, chrome-tertiary text turning white on hover; the current page gets a 7% white wash, 600 weight and a 3px Chrome Signal Green bar on the leading edge. Collapses to icons at 68px; becomes a drawer under 900px. Top bar carries the logo ("Asia" in Chrome Signal Green), the product title and 36px chrome icon buttons.

### The Reshaping Dialog (signature)
One native modal carries a whole multi-step flow. Width animates between 440px, 560px and 880px (280ms, ease-out) as steps change, while each step's content re-enters with a 6px rise (260ms). Optional hero band in Pale Ledger Tint with a 56px ringed icon disc; titles 18px 700; actions right-aligned or stacked and centred; wide steps split into a form pane and a Floor Grey aside. Success steps use the Success Mark.

**Success dialogs.** "Plan activated" mirrors the Plan cancelled receipt: a cool green-grey panel (Pale Ledger Tint mixed into Floor Grey), a centred "Plan activated" badge (Pale Ledger Tint, Primary Green 600), the title "You successfully upgraded to <plan>!" with the plan name in Primary Green, then a white hairline box holding the plan's features (circled ticks) and a full-width "Back to my plan" button. Content rises in on a short stagger (badge 80ms, title 160ms, box 320ms, items from 460ms at 60ms each); nothing bounces. On close, the plan card and Subscription settings ring once with a 2px green outline that fades over 1.4s. Reduced motion drops every delay.

**"Are you sure you'd like to cancel?"** Centred 18px title (balanced) and a 14px lede, then one white card (Hairline, Card shadow, 10px radius, 20px padding) holding the stakes and both exits: a 16px Roboto 500 title in Deep Ledger Green ("Stay subscribed to retain your perks"), three 13px perks as Body Graphite sentences whose key phrases step up to 600 (16px Pale Ledger Tint ticks, 8px apart), then a full-width Keep current plan button and a 600 Continue to cancel link. Keeping the plan is the only solid control on the step.

**Upgrade confirmation hierarchy.** The dialog title (22px Roboto 700) is the largest element; a 14px lede in secondary text follows (plan name 600, kept on one line); focus opens on the title, not the pay button. A white plan card (Hairline, soft green-cast card shadow, 24px padding) holds the plan name (16px Roboto 700, primary) 4px above the 18px price (navy in light mode, unit 14px tertiary), the Monthly/Yearly switch on a Floor Grey rail for Flex customers, and the perks at 14px with 20px circled ticks. Below the card the ledger runs as 14px rows in primary text: the plan line's label ("Growth (billed yearly)") is regular and its figure 600; the rolled-over row is 600 in Deep Ledger Green with its (?) tooltip; "Total credits after upgrade" follows a hairline, label and figure 600. Then Confirm and pay. Sections sit 20px apart. "Plan confirmation" (re-subscribing after a failed renewal) uses the same layout without the rolled-over row and with "Total credits after renewal".

**Success Mark.** Every success state (credits added, subscription reactivated, Stripe's "Payment successful") uses one mark (`components/ui/SuccessMark.tsx`): a 44px Paper White circle with a 3px Registry Green outline and a 4px round-capped Registry Green tick. The circle pops in (420ms) and the tick then draws itself (360ms); reduced motion drops the delays.

**"N credits added!"** follows its own design in the narrow (440px) dialog: left-aligned, the 44px Success Mark, the title at 18px Roboto 700 in primary text (not green), a 14px lede ("You have successfully topped-up your credits") and a full-width "View balance" button; padding 32px top, 24px sides and bottom. It has no ledger; on close, the Subscription settings card rings once. "Subscription reactivated" uses the same layout and size.

**"Confirm plan & terms"** (new purchases) follows the product mock: a Floor Grey dialog surface; an 18px Roboto 500 title; the plan card in Floor Grey with a 1px Registry Green border and the soft green-cast card shadow, 24px/32px padding; plan name 18px in Body Graphite; price in Body Graphite (unit in Body Graphite 400); credits and their unit in Registry Green after a Hairline divider; features as Body Graphite sentences with thin (1.5 stroke) 20px graphite ticks; 20px checkboxes outlined 2px in Registry Green (filled green when ticked) with graphite labels and underlined links; then the quiet Proceed to payment button until both boxes are ticked.

**Lapsed plan card.** One centred card (24px padding): a 16px Roboto 700 title, a 14px Body Graphite line with the date in primary 600, then three equal boxes, white with a 1px Registry Green border and 6px radius, centred 14px text under a 600 title, then the primary "Choose a plan" button. No tints or warning fills on the boxes; the bold deletion date carries the urgency. Boxes stack under 760px.

### Toasts
Navy (background-system) bars, 10px radius, 13px chrome text, Pop shadow, bottom-centre, max 440px.

## Do's and Don'ts

### Do:
- **Do** take every colour from the `--color-*` tokens generated from the AsiaVerify Colour Tokens sheet, and test both themes.
- **Do** keep the shell's navy gradient (navy-700 to navy-900 at 55% to navy-950) and chrome tokens unchanged in dark mode.
- **Do** set money, credits and date columns in tabular numerals, with prices in Open Sans 700.
- **Do** separate sections inside a card with a 1px Hairline and 20px spacing before adding another card.
- **Do** pair every Pale Ledger Tint surface with a Mint Hairline edge.
- **Do** run multi-step flows inside one dialog that reshapes (440/560/880px) instead of opening a second modal.
- **Do** honour `prefers-reduced-motion`: the build collapses all animation and transition to 1ms.

### Don't:
- **Don't** use Chrome Signal Green (#2fbf87) on the working floor, or Registry Green on the navy chrome.
- **Don't** fill large surfaces with saturated green; tints are for state and recommendation, solid green is for pressable controls.
- **Don't** introduce shadows heavier than Card on resting content; Pop and Dialog are for floating layers only.
- **Don't** set body, UI text or figures in Roboto; it is reserved for headings.
- **Don't** put tracked uppercase labels above headings; the only uppercase in the system is the comparison table's row-group header.
