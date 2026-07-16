# About Section — Design Spec

Date: 2026-07-16

## Goal

Add a new "About" section to the NK Studios Hub landing page, placed right after the Hero section, matching the visual reference at `public/images/previews/ABOUT.png`. The section introduces Nikolas with a short bio and two CTAs on the left, and an animated vertical loop of KPI cards on the right, built with the existing `LogoLoop` component.

## Placement & Structure

- New file: `src/components/AboutSection.astro`.
- Rendered in `src/pages/index.astro` right after `<HeroSection />`.
- Section root gets `id="sobre"` — the header nav (`Header.astro`) already links to `#sobre`, so this wires up existing navigation with no header changes needed.
- Height: natural (content height), not `h-dvh` like the Hero. No forced 100vh/scroll-snap behavior.
- Layout: 2-column grid (`grid-cols-1 lg:grid-cols-2` or similar), stacking to a single column on mobile. Left column = text + CTAs, right column = KPI loop.

## Left column — bio + CTAs

- Short bio paragraph adapted from the preview's English copy (game developer / UI designer, focused on programming and building intuitive interfaces), translated into the project's 3 locales.
- Two buttons, laid out side by side (stack on very small screens):
  - **"BAIXAR CV"** (Download CV): `href="#"` placeholder for now — no PDF asset yet. Styled as a solid/filled button (mirrors the header's filled "Get in touch" CTA — light bg, dark text).
  - **"MY SKILLS"**: `href="#"` placeholder, no scroll/link target for now (to be wired later). Styled as an outline button (border, transparent bg), mirroring the header's nav-link style.
- Both buttons follow existing button conventions from `Header.astro` (rounded-full, uppercase, tracked letter-spacing).

## Right column — KPI loop

- Uses `LogoLoop` (`src/components/LogoLoop.jsx`) with `client:only="react"` (same pattern as `SkillsViewport`).
- Config: `direction="up"`, vertical scroll, `fadeOut` enabled (top/bottom fade using the component's built-in `--logoloop-fadeColor` mechanism), `hoverSpeed={0}` so the loop pauses while the mouse is over the track (per existing `pauseOnHover`/`hoverSpeed` API — no changes to `LogoLoop.jsx`/`LogoLoop.css` needed).
- Custom `renderItem` renders a KPI card per item — **not** an image/logo — with:
  - Big bold number (e.g. `+3`)
  - Uppercase label describing the stat
- Card visual states, done in a **new scoped stylesheet** (e.g. `src/components/AboutSection.css`, imported by `AboutSection.astro`) — `LogoLoop.css` stays untouched:
  - **Default**: dark/transparent background, subtle border, muted/gray text (number + label), matching the non-highlighted cards in the preview.
  - **`:hover`** (real mouse hover on that specific card only — no auto-centered-card simulation): light gradient background (light-gray → white), dark text for both number and label, matching the highlighted card in the preview. Pure CSS `:hover` on the card element, no JS state needed.
- 8 KPI items, in this order:
  1. +3 anos de experiência em desenvolvimento web
  2. +5 anos de experiência em design gráfico
  3. +4 tatuagens no corpo
  4. +25 anos de conhecimento em videogames
  5. +3 jogos desenvolvidos
  6. +1 Formação na Área de Tecnologia
  7. +28 Certificados na Área de Tecnologia
  8. +60 de score no Duolingo

  Each becomes `{ value: '+N', label: '<rest of the text, uppercase>' }` fed into `LogoLoop`'s `logos` prop (repurposed as generic items via `renderItem`, not literal logos).

## i18n

- Follows the existing pattern (`src/lib/i18n.ts`, `data-i18n-key` + `__()`): translation keys are written in **English**, `pt.json` and `es.json` provide the translations; when locale is `en`, the key itself is displayed verbatim.
- New keys needed:
  - Bio paragraph (or split into segments if the bolded name needs isolation, matching `<strong>Nikolas Guedes</strong>` styling from the preview).
  - `"BAIXAR CV"` → English key (e.g. `"DOWNLOAD CV"`), pt = `"BAIXAR CV"`, es = `"DESCARGAR CV"`.
  - `"MY SKILLS"` → already exists as a pattern in Hero (`"MY SKILLS"` key already present in locale files) — reuse if wording matches exactly, otherwise add a new key to avoid clobbering existing usage.
  - 8 KPI labels, English keys authored by Claude, pt = the user-provided Portuguese text, es = Spanish translation.
- All translatable text nodes get `data-i18n-key` attributes per the existing convention so `translateDocument()` picks them up on locale switch.

## Out of scope / explicitly deferred

- No real CV PDF file — button is a placeholder (`href="#"`).
- No real scroll target for "MY SKILLS" — placeholder (`href="#"`), not wired to `SkillsViewport` or any anchor.
- No automatic "centered card" hover simulation — only real mouse `:hover` per card.
- No changes to `LogoLoop.jsx` or `LogoLoop.css` — all new card visuals live in a new, section-scoped stylesheet.
