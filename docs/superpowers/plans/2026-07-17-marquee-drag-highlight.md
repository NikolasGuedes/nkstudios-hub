# Marquee Drag-to-Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user click-and-drag the Skills section's foreground marquee text to manually scrub its position (pausing autoplay while held), highlighting (scale only, no color change) whichever rendered item ends up nearest the horizontal center, and resume normal autoplay on release with no added momentum.

**Architecture:** Extend the shared `LogoLoop.jsx` with an opt-in `dragToHighlight` prop (default `false`, fully backward-compatible with every existing usage) that wires up Pointer Events on the track, pauses the existing `requestAnimationFrame` auto-scroll while dragging, and tracks which rendered `<li>` is nearest the container's center. `renderItem` callers optionally receive a third argument `{ isHighlighted }`. Then wire `dragToHighlight` onto the Skills section's foreground marquee layer only.

**Tech Stack:** React (Pointer Events API — unifies mouse/touch/pen), Tailwind v4 utility classes, no new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-17-marquee-drag-highlight-design.md`.
- `dragToHighlight` defaults to `false` — every existing `LogoLoop` consumer (`AboutKpiLoop.jsx`, the Skills background layer) must render and behave byte-for-byte the same as before this change.
- `renderItem(item, key, { isHighlighted })` — the third argument is new and optional; existing two-argument `renderItem` implementations must keep working unmodified (JS ignores extra call arguments a function doesn't declare).
- Drag behavior: 1:1 pointer-to-offset tracking, pause auto-scroll while dragging, highlight the item nearest the container's horizontal center, clear highlight and resume normal auto-scroll speed on release — **no added inertia/momentum** from the drag itself.
- Highlight visual: **scale only** (`scale-110`), **no color change** — confirmed explicitly with the user.
- Only the Skills foreground marquee layer (`renderForegroundItem`, `direction="right"`) gets `dragToHighlight={true}`. The Skills background layer (`renderBackgroundItem`, `aria-hidden`) and `AboutKpiLoop.jsx` are not touched.
- Do not rename, remove, or change the behavior of any existing `LogoLoop` prop (`speed`, `direction`, `pauseOnHover`, `hoverSpeed`, `fadeOut`, `fadeOutColor`, `scaleOnHover`, `width`, `logoHeight`, `gap`, `className`, `style`, `ariaLabel`).
- No test runner exists in this project. Verification is `npm run build` (0 errors) plus a manual browser check (this plan cannot be fully verified by an agent without a browser — flag that explicitly rather than claiming success).
- Per established workflow in this session: **do not run `git commit` or `git add`** — leave all changes uncommitted in the working tree for the user to review/commit themselves.

---

### Task 1: Add `dragToHighlight` support to `LogoLoop.jsx`

**Files:**
- Modify: `src/components/LogoLoop.jsx`
- Modify: `src/components/LogoLoop.css`

**Interfaces:**
- Produces: new prop `dragToHighlight` (boolean, default `false`) on the `LogoLoop` component. New optional third argument to `renderItem`: `renderItem(item, key, { isHighlighted })`. New CSS modifier class `logoloop--draggable` applied to the root element only when `dragToHighlight` is `true`.
- Consumes: nothing new — this task only touches the shared component and its stylesheet.

- [ ] **Step 1: Update `useAnimationLoop` to accept an externally-owned offset ref and a dragging ref**

In `src/components/LogoLoop.jsx`, replace the `useAnimationLoop` function (currently declared with its own internal `offsetRef`) with this version, which takes `offsetRef` and `isDraggingRef` as parameters instead of creating them internally, and skips the auto-advance step while dragging:

```js
const useAnimationLoop = (
  trackRef,
  targetVelocity,
  seqWidth,
  seqHeight,
  isHovered,
  hoverSpeed,
  isVertical,
  offsetRef,
  isDraggingRef
) => {
  const rafRef = useRef(null);
  const lastTimestampRef = useRef(null);
  const velocityRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const seqSize = isVertical ? seqHeight : seqWidth;

    if (seqSize > 0) {
      offsetRef.current = ((offsetRef.current % seqSize) + seqSize) % seqSize;
      const transformValue = isVertical
        ? `translate3d(0, ${-offsetRef.current}px, 0)`
        : `translate3d(${-offsetRef.current}px, 0, 0)`;
      track.style.transform = transformValue;
    }

    const animate = timestamp => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const deltaTime = Math.max(0, timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (isDraggingRef.current) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const target = isHovered && hoverSpeed !== undefined ? hoverSpeed : targetVelocity;

      const easingFactor = 1 - Math.exp(-deltaTime / ANIMATION_CONFIG.SMOOTH_TAU);
      velocityRef.current += (target - velocityRef.current) * easingFactor;

      if (seqSize > 0) {
        let nextOffset = offsetRef.current + velocityRef.current * deltaTime;
        nextOffset = ((nextOffset % seqSize) + seqSize) % seqSize;
        offsetRef.current = nextOffset;

        const transformValue = isVertical
          ? `translate3d(0, ${-offsetRef.current}px, 0)`
          : `translate3d(${-offsetRef.current}px, 0, 0)`;
        track.style.transform = transformValue;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [targetVelocity, seqWidth, seqHeight, isHovered, hoverSpeed, isVertical, trackRef, offsetRef, isDraggingRef]);
};
```

- [ ] **Step 2: Add the `dragToHighlight` prop and new refs/state to the `LogoLoop` component**

Find the component's prop destructuring (currently `logos, speed = 120, direction = 'left', width = '100%', logoHeight = 28, gap = 32, pauseOnHover, hoverSpeed, fadeOut = false, fadeOutColor, scaleOnHover = false, renderItem, ariaLabel = 'Partner logos', className, style`) and add `dragToHighlight = false` to it:

```js
export const LogoLoop = memo(
  ({
    logos,
    speed = 120,
    direction = 'left',
    width = '100%',
    logoHeight = 28,
    gap = 32,
    pauseOnHover,
    hoverSpeed,
    fadeOut = false,
    fadeOutColor,
    scaleOnHover = false,
    dragToHighlight = false,
    renderItem,
    ariaLabel = 'Partner logos',
    className,
    style
  }) => {
```

Right after the existing `const containerRef = useRef(null);`, `const trackRef = useRef(null);`, `const seqRef = useRef(null);` lines, add:

```js
    const offsetRef = useRef(0);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const dragStartOffsetRef = useRef(0);
    const itemElementsRef = useRef(new Map());
    const highlightRafRef = useRef(null);
```

Right after the existing `const [isHovered, setIsHovered] = useState(false);` line, add:

```js
    const [highlightedKey, setHighlightedKey] = useState(null);
```

- [ ] **Step 3: Update the `useAnimationLoop` call site to pass the new refs**

Replace:

```js
    useAnimationLoop(trackRef, targetVelocity, seqWidth, seqHeight, isHovered, effectiveHoverSpeed, isVertical);
```

with:

```js
    useAnimationLoop(
      trackRef,
      targetVelocity,
      seqWidth,
      seqHeight,
      isHovered,
      effectiveHoverSpeed,
      isVertical,
      offsetRef,
      isDraggingRef
    );
```

- [ ] **Step 4: Add the highlight-computation callback and pointer event handlers**

Right after the `useAnimationLoop` call site from Step 3, add:

```js
    const updateHighlightedItem = useCallback(() => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;

      let closestKey = null;
      let closestDistance = Infinity;

      itemElementsRef.current.forEach((element, key) => {
        const rect = element.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(itemCenterX - containerCenterX);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestKey = key;
        }
      });

      setHighlightedKey(previous => (previous === closestKey ? previous : closestKey));
    }, []);

    const handlePointerDown = useCallback(
      event => {
        if (!dragToHighlight || seqWidth <= 0) return;

        isDraggingRef.current = true;
        dragStartXRef.current = event.clientX;
        dragStartOffsetRef.current = offsetRef.current;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateHighlightedItem();
      },
      [dragToHighlight, seqWidth, updateHighlightedItem]
    );

    const handlePointerMove = useCallback(
      event => {
        if (!dragToHighlight || !isDraggingRef.current || seqWidth <= 0) return;

        const delta = event.clientX - dragStartXRef.current;
        let nextOffset = dragStartOffsetRef.current - delta;
        nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = nextOffset;

        const track = trackRef.current;
        if (track) {
          track.style.transform = `translate3d(${-nextOffset}px, 0, 0)`;
        }

        if (highlightRafRef.current === null) {
          highlightRafRef.current = requestAnimationFrame(() => {
            highlightRafRef.current = null;
            updateHighlightedItem();
          });
        }
      },
      [dragToHighlight, seqWidth, updateHighlightedItem]
    );

    const handlePointerUp = useCallback(
      event => {
        if (!dragToHighlight) return;

        isDraggingRef.current = false;
        setHighlightedKey(null);
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      [dragToHighlight]
    );

    useEffect(
      () => () => {
        if (highlightRafRef.current !== null) {
          cancelAnimationFrame(highlightRafRef.current);
        }
      },
      []
    );
```

- [ ] **Step 5: Update `rootClassName` to add the `logoloop--draggable` modifier**

Replace:

```js
    const rootClassName = useMemo(
      () =>
        [
          'logoloop',
          isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
          fadeOut && 'logoloop--fade',
          scaleOnHover && 'logoloop--scale-hover',
          className
        ]
          .filter(Boolean)
          .join(' '),
      [isVertical, fadeOut, scaleOnHover, className]
    );
```

with:

```js
    const rootClassName = useMemo(
      () =>
        [
          'logoloop',
          isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
          fadeOut && 'logoloop--fade',
          scaleOnHover && 'logoloop--scale-hover',
          dragToHighlight && 'logoloop--draggable',
          className
        ]
          .filter(Boolean)
          .join(' '),
      [isVertical, fadeOut, scaleOnHover, dragToHighlight, className]
    );
```

- [ ] **Step 6: Update `renderLogoItem` to collect per-item refs and pass `isHighlighted`**

Replace the `renderItem` branch inside `renderLogoItem` (currently):

```js
    const renderLogoItem = useCallback(
      (item, key) => {
        if (renderItem) {
          return (
            <li className="logoloop__item" key={key} role="listitem">
              {renderItem(item, key)}
            </li>
          );
        }
```

with:

```js
    const renderLogoItem = useCallback(
      (item, key) => {
        const setItemRef = element => {
          if (!dragToHighlight) return;
          if (element) itemElementsRef.current.set(key, element);
          else itemElementsRef.current.delete(key);
        };

        if (renderItem) {
          return (
            <li className="logoloop__item" key={key} role="listitem" ref={setItemRef}>
              {renderItem(item, key, { isHighlighted: dragToHighlight && key === highlightedKey })}
            </li>
          );
        }
```

The `useCallback` dependency array for `renderLogoItem` (currently `[renderItem]`) must become:

```js
      [renderItem, dragToHighlight, highlightedKey]
```

- [ ] **Step 7: Wire the pointer handlers onto the track element**

Replace the returned track `<div>` (currently):

```jsx
        <div className="logoloop__track" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {logoLists}
        </div>
```

with:

```jsx
        <div
          className="logoloop__track"
          ref={trackRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {logoLists}
        </div>
```

- [ ] **Step 8: Add the draggable cursor styles to `LogoLoop.css`**

Append to `src/components/LogoLoop.css` (anywhere after the existing `.logoloop--scale-hover` rules, e.g. right after the `.logoloop--scale-hover .logoloop__node` block):

```css
.logoloop--draggable .logoloop__track {
  cursor: grab;
  touch-action: pan-y;
}

.logoloop--draggable .logoloop__track:active {
  cursor: grabbing;
}
```

- [ ] **Step 9: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`. No existing `LogoLoop` consumer (`AboutKpiLoop.jsx`, the Skills background layer) passes `dragToHighlight`, so their rendered output should be identical to before this task — this task does not change their files, only the shared component in a backward-compatible way.

- [ ] **Step 10: Do not commit**

Per Global Constraints, leave the change uncommitted in the working tree.

---

### Task 2: Enable drag-to-highlight on the Skills foreground marquee

**Files:**
- Modify: `src/components/SkillsMarquee.jsx`

**Interfaces:**
- Consumes: `dragToHighlight` prop and the third `renderItem` argument `{ isHighlighted }` from `LogoLoop.jsx` (Task 1).

- [ ] **Step 1: Update `renderForegroundItem` to accept and apply the highlight flag**

Replace the current `renderForegroundItem` function:

```js
function renderForegroundItem(item) {
  return (
    <span className="flex items-center gap-8 text-[clamp(3.5rem,100vh,10rem)] font-extrabold uppercase leading-none text-[var(--Branco)]">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}
```

with:

```js
function renderForegroundItem(item, _key, { isHighlighted } = {}) {
  return (
    <span
      className={[
        'flex items-center gap-8 text-[clamp(3.5rem,100vh,10rem)] font-extrabold uppercase leading-none text-[var(--Branco)] transition-transform duration-150 ease-out',
        isHighlighted ? 'scale-110' : 'scale-100'
      ].join(' ')}
    >
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}
```

- [ ] **Step 2: Enable `dragToHighlight` on the foreground `LogoLoop` only**

In the foreground layer's `<LogoLoop>` call (the one with `direction="right"` and `renderItem={renderForegroundItem}`), add `dragToHighlight` (the background layer's `<LogoLoop>` call, with `renderItem={renderBackgroundItem}`, is left untouched):

```jsx
            <div className="absolute inset-0 flex items-center justify-center">
              <LogoLoop
                logos={activeCategory.items}
                direction="right"
                speed={55}
                gap={48}
                pauseOnHover={false}
                dragToHighlight
                renderItem={renderForegroundItem}
                ariaLabel={__(activeCategory.labelKey)}
              />
            </div>
```

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`.

- [ ] **Step 4: Manual browser verification (required — cannot be automated in this environment)**

No browser automation tool is available in this environment, so this step must be performed by a human. Run `npm run dev`, open the Skills section, and confirm:
- Clicking and dragging the foreground (readable, right-scrolling) marquee text moves it 1:1 with the mouse and pauses the autoplay while held.
- Whichever word ends up nearest the horizontal center while dragging visibly scales up slightly (no color change) and shrinks back when another word becomes the closest one.
- Releasing the mouse resumes the normal auto-scroll speed from wherever the drag left off, with no visible flick/snap.
- The background (huge, translucent) marquee layer keeps scrolling on its own the entire time, unaffected by dragging the foreground layer.
- The About section's KPI loop (`AboutKpiLoop.jsx`) still behaves exactly as before (not draggable, no highlight) — confirms the opt-in prop didn't leak behavior into other `LogoLoop` usages.

- [ ] **Step 5: Do not commit**

Per Global Constraints, leave the change uncommitted in the working tree.
