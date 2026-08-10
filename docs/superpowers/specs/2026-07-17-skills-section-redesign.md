# Skills Section Redesign — Design Spec

Date: 2026-07-17

## Goal

Replace the Skills section's WebGL shader-gradient background with a flat solid-color background, and replace the two-identical-rows marquee with a two-layer, two-scale marquee (one huge/translucent background layer, one normal-size/opaque foreground layer), matching the visual reference at `public/images/previews/SKILLS_novo.png`. This is a follow-up redesign after a real performance issue (main-thread stalls confirmed via frame-by-frame video analysis) was traced to the combination of the WebGL shader canvas + two same-scale marquee rows running simultaneously.

## Background

- `src/components/SkillsMarquee.jsx` stops importing/rendering `ShaderBackground`. The `ShaderBackground.tsx` component itself is **not** deleted or modified — `SkillsViewport.tsx` (Hero) still uses it.
- The section keeps its existing `bg-[var(--skill-blue)]` fallback (already set on `SkillsSection.astro`'s `<section>`), which becomes the only background — no canvas, no WebGL context in this section.
- This removes the primary GPU/CPU cost driver identified during the prior debugging pass (a live WebGL canvas running concurrently with animated marquee text).

## Two-layer marquee

Both layers render the **same** `activeCategory.items` list — only scale, opacity, and scroll direction differ:

- **Background layer (large):** font size scales to nearly the section's height (e.g. `clamp(12rem, 46vh, 34rem)`, exact clamp values tunable during implementation to visually match the reference), `text-white/50` (50% opacity white on the solid blue background, producing the light-blue look in the reference), `direction="left"`, lower stacking position.
- **Foreground layer (normal):** similar scale to the current single-row implementation (`clamp(3.5rem, 9vw, 9rem)` range), full-opacity white text, horizontally and vertically centered, `direction="right"`, higher stacking position (rendered on top of the background layer).
- Both layers use the existing `renderMarqueeItem`-style rendering (item text + a `-` separator), just parameterized by font-size/opacity per layer.

## Category switching

- Both layers are driven by the same `activeCategoryId` state and switch together.
- The existing crossfade-on-switch behavor is kept: a single opacity transition (already implemented, `CATEGORY_FADE_MS = 220`) now wraps both layers together (one fade for the whole two-layer group, not two independent fades).
- Category button order and default stay as currently implemented: **WEB DEVELOPER** first and active by default, then **GAME DEVELOPER**, then **UI/UX DESIGNER** — the new preview image shows a different active state (GAME DEVELOPER) but this does not change the established order/default, per explicit confirmation.

## Performance & visibility gating

- The existing `IntersectionObserver`-based `isVisible` gating is kept: both marquee layers mount only while the section is within `rootMargin: '80px 0px'` of the viewport, and unmount (stopping their `requestAnimationFrame` loops) when scrolled away — same pattern as before, now guarding two layers instead of one.
- Removing the WebGL canvas is expected to leave meaningfully more frame budget for the two text layers than the previous shader+2-equal-rows configuration that was confirmed (via frame-by-frame video analysis) to stall the main thread for ~250-300ms during category switches.
- The background layer's giant font size means very few copies are needed to fill the container width (each item is extremely wide on screen), so its `LogoLoop` copy count/DOM node count should be small despite the large visual footprint.

## Out of scope

- No changes to `ShaderBackground.tsx` or `SkillsViewport.tsx` (Hero) — this redesign is scoped to `SkillsMarquee.jsx` only.
- No changes to category content/order (`WEB DEVELOPER`/`GAME DEVELOPER`/`UI/UX DESIGNER` labels and their tech-name lists) — unchanged from the current implementation.
- No changes to `LogoLoop.jsx`/`LogoLoop.css`.
- No new i18n keys needed (all existing keys/labels are reused as-is).
