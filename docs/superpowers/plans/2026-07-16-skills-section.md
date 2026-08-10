# Skills Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new full-viewport "Skills" section after the About section: the Hero's shader-gradient background (no 3D model) filling the whole section, two giant horizontal `LogoLoop` text marquees scrolling in opposite directions, and three category buttons that swap the marquee content between Web/Game/UI-UX tech lists.

**Architecture:** Extract the Hero's shader background into a shared `ShaderBackground.tsx` React component (used by both the existing Hero and the new section, zero visual change to the Hero). Build a new client-only React island `SkillsMarquee.jsx` that renders that shared background plus two `LogoLoop` rows and the category buttons, gated by the same `IntersectionObserver` visibility pattern already used elsewhere in this codebase (`SkillsViewport.tsx`, `AboutKpiLoop.jsx`) so its animations pause off-screen. Wrap it in a thin Astro section (`SkillsSection.astro`) and mount it after `AboutSection` on the page.

**Tech Stack:** Astro 5, React 19 (`client:only="react"`), Tailwind CSS v4 utility classes, `@shadergradient/react` (already a dependency), the existing `LogoLoop` component (`src/components/LogoLoop.jsx`, unmodified), the existing `src/lib/i18n.ts` translation system.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-16-skills-section-design.md`.
- Section root: `id="skills"`, `h-dvh`, `overflow-hidden`, no rounded corners (background fills edge-to-edge, unlike the Hero's rounded card).
- The Hero (`SkillsViewport.tsx`) must look and behave pixel-identical after the `ShaderBackground` extraction — this is a pure refactor, no visual/behavioral change.
- Two `LogoLoop` rows: row 1 `direction="left"`, row 2 `direction="right"` — opposite directions, same content per active category.
- Category content (exact strings, exact order):
  - `WEB DEVELOPER` (default active): `VUE.JS`, `REACT.JS`, `REACT THREE FIBER`, `PHP`, `LARAVEL`, `MOTION`, `TAILWIND`, `ASTRO`
  - `GAME DEVELOPER`: `BLENDER`, `UNITY`, `C#`
  - `UI/UX DESIGNER`: `FIGMA`, `SPLINE`
- Tech names are not translated (proper nouns). Category button labels ARE translated via the existing `__()`/locale-key convention (English key, `pt.json`/`es.json` provide translations).
- Both `LogoLoop` marquee rows and the shader background must pause/unmount when the section is out of the viewport (`IntersectionObserver`, same pattern as `SkillsViewport.tsx` and `AboutKpiLoop.jsx`) — do not reintroduce the multi-section scroll jank that was already fixed once.
- Do not modify `src/components/LogoLoop.jsx` or `src/components/LogoLoop.css`.
- No changes to `Header.astro` navigation.
- **Do NOT run `git commit` or `git add` in any task.** Per explicit user instruction, all changes stay uncommitted in the working tree — the user commits everything themselves at the end.
- No test runner exists in this project. Verification is `npm run build` (0 errors) plus grepping the built static output for server-rendered markers (`id="skills"`), since the marquee itself is a `client:only` island and won't appear in the static HTML.

---

### Task 1: Extract `ShaderBackground.tsx` and update the Hero to use it

**Files:**
- Create: `src/components/ShaderBackground.tsx`
- Modify: `src/components/SkillsViewport.tsx`

**Interfaces:**
- Produces: default export `ShaderBackground({ reduceMotion, isVisible }: { reduceMotion: boolean | null; isVisible: boolean })` — a React component rendering the shader canvas + two overlay divs as three sibling elements (no wrapping div; the caller's own `position: relative` container provides the positioning context). Consumed by `SkillsViewport.tsx` in this task, and by `SkillsMarquee.jsx` in Task 3.
- Consumes: nothing new — only the already-installed `@shadergradient/react` package.

- [ ] **Step 1: Create `src/components/ShaderBackground.tsx`**

```tsx
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';

const SHADER_COLORS = {
  shaderBlue: '#006FFF',
  shaderBlueSoft: '#0E70EB',
  shaderBlueStrong: '#005eeb',
} as const;

export default function ShaderBackground({
  reduceMotion,
  isVisible,
}: {
  reduceMotion: boolean | null;
  isVisible: boolean;
}) {
  return (
    <>
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion || !isVisible ? 'off' : 'on'}
            axesHelper="off"
            bgColor1="var(--page-bg)"
            bgColor2="var(--page-bg)"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={3.6}
            cPolarAngle={90}
            cameraZoom={1}
            color1={SHADER_COLORS.shaderBlue}
            color2={SHADER_COLORS.shaderBlueStrong}
            color3={SHADER_COLORS.shaderBlueSoft}
            control="props"
            destination="onCanvas"
            embedMode="off"
            envPreset="city"
            format="gif"
            fov={45}
            frameRate={10}
            gizmoHelper="hide"
            grain="off"
            lightType="3d"
            positionX={-1.4}
            positionY={0}
            positionZ={0}
            range="disabled"
            rangeEnd={40}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={10}
            rotationZ={50}
            shader="defaults"
            type="waterPlane"
            uAmplitude={1}
            uDensity={1.3}
            uFrequency={5.5}
            uSpeed={0.1}
            uStrength={4.8}
            uTime={0}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[var(--surface-blur)] backdrop-blur-[22px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_22%,rgba(18,90,255,0.035)_58%,rgba(8,56,201,0.1)_100%)]" />
    </>
  );
}
```

- [ ] **Step 2: Update `src/components/SkillsViewport.tsx` to use it**

Remove the `ShaderGradient, ShaderGradientCanvas` import (line 3) and replace it with an import of the new component:

```tsx
import { Float, Grid, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Eye, Grip, MousePointer2, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { __, useLocale } from '../lib/i18n';
import { CursorFollower } from './ui/cursor-follower';
import ShaderBackground from './ShaderBackground';
import type { Mesh } from 'three';
```

Remove the now-unused `shaderBlue`/`shaderBlueSoft`/`shaderBlueStrong` entries from `SCENE_COLORS` (they moved into `ShaderBackground.tsx`'s own `SHADER_COLORS`) — `SCENE_COLORS` becomes:

```tsx
const SCENE_COLORS = {
  directional: '#ffffff',
  emissive: '#8cc8ff',
  grid: '#d7e8ff',
  mesh: '#ffffff',
  point: '#006fff',
} as const;
```

Replace this block (the inline shader canvas + two overlay divs, currently right after the opening `<section>` tag):

```tsx
      <div className="absolute inset-0">
        <ShaderGradientCanvas
          className="h-full w-full"
          pixelDensity={1}
          pointerEvents="none"
          style={{ width: '100%', height: '100%' }}
        >
          <ShaderGradient
            animate={reduceMotion || !isViewportVisible ? 'off' : 'on'}
            axesHelper="off"
            bgColor1="var(--page-bg)"
            bgColor2="var(--page-bg)"
            brightness={1.2}
            cAzimuthAngle={180}
            cDistance={3.6}
            cPolarAngle={90}
            cameraZoom={1}
            color1={SCENE_COLORS.shaderBlue}
            color2={SCENE_COLORS.shaderBlueStrong}
            color3={SCENE_COLORS.shaderBlueSoft}
            control="props"
            destination="onCanvas"
            embedMode="off"
            envPreset="city"
            format="gif"
            fov={45}
            frameRate={10}
            gizmoHelper="hide"
            grain="off"
            lightType="3d"
            positionX={-1.4}
            positionY={0}
            positionZ={0}
            range="disabled"
            rangeEnd={40}
            rangeStart={0}
            reflection={0.1}
            rotationX={0}
            rotationY={10}
            rotationZ={50}
            shader="defaults"
            type="waterPlane"
            uAmplitude={1}
            uDensity={1.3}
            uFrequency={5.5}
            uSpeed={0.1}
            uStrength={4.8}
            uTime={0}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[var(--surface-blur)] backdrop-blur-[22px]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.012)_22%,rgba(18,90,255,0.035)_58%,rgba(8,56,201,0.1)_100%)]" />
```

with:

```tsx
      <ShaderBackground isVisible={isViewportVisible} reduceMotion={reduceMotion} />
```

The rest of `SkillsViewport.tsx` (the `Scene3D`/`CursorFollower`/tab buttons/details panel below it) is unchanged.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build completes with `0 errors`. No references to `ShaderGradient`/`ShaderGradientCanvas` should remain in `SkillsViewport.tsx` (confirm with `grep -n "ShaderGradient" src/components/SkillsViewport.tsx` — it should print nothing, since that identifier now only lives in `ShaderBackground.tsx`).

- [ ] **Step 4: Do not commit**

Per Global Constraints, leave the changes uncommitted in the working tree.

---

### Task 2: Add i18n keys for the category buttons

**Files:**
- Modify: `src/locales/pt.json`
- Modify: `src/locales/es.json`

**Interfaces:**
- Produces: English keys `"WEB DEVELOPER"`, `"GAME DEVELOPER"`, `"UI/UX DESIGNER"`, consumable via `__('WEB DEVELOPER')` etc. from Task 3 onward.

- [ ] **Step 1: Add the keys to `src/locales/pt.json`**

Add these entries right before the closing `}` (add a comma after the current last entry, `"Key achievements": "Principais conquistas"`):

```json
  "WEB DEVELOPER": "DESENVOLVEDOR WEB",
  "GAME DEVELOPER": "DESENVOLVEDOR DE JOGOS",
  "UI/UX DESIGNER": "DESIGNER UI/UX"
```

- [ ] **Step 2: Add the same keys (Spanish) to `src/locales/es.json`**

Add these entries right before the closing `}` (add a comma after the current last entry, `"Key achievements": "Logros principales"`):

```json
  "WEB DEVELOPER": "DESARROLLADOR WEB",
  "GAME DEVELOPER": "DESARROLLADOR DE JUEGOS",
  "UI/UX DESIGNER": "DISEÑADOR UI/UX"
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/pt.json','utf8')); JSON.parse(require('fs').readFileSync('src/locales/es.json','utf8')); console.log('OK')"`
Expected: `OK` printed, no errors.

- [ ] **Step 4: Do not commit**

Per Global Constraints, leave the changes uncommitted in the working tree.

---

### Task 3: Create `SkillsMarquee.jsx`

**Files:**
- Create: `src/components/SkillsMarquee.jsx`

**Interfaces:**
- Consumes:
  - Default export `ShaderBackground` from `./ShaderBackground` (Task 1) — props `{ reduceMotion, isVisible }`.
  - Default export `LogoLoop` from `./LogoLoop.jsx` — props used: `logos`, `direction`, `speed`, `gap`, `pauseOnHover`, `renderItem`, `ariaLabel`.
  - `__` and `useLocale` from `../lib/i18n`.
  - `useReducedMotion` from `motion/react` (already a project dependency, used the same way in `SkillsViewport.tsx`).
  - i18n keys from Task 2: `"WEB DEVELOPER"`, `"GAME DEVELOPER"`, `"UI/UX DESIGNER"`.
- Produces: default export `SkillsMarquee` (no props), consumed by `SkillsSection.astro` in Task 4 as `<SkillsMarquee client:only="react" />`.

- [ ] **Step 1: Write the component**

```jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import LogoLoop from './LogoLoop.jsx';
import ShaderBackground from './ShaderBackground';
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

function renderMarqueeItem(item) {
  return (
    <span className="flex items-center gap-6 text-[clamp(2.5rem,7vw,6rem)] font-extrabold uppercase leading-none text-[var(--text-primary)]">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}

export default function SkillsMarquee() {
  useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState('web');

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) setIsVisible(entry.isIntersecting);
      },
      { rootMargin: '200px 0px' }
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
      <ShaderBackground isVisible={isVisible} reduceMotion={reduceMotion} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
        {isVisible ? (
          <>
            <LogoLoop
              logos={activeCategory.items}
              direction="left"
              speed={55}
              gap={48}
              pauseOnHover={false}
              renderItem={renderMarqueeItem}
              ariaLabel={__(activeCategory.labelKey)}
            />
            <LogoLoop
              logos={activeCategory.items}
              direction="right"
              speed={55}
              gap={48}
              pauseOnHover={false}
              renderItem={renderMarqueeItem}
              ariaLabel={__(activeCategory.labelKey)}
            />
          </>
        ) : null}
      </div>

      <div className="absolute bottom-8 left-5 z-20 flex flex-wrap items-center gap-3 md:bottom-12 md:left-8">
        {CATEGORIES.map(category => {
          const isActive = category.id === activeCategoryId;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={[
                'rounded-full border px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition',
                isActive
                  ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[color:var(--page-bg)]'
                  : 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-softer)]'
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

- [ ] **Step 2: Verify the build**

Run: `npm run build`
Expected: build completes with `0 errors` (the component isn't mounted on any page yet — that's Task 5 — so this only confirms there's no syntax error in the file itself).

- [ ] **Step 3: Do not commit**

Per Global Constraints, leave the changes uncommitted in the working tree.

---

### Task 4: Create `SkillsSection.astro`

**Files:**
- Create: `src/components/SkillsSection.astro`

**Interfaces:**
- Consumes: default export `SkillsMarquee` from `./SkillsMarquee.jsx` (Task 3), mounted with `client:only="react"`.
- Produces: default export (Astro component) `SkillsSection`, consumed by `src/pages/index.astro` in Task 5.

- [ ] **Step 1: Write the component**

```astro
---
import SkillsMarquee from './SkillsMarquee.jsx';
---

<section id="skills" class="relative isolate h-dvh overflow-hidden bg-[var(--skill-blue)] text-[var(--text-primary)]">
  <SkillsMarquee client:only="react" />
</section>
```

- [ ] **Step 2: Do not commit**

Per Global Constraints, leave the changes uncommitted in the working tree.

---

### Task 5: Wire `SkillsSection` into the page and point "MY SKILLS" at it

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/AboutSection.astro`

**Interfaces:**
- Consumes: default export `SkillsSection` from `../components/SkillsSection.astro` (Task 4).

- [ ] **Step 1: Import and render `SkillsSection` after `AboutSection`**

```astro
---
import HeroSection from '../components/HeroSection.astro';
import AboutSection from '../components/AboutSection.astro';
import SkillsSection from '../components/SkillsSection.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="NK Studios Hub"
>
  <HeroSection />
  <AboutSection />
  <SkillsSection />
</BaseLayout>
```

- [ ] **Step 2: Point the "MY SKILLS" button at the new section**

In `src/components/AboutSection.astro`, find the second `<a>` (the "MY SKILLS" button) and change its `href` from `"#"` to `"#skills"`:

```astro
        <a
          href="#skills"
          data-i18n-key="MY SKILLS"
          class="rounded-full border border-[var(--text-primary)] px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:bg-[var(--surface-softer)]"
        >
          {__('MY SKILLS')}
        </a>
```

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors`.

- [ ] **Step 4: Verify the built output**

Run: `grep -o 'id="skills"' dist/index.html`
Expected: prints `id="skills"` — confirms the section landed in the static output. (The marquee text/buttons themselves are inside a `client:only` island and will NOT appear in the static HTML — that's expected, not a defect.)

Run: `grep -o 'href="#skills"' dist/index.html`
Expected: prints `href="#skills"` — confirms the "MY SKILLS" button now targets the new section.

- [ ] **Step 5: Do not commit**

Per Global Constraints, leave the changes uncommitted in the working tree.
