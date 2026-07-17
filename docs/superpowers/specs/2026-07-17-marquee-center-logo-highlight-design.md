# Marquee Center Highlight + Logo — Design Spec

Date: 2026-07-17

## Goal

Decouple the marquee's scale-up highlight from dragging — it becomes a continuous, always-on property of whichever item is nearest the horizontal center of the Skills foreground marquee (during normal autoplay, not just while the user is dragging). Also add a background logo image behind the centered item's text (a placeholder logo — `vue.svg` — used for every item for now, real per-item logos to follow later).

## `LogoLoop.jsx` changes

The prop added in the prior task, `dragToHighlight`, conflated two separate concerns. Split it into two independent, opt-in props:

- **`draggable`** (boolean, default `false`) — pointer-based drag-to-scrub: pause auto-scroll while held, follow the pointer 1:1, resume auto-scroll speed on release. Same mechanics as before, minus the highlight bookkeeping (moved out, see below).
- **`highlightCenter`** (boolean, default `false`) — a dedicated, independent `requestAnimationFrame` loop (runs whenever this is `true`, regardless of `draggable` or whether the user is currently dragging) that continuously measures every rendered item against the container's horizontal center and marks the nearest one via `renderItem(item, key, { isHighlighted })`. This runs during normal autoplay too, not just while dragging.

Both flags default to `false` — existing consumers (`AboutKpiLoop.jsx`, the Skills background layer) are unaffected. The Skills foreground layer passes both `draggable` and `highlightCenter`.

Implementation notes:
- The pointer handlers (`handlePointerDown`/`handlePointerMove`/`handlePointerUp`) no longer call `updateHighlightedItem()` or clear `highlightedKey` themselves — the dedicated `highlightCenter` loop already covers this continuously, drag or no drag.
- The per-item ref collection (`itemElementsRef`) is now gated on `highlightCenter` instead of the old combined flag (only collected when highlighting is actually enabled, to avoid unnecessary ref churn when only `draggable` is used without `highlightCenter`, or vice versa).
- `logoloop--draggable` CSS modifier class stays tied to the `draggable` prop specifically (cursor/touch-action only matter for the drag affordance, not for highlighting).

## Visual: scale + background logo on the centered item

- The centered item keeps the existing `scale-110` treatment (unchanged from before) — this is now just always-applied to whichever item is centered, rather than only while dragging.
- **New:** when an item is the centered/highlighted one, a background logo image renders behind its text (text stays fully visible on top, per explicit confirmation) — centered within the item, reduced opacity so it reads as a background element rather than competing with the text, `pointer-events-none` and `aria-hidden` (decorative, the text already carries the accessible label).
- **Placeholder scope:** every item uses the same logo file, `public/images/Skills_logos/vue.svg`, regardless of which tech name it actually is — explicitly a test/placeholder per the user's instruction. Wiring up a real per-item logo (e.g. a `labelKey → logo path` lookup, with a logo file per tech name) is a separate, future task, not part of this change.

## `SkillsMarquee.jsx` changes

- The foreground `<LogoLoop>` call gets `draggable` and `highlightCenter` (replacing the old single `dragToHighlight`).
- `renderForegroundItem(item, key, { isHighlighted })` adds the background `<img src="/images/Skills_logos/vue.svg" .../>` behind the text when `isHighlighted` is true; keeps the existing `scale-110`/`scale-100` toggle.
- The background marquee layer (`renderBackgroundItem`) is untouched.

## Out of scope

- No real per-item logo mapping yet — `vue.svg` is used for every item as an explicit placeholder/test.
- No changes to the category-switch fade, button order/default, or `IntersectionObserver` visibility gating.
- No inertia/momentum on drag release (unchanged from the prior task).
