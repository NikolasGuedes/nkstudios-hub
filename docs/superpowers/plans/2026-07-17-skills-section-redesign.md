# Skills Section Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Skills section's WebGL shader background with the section's existing flat solid-blue background, and replace the single-row marquee with a two-layer marquee (huge translucent background layer + normal-size opaque foreground layer, scrolling in opposite directions), matching `public/images/previews/SKILLS_novo.png`.

**Architecture:** All changes are contained in `src/components/SkillsMarquee.jsx`. Remove the `ShaderBackground` import/usage (the file itself stays untouched — the Hero still uses it). Add a second `renderItem` function for the giant background layer, render two absolutely-positioned, centered `LogoLoop` instances (background layer first in DOM so it paints below the foreground layer — no explicit z-index needed between them), both wrapped in the existing category-switch fade container so they cross-fade together as one group.

**Tech Stack:** React (client-only Astro island, unchanged), Tailwind v4 utility classes, the existing `LogoLoop` component (unmodified).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-17-skills-section-redesign.md`.
- No more `ShaderBackground`/WebGL canvas in the Skills section. The section's existing `bg-[var(--Azul)]` (already set on `SkillsSection.astro`'s `<section>`) becomes the only background.
- Do NOT modify `ShaderBackground.tsx`, `SkillsViewport.tsx`, `LogoLoop.jsx`, or `LogoLoop.css`.
- Both marquee layers render the same `activeCategory.items` — only scale/opacity/direction differ.
- Background layer: huge font (`clamp(12rem, 46vh, 34rem)`), `text-white/50`, `direction="left"`.
- Foreground layer: existing scale (`clamp(3.5rem, 9vw, 9rem)`), full-opacity `text-[var(--Branco)]`, `direction="right"`.
- Category button order/default unchanged: `WEB DEVELOPER` (first, active by default), `GAME DEVELOPER`, `UI/UX DESIGNER`.
- The existing crossfade-on-category-switch (`CATEGORY_FADE_MS = 220`, `isCategoryFading` state) wraps both layers as a single group — one fade, not two independent fades.
- The existing `IntersectionObserver` visibility gating (`rootMargin: '80px 0px'`, mount/unmount both `LogoLoop`s together) is kept as-is.
- The background (huge, translucent) layer is purely decorative — mark its wrapper `aria-hidden="true"` so screen readers only announce the foreground layer's `ariaLabel`, avoiding double-announcement of the same content (this is the same a11y fix already applied once in this file's history).
- No test runner exists in this project. Verification is `npm run build` (0 errors) plus grepping the built JS output to confirm the `ShaderBackground`/`@shadergradient` code no longer appears in `SkillsMarquee`'s own bundle chunk.
- Per established workflow in this session: **do not run `git commit`** unless explicitly asked — leave changes in the working tree for the user to review/commit.

---

### Task 1: Rewrite `SkillsMarquee.jsx` — remove shader, add two-layer marquee

**Files:**
- Modify: `src/components/SkillsMarquee.jsx` (full rewrite of the render function and item renderers; state/effects/handlers for visibility and category-switch fade are unchanged from the current file)

**Interfaces:**
- Consumes: default export `LogoLoop` from `./LogoLoop.jsx` (props: `logos`, `direction`, `speed`, `gap`, `pauseOnHover`, `renderItem`, `ariaLabel` — all already used this way in the current file). `__`/`useLocale` from `../lib/i18n`. `useReducedMotion` from `motion/react`.
- Produces: default export `SkillsMarquee` (no props), unchanged — still mounted from `SkillsSection.astro` as `<SkillsMarquee client:only="react" />` (no changes needed there).

- [ ] **Step 1: Replace the full contents of `src/components/SkillsMarquee.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import LogoLoop from './LogoLoop.jsx';
import { __, useLocale } from '../lib/i18n';

const CATEGORIES = [
  {
    id: 'web',
    labelKey: 'WEB DEVELOPER',
    items: ['VUE.JS', 'REACT.JS', 'REACT THREE FIBER', 'PHP', 'LARAVEL', 'MOTION', 'TAILWIND', 'ASTRO']
  },
  { id: 'game', labelKey: 'GAME DEVELOPER', items: ['BLENDER', 'UNITY', 'C#'] },
  { id: 'design', labelKey: 'UI/UX DESIGNER', items: ['FIGMA', 'SPLINE'] }
];

function renderBackgroundItem(item) {
  return (
    <span className="flex items-center gap-10 text-[clamp(12rem,46vh,34rem)] font-extrabold uppercase leading-none text-white/50">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}

function renderForegroundItem(item) {
  return (
    <span className="flex items-center gap-8 text-[clamp(3.5rem,9vw,9rem)] font-extrabold uppercase leading-none text-[var(--Branco)]">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}

const CATEGORY_FADE_MS = 220;

export default function SkillsMarquee() {
  useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('web');
  const [isCategoryFading, setIsCategoryFading] = useState(false);

  const handleSelectCategory = id => {
    if (id === activeCategoryId) return;

    window.clearTimeout(fadeTimeoutRef.current);

    if (reduceMotion) {
      setActiveCategoryId(id);
      return;
    }

    setIsCategoryFading(true);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setActiveCategoryId(id);
      setIsCategoryFading(false);
    }, CATEGORY_FADE_MS);
  };

  useEffect(() => () => window.clearTimeout(fadeTimeoutRef.current), []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '80px 0px' }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const activeCategory = useMemo(
    () => CATEGORIES.find(category => category.id === activeCategoryId) ?? CATEGORIES[0],
    [activeCategoryId]
  );

  return (
    <div ref={sectionRef} className="relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-0 z-10 transition-opacity ease-out"
        style={{
          opacity: isCategoryFading ? 0 : 1,
          transitionDuration: reduceMotion ? '0ms' : `${CATEGORY_FADE_MS}ms`
        }}
      >
        {isVisible ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <LogoLoop
                logos={activeCategory.items}
                direction="left"
                speed={30}
                gap={64}
                pauseOnHover={false}
                renderItem={renderBackgroundItem}
                ariaLabel=""
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <LogoLoop
                logos={activeCategory.items}
                direction="right"
                speed={55}
                gap={48}
                pauseOnHover={false}
                renderItem={renderForegroundItem}
                ariaLabel={__(activeCategory.labelKey)}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-8 z-20 flex flex-wrap items-center justify-center gap-3 px-5 md:bottom-12">
        {CATEGORIES.map(category => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleSelectCategory(category.id)}
              className={[
                'rounded-full border px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition',
                isActive
                  ? 'border-[var(--Branco)] bg-[var(--Branco)] text-[color:var(--page-bg)]'
                  : 'border-[var(--Branco)] bg-transparent text-[var(--Branco)] hover:bg-[var(--surface-softer)]'
              ].join(' ')}
            >
              {__(category.labelKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`.

- [ ] **Step 3: Verify the shader is gone from this component's own bundle**

Run: `grep -l "shadergradient\|ShaderGradient" dist/_astro/SkillsMarquee.*.js 2>/dev/null; echo "exit: $?"`
Expected: no filename printed, `exit: 1` (grep found no match) — confirms `SkillsMarquee`'s compiled chunk no longer pulls in the shader library. (A separate `ShaderBackground.*.js` chunk will still exist in `dist/_astro/` — that's expected, since the Hero still uses it.)

- [ ] **Step 4: Verify the built page still contains the Skills section markers**

Run: `grep -o 'id="skills"' dist/index.html`
Expected: prints `id="skills"`.

- [ ] **Step 5: Do not commit**

Per Global Constraints, leave the change uncommitted in the working tree for the user to review.
