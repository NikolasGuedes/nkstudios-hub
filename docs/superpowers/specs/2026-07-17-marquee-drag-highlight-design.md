# Marquee Drag-to-Highlight — Design Spec

Date: 2026-07-17

## Goal

Let the user click-and-drag the Skills section's foreground marquee (the readable, normal-size text layer — `VUE.JS`, `REACT.JS`, etc.) to manually scrub its position, pausing the autoplay while held and visually highlighting (scaling up) whichever item ends up nearest the horizontal center of the section. Releasing resumes normal autoplay from wherever the drag left it, with no added inertia/momentum.

The Skills background layer (huge, translucent, `aria-hidden`) and the About section's KPI `LogoLoop` are **not** affected — this is opt-in per `LogoLoop` instance.

## Why extend `LogoLoop` itself

`LogoLoop.jsx` (`src/components/LogoLoop.jsx`) is shared by three call sites today: the Skills foreground layer, the Skills background layer, and the About section's KPI loop (`AboutKpiLoop.jsx`). Rather than forking a parallel drag-capable carousel just for one layer (duplicating the copy/measurement/animation logic that already exists), this adds an **opt-in** prop so the drag behavior is available to any future consumer too, while every existing usage (which doesn't pass the new prop) keeps behaving exactly as it does today.

## `LogoLoop.jsx` API changes

- New prop: `dragToHighlight` (boolean, default `false`). When `false`/omitted, `LogoLoop`'s rendered output, DOM structure, and behavior are unchanged from today — this is purely additive.
- `renderItem` consumers now optionally receive a third argument: `renderItem(item, key, { isHighlighted })`. Existing two-argument consumers (`AboutKpiLoop.jsx`'s `renderKpiCard`, the Skills background layer's `renderBackgroundItem`) are unaffected — JS simply ignores an extra argument they don't declare. `isHighlighted` is always `false` unless `dragToHighlight` is `true` and that specific rendered item is currently the closest one to center during an active drag.

## Drag mechanics (Pointer Events — covers mouse, touch, and pen uniformly)

1. **`pointerdown`** on the track (only wired up when `dragToHighlight` is `true`): capture the pointer (`setPointerCapture`), record the starting `clientX` and the current scroll offset, and mark dragging active. The existing `requestAnimationFrame` loop stops advancing the offset while dragging (it keeps running but skips the auto-advance step), so there's no fight between manual and automatic position updates.
2. **`pointermove`** while dragging: the track follows the pointer 1:1 (offset moves by the same pixel delta as the pointer, wrapped the same way the existing loop already wraps for seamless looping). Once per animation frame (throttled via `requestAnimationFrame`, not on every raw move event), measure every rendered item's element against the container's horizontal center and update which one is nearest — only re-rendering when the nearest item actually changes.
3. **`pointerup` / `pointercancel`**: release the pointer capture, clear the highlighted item, and let the existing animation loop resume easing toward its normal auto-scroll speed from the exact position the drag left it — no added flick/momentum physics.

**Measuring "nearest to center":** each rendered `<li>` gets a ref (only collected when `dragToHighlight` is `true`, so non-drag usages pay zero extra cost) keyed the same way the existing `copyIndex-itemIndex` render keys already work. During drag, compare each ref's `getBoundingClientRect()` center-x against the container's center-x; the minimum-distance one becomes `highlightedKey`, which flows into that specific item's `renderItem(item, key, { isHighlighted: key === highlightedKey })` call.

**Touch:** `touch-action: pan-y` is added to the track only when `dragToHighlight` is enabled, so a horizontal drag on the marquee doesn't fight the page's vertical scroll on mobile. `LogoLoop.css` already sets `user-select: none` on the track, which continues to prevent text-selection during drag.

**Cursor:** `cursor: grab` while idle, `cursor: grabbing` while actively dragging — applied via a new modifier class (`logoloop--draggable`) added to the root only when `dragToHighlight` is `true`, so it doesn't affect any other instance's CSS.

## Visual highlight style

Only a scale change — **no color change** (confirmed): the highlighted item's rendered `<span>` gets `scale-110` (via a Tailwind class toggled by the `isHighlighted` flag passed into `renderForegroundItem`) with a short CSS transition (`transition-transform duration-150`) so the scale-up/scale-down reads as a smooth pop rather than a snap.

## `SkillsMarquee.jsx` changes

- The foreground `<LogoLoop>` (the one currently using `renderForegroundItem`, `direction="right"`) gets `dragToHighlight={true}`.
- `renderForegroundItem(item, key, { isHighlighted } = {})` is updated to add `scale-110` (plus the transition classes) to its wrapper `<span>` when `isHighlighted` is true, and the base (non-scaled) classes otherwise.
- The background `<LogoLoop>` (`renderBackgroundItem`, `aria-hidden`, `direction="left"`) is **not** changed — it keeps auto-scrolling regardless of what the user does with the foreground layer, and doesn't receive `dragToHighlight`.
- No changes to the category buttons, the category-switch fade, or the `IntersectionObserver` visibility gating — all untouched.

## Out of scope

- No inertia/momentum/"flick" physics on release — velocity returns to the existing steady auto-scroll speed from wherever the drag ended.
- No color change on the highlighted item — scale only, per explicit confirmation.
- No changes to `AboutKpiLoop.jsx`'s usage of `LogoLoop` or to the Skills background layer — `dragToHighlight` stays unset (`false`) there, so their behavior is unchanged.
- No changes to `LogoLoop.jsx`'s existing props (`speed`, `direction`, `pauseOnHover`, `hoverSpeed`, `fadeOut`, `scaleOnHover`, etc.) — all additive, nothing removed or renamed.
