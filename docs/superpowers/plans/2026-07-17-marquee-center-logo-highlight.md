# Marquee Center Highlight + Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `LogoLoop`'s combined `dragToHighlight` prop into two independent opt-in props (`draggable` for drag-to-scrub, `highlightCenter` for a continuous, always-on nearest-to-center highlight that runs during normal autoplay too, not just while dragging), and add a background logo image (placeholder `vue.svg` for every item) behind the centered item's text in the Skills foreground marquee.

**Architecture:** `LogoLoop.jsx` gets a dedicated `requestAnimationFrame` loop that continuously recomputes the nearest-to-center item whenever `highlightCenter` is `true`, independent of the drag pointer handlers (which now only handle scrubbing, no highlight bookkeeping). `SkillsMarquee.jsx`'s foreground layer passes both new props and adds the background logo image to its `renderItem`.

**Tech Stack:** React (unchanged), Tailwind v4 utility classes.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-17-marquee-center-logo-highlight-design.md`.
- `draggable` and `highlightCenter` both default to `false` — every existing `LogoLoop` consumer that doesn't pass them (`AboutKpiLoop.jsx`, the Skills background layer) must render and behave exactly as before.
- `highlightCenter`'s highlight computation must be continuous (runs every frame while `true`), independent of whether the user is dragging — this is the core behavior change from the prior `dragToHighlight` prop, which only highlighted during an active drag.
- The pointer handlers no longer touch `highlightedKey` at all — only the dedicated `highlightCenter` loop does.
- The centered/highlighted item keeps its existing `scale-110` visual (unchanged), plus a new background logo image (`public/images/Skills_logos/vue.svg`, same file for every item — an explicit placeholder, not a real per-item logo mapping).
- The background logo must render **behind** the item's text (text stays fully visible on top), `pointer-events-none`, `aria-hidden="true"` (decorative).
- No changes to `AboutKpiLoop.jsx`, the Skills background layer's `renderBackgroundItem`/`<LogoLoop>` call, the category-switch fade, button order/default, or the `IntersectionObserver` visibility gating.
- No test runner exists in this project. Verification is `npm run build` (0 errors) plus a manual browser check (flag explicitly that an agent cannot verify the visual/interactive result without a browser).
- Per established workflow in this session: **do not run `git commit` or `git add`** — leave all changes uncommitted in the working tree.

---

### Task 1: Split `dragToHighlight` into `draggable` + `highlightCenter` in `LogoLoop.jsx`

**Files:**
- Modify: `src/components/LogoLoop.jsx`

**Interfaces:**
- Produces: two new props replacing `dragToHighlight` — `draggable` (boolean, default `false`) and `highlightCenter` (boolean, default `false`) — on the `LogoLoop` component. The `renderItem(item, key, { isHighlighted })` third-argument contract from the prior task is unchanged in shape, only in *when* `isHighlighted` becomes true (now continuous under `highlightCenter`, not drag-gated).
- Consumes: nothing new.

- [ ] **Step 1: Replace the `dragToHighlight` prop with `draggable` and `highlightCenter`**

In the `LogoLoop` component's prop destructuring, replace:

```js
    scaleOnHover = false,
    dragToHighlight = false,
    renderItem,
```

with:

```js
    scaleOnHover = false,
    draggable = false,
    highlightCenter = false,
    renderItem,
```

- [ ] **Step 2: Remove the now-unused `highlightRafRef` and its cleanup effect**

Remove this line from the refs block:

```js
    const highlightRafRef = useRef(null);
```

Remove this effect (it will be replaced by a new dedicated highlight loop in Step 3, placed in the same location):

```js
    useEffect(
      () => () => {
        if (highlightRafRef.current !== null) {
          cancelAnimationFrame(highlightRafRef.current);
        }
      },
      []
    );
```

- [ ] **Step 3: Add the dedicated `highlightCenter` animation loop**

In the same place the effect from Step 2 was removed from, add:

```js
    useEffect(() => {
      if (!highlightCenter) {
        setHighlightedKey(null);
        return;
      }

      let frameId = requestAnimationFrame(function tick() {
        updateHighlightedItem();
        frameId = requestAnimationFrame(tick);
      });

      return () => cancelAnimationFrame(frameId);
    }, [highlightCenter, updateHighlightedItem]);
```

- [ ] **Step 4: Simplify the pointer handlers — `draggable` for scrubbing only, no highlight bookkeeping**

Replace the three pointer handler `useCallback`s (currently named `handlePointerDown`, `handlePointerMove`, `handlePointerUp`) with:

```js
    const handlePointerDown = useCallback(
      event => {
        if (!draggable || seqWidth <= 0) return;

        isDraggingRef.current = true;
        dragStartXRef.current = event.clientX;
        dragStartOffsetRef.current = offsetRef.current;
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      [draggable, seqWidth]
    );

    const handlePointerMove = useCallback(
      event => {
        if (!draggable || !isDraggingRef.current || seqWidth <= 0) return;

        const delta = event.clientX - dragStartXRef.current;
        let nextOffset = dragStartOffsetRef.current - delta;
        nextOffset = ((nextOffset % seqWidth) + seqWidth) % seqWidth;
        offsetRef.current = nextOffset;

        const track = trackRef.current;
        if (track) {
          track.style.transform = `translate3d(${-nextOffset}px, 0, 0)`;
        }
      },
      [draggable, seqWidth]
    );

    const handlePointerUp = useCallback(
      event => {
        if (!draggable) return;

        isDraggingRef.current = false;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      [draggable]
    );
```

- [ ] **Step 5: Update `rootClassName` to key the `logoloop--draggable` modifier off `draggable`**

Replace:

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

with:

```js
    const rootClassName = useMemo(
      () =>
        [
          'logoloop',
          isVertical ? 'logoloop--vertical' : 'logoloop--horizontal',
          fadeOut && 'logoloop--fade',
          scaleOnHover && 'logoloop--scale-hover',
          draggable && 'logoloop--draggable',
          className
        ]
          .filter(Boolean)
          .join(' '),
      [isVertical, fadeOut, scaleOnHover, draggable, className]
    );
```

- [ ] **Step 6: Update `renderLogoItem` to gate ref collection and `isHighlighted` on `highlightCenter`**

Replace:

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

with:

```js
    const renderLogoItem = useCallback(
      (item, key) => {
        const setItemRef = element => {
          if (!highlightCenter) return;
          if (element) itemElementsRef.current.set(key, element);
          else itemElementsRef.current.delete(key);
        };

        if (renderItem) {
          return (
            <li className="logoloop__item" key={key} role="listitem" ref={setItemRef}>
              {renderItem(item, key, { isHighlighted: highlightCenter && key === highlightedKey })}
            </li>
          );
        }
```

And update that `useCallback`'s dependency array (currently `[renderItem, dragToHighlight, highlightedKey]`) to:

```js
      [renderItem, highlightCenter, highlightedKey]
```

- [ ] **Step 7: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`. No existing `LogoLoop` consumer passes `draggable` or `highlightCenter`, so their behavior is unaffected by this task alone (Task 2 is what wires the new props into the Skills foreground layer).

- [ ] **Step 8: Do not commit**

Per Global Constraints, leave the change uncommitted in the working tree.

---

### Task 2: Wire `draggable`/`highlightCenter` and the background logo into the Skills foreground marquee

**Files:**
- Modify: `src/components/SkillsMarquee.jsx`

**Interfaces:**
- Consumes: `draggable`/`highlightCenter` props and the `renderItem(item, key, { isHighlighted })` contract from `LogoLoop.jsx` (Task 1).

- [ ] **Step 1: Update `renderForegroundItem` to add the background logo image**

Replace the current `renderForegroundItem` function:

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

with:

```js
function renderForegroundItem(item, _key, { isHighlighted } = {}) {
  return (
    <span
      className={[
        'relative flex items-center gap-8 text-[clamp(3.5rem,100vh,10rem)] font-extrabold uppercase leading-none text-[var(--Branco)] transition-transform duration-150 ease-out',
        isHighlighted ? 'scale-110' : 'scale-100'
      ].join(' ')}
    >
      {isHighlighted ? (
        <img
          src="/images/Skills_logos/vue.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[1.4em] w-auto -translate-x-1/2 -translate-y-1/2 opacity-60"
        />
      ) : null}
      <span className="relative z-10">{item}</span>
      <span aria-hidden="true" className="relative z-10">-</span>
    </span>
  );
}
```

- [ ] **Step 2: Replace `dragToHighlight` with `draggable` and `highlightCenter` on the foreground `LogoLoop` call**

Replace:

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

with:

```jsx
            <div className="absolute inset-0 flex items-center justify-center">
              <LogoLoop
                logos={activeCategory.items}
                direction="right"
                speed={55}
                gap={48}
                pauseOnHover={false}
                draggable
                highlightCenter
                renderItem={renderForegroundItem}
                ariaLabel={__(activeCategory.labelKey)}
              />
            </div>
```

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`.

- [ ] **Step 4: Manual browser verification (required — cannot be automated in this environment)**

No browser automation tool is available in this environment. Run `npm run dev`, open the Skills section, and confirm:
- Without touching anything, as the foreground marquee auto-scrolls, whichever word is nearest the horizontal center is scaled up and shows the Vue logo faintly behind its text — and this keeps updating continuously as new words scroll through center, with no dragging involved.
- Clicking and dragging the foreground marquee still pauses autoplay and follows the pointer 1:1 as before; the centered word (now possibly different from wherever the drag lands) still shows the scale + logo treatment while dragging.
- Releasing resumes normal auto-scroll speed with no snap/flick, and the continuous center-highlight keeps working during autoplay afterward.
- The background (huge, translucent) marquee layer is unaffected throughout.
- The About section's KPI loop (`AboutKpiLoop.jsx`) still behaves exactly as before (no highlight, not draggable).

- [ ] **Step 5: Do not commit**

Per Global Constraints, leave the change uncommitted in the working tree.
