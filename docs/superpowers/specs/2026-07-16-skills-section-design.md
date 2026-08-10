# Skills Section — Design Spec

Date: 2026-07-16

## Goal

Add a new "Skills" section to the NK Studios Hub landing page, placed right after the About section, matching the visual reference at `public/images/previews/SKILLS.png`. The section reuses the Hero's shader-gradient background (without the 3D model) as a full-bleed backdrop, with two giant horizontal `LogoLoop` marquees scrolling in opposite directions, and three category buttons that switch which tech items the marquees display.

## Placement & Structure

- New file: `src/components/SkillsSection.astro`, rendered in `src/pages/index.astro` right after `<AboutSection />`.
- Section root: `id="skills"`, `h-dvh` (full viewport height, like the Hero), `overflow-hidden`, no rounded corners (the background fills the entire section edge-to-edge, unlike the Hero's rounded card).
- The `AboutSection.astro` "MY SKILLS" button (`src/components/AboutSection.astro`), currently a placeholder `href="#"`, is updated to `href="#skills"`.

## Shared background extraction

- New file: `src/components/ShaderBackground.tsx` — a React component extracted verbatim from the background markup currently inline in `src/components/SkillsViewport.tsx` (the `ShaderGradientCanvas` + `ShaderGradient` with all its existing props, the `backdrop-blur` overlay div, and the dark linear-gradient overlay div). Props: `reduceMotion: boolean | null`, `isVisible: boolean` (the `ShaderGradient`'s `animate` prop becomes `reduceMotion || !isVisible ? 'off' : 'on'`, same logic already used in `SkillsViewport.tsx`).
- `SkillsViewport.tsx` is updated to render `<ShaderBackground reduceMotion={reduceMotion} isVisible={isViewportVisible} />` in place of its inline background block. No visual or behavioral change to the Hero — this is a pure extraction to avoid duplicating ~50 lines of shader configuration between the Hero and the new Skills section.

## Skills marquee (client-side React)

- New file: `src/components/SkillsMarquee.jsx`, mounted from `SkillsSection.astro` via `client:only="react"`.
- Renders, stacked via absolute positioning inside a full-size relative container:
  1. `<ShaderBackground>` filling the section (own `IntersectionObserver`-driven `isVisible` state, same pattern as `SkillsViewport.tsx`/`AboutKpiLoop.jsx`, so it pauses when scrolled out of view).
  2. Two horizontal `LogoLoop` rows, vertically centered, one directly below the other:
     - Row 1: `direction="left"`.
     - Row 2: `direction="right"`.
     - Both rows are mounted only while the section is within `IntersectionObserver` range (same mount/unmount-based gating already used in `AboutKpiLoop.jsx`), so their `requestAnimationFrame` loops don't run off-screen.
     - `renderItem` renders each tech name in large bold uppercase text (using the site's `--font-display` font, matching the preview's bold geometric look) followed by a decorative `-` separator, so the continuous loop reads "BLENDER - UNITY - C# - BLENDER - ...".
     - No `fadeOut` — the background is a moving gradient, not a flat color, so a CSS fade-to-color would look like a visible patch; the text is simply clipped by the section's `overflow-hidden`.
  3. Three category buttons, positioned near the bottom (per the preview), in this order: **WEB DEVELOPER** (active by default), **GAME DEVELOPER**, **UI/UX DESIGNER**. Active button = filled light background + dark text; inactive = transparent background + light border/text (same visual convention as the existing filled/outline button pairs elsewhere in the app, e.g. `Header.astro`'s nav CTA vs. links).
  4. Clicking a button sets the active category in React state, which changes the `logos` arrays fed to both `LogoLoop` rows.

## Content

```
WEB DEVELOPER  (default active): VUE.JS, REACT.JS, REACT THREE FIBER, PHP, LARAVEL, MOTION, TAILWIND, ASTRO
GAME DEVELOPER: BLENDER, UNITY, C#
UI/UX DESIGNER: FIGMA, SPLINE
```

Tech names are proper nouns / product names — not translated, rendered identically in all locales.

## i18n

- Category button labels follow the project's existing convention (English string as the translation key, `pt.json`/`es.json` provide translations, `en` locale shows the key verbatim):
  - `"WEB DEVELOPER"` → pt `"DESENVOLVEDOR WEB"`, es `"DESARROLLADOR WEB"`
  - `"GAME DEVELOPER"` → pt `"DESENVOLVEDOR DE JOGOS"`, es `"DESARROLLADOR DE JUEGOS"`
  - `"UI/UX DESIGNER"` → pt `"DESIGNER UI/UX"`, es `"DISEÑADOR UI/UX"`
- These are new keys, distinct from the pre-existing (and currently unused/placeholder) `"3D MODELING"` / `"GAMES"` / `"DESIGN"` tab labels in `SkillsViewport.tsx` — different UI, different wording per the preview, not to be conflated or reused.

## Performance

Following the pattern established in the prior optimization pass (`SkillsViewport.tsx`'s `IntersectionObserver`-gated `Canvas`/`ShaderGradient`, `AboutKpiLoop.jsx`'s mount-gated `LogoLoop`): the new section's shader background and both `LogoLoop` marquees must not run their animation loops while the section is scrolled out of view, to avoid reintroducing the multi-section scroll jank that was just fixed.

## Out of scope

- No changes to `Header.astro` navigation (no new nav link added for `#skills` — only the existing "MY SKILLS" button in `AboutSection.astro` is wired to it).
- No changes to the pre-existing `SkillsViewport.tsx` tabs (`3D MODELING`/`GAMES`/`DESIGN`) — those remain as they are, unrelated to this new section.
- No visual/behavioral change to the Hero beyond the internal `ShaderBackground` extraction (should be pixel-identical).
