# About Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new "About" section (bio + CV/skills CTAs on the left, an animated vertical loop of 8 KPI cards on the right, built on the existing `LogoLoop` component) and insert it into the landing page right after the Hero.

**Architecture:** A translated Astro section (`AboutSection.astro`) renders the static bio/CTA markup server-side (same `__()`/`data-i18n-key` pattern as `Header.astro`), and mounts a small client-only React component (`AboutKpiLoop.jsx`) that wraps `LogoLoop` with a `renderItem` producing custom KPI cards. `AboutKpiLoop.jsx` re-renders on locale change using the existing `useLocale()`/`__()` hook pattern already used in `SkillsViewport.tsx` (this is required because `client:only` islands can't receive functions like `renderItem` as serialized Astro props — the whole loop must be one React component). Card hover styling is pure CSS in a new stylesheet scoped to this section; `LogoLoop.jsx`/`LogoLoop.css` are not modified.

**Tech Stack:** Astro 5, React 19 (via `@astrojs/react`, `client:only="react"`), Tailwind CSS v4 utility classes, plain CSS module-less stylesheet imported into the `.astro` file, existing `src/lib/i18n.ts` translation system.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-16-about-section-design.md`.
- Section root must have `id="sobre"` (the header nav already links to `#sobre` — do not change `Header.astro`).
- Section height is natural/content-based — do not use `h-dvh` or scroll-snap like `HeroSection.astro`.
- "BAIXAR CV" and "MY SKILLS" buttons are both placeholders: `href="#"`, no real download/scroll target yet.
- Do not modify `src/components/LogoLoop.jsx` or `src/components/LogoLoop.css`.
- Loop: `direction="up"` (vertical), `hoverSpeed={0}` (pauses on hover), `fadeOut` enabled.
- KPI card hover state is triggered by real CSS `:hover` on the individual card only — no "centered card" simulation logic.
- All user-facing strings use English translation keys (project convention: `en` displays the key verbatim; `pt`/`es` provide translations in `src/locales/pt.json` / `src/locales/es.json`).
- No test runner exists in this project (`package.json` has no test script/framework). Verification steps use `npm run build` (Astro's type-check + static build) and manual checks against the running dev server (`npm run dev`) in place of automated tests — this mirrors how the rest of the codebase (Header, HeroSection) has been verified.

---

### Task 1: Add translation keys for the About section

**Files:**
- Modify: `src/locales/pt.json`
- Modify: `src/locales/es.json`

**Interfaces:**
- Produces: the following English keys, consumable via `__('<key>')` anywhere in the app from Task 3 and Task 4 onward:
  - `"My name is"`
  - `"I've worked as a game developer and UI Designer, currently focused on improving my skills related to programming and creating captivating and intuitive interfaces."`
  - `"DOWNLOAD CV"`
  - `"YEARS OF WEB DEVELOPMENT EXPERIENCE"`
  - `"YEARS OF GRAPHIC DESIGN EXPERIENCE"`
  - `"TATTOOS ON THE BODY"`
  - `"YEARS OF VIDEOGAME KNOWLEDGE"`
  - `"GAMES DEVELOPED"`
  - `"DEGREE IN TECHNOLOGY"`
  - `"TECHNOLOGY CERTIFICATIONS"`
  - `"DUOLINGO SCORE"`
- Consumes: none (this task only edits JSON dictionaries; the existing `"MY SKILLS"` key from Hero is reused as-is, no change needed).

- [ ] **Step 1: Add the new keys to `src/locales/pt.json`**

Open `src/locales/pt.json` and add these entries before the closing `}` (keep valid JSON — add a comma after the previous last entry):

```json
  "My name is": "Meu nome é",
  "I've worked as a game developer and UI Designer, currently focused on improving my skills related to programming and creating captivating and intuitive interfaces.": "Trabalhei como desenvolvedor de jogos e UI Designer, atualmente focado em aprimorar minhas habilidades relacionadas à programação e criar interfaces cativantes e intuitivas.",
  "DOWNLOAD CV": "BAIXAR CV",
  "YEARS OF WEB DEVELOPMENT EXPERIENCE": "ANOS DE EXPERIÊNCIA EM DESENVOLVIMENTO WEB",
  "YEARS OF GRAPHIC DESIGN EXPERIENCE": "ANOS DE EXPERIÊNCIA EM DESIGN GRÁFICO",
  "TATTOOS ON THE BODY": "TATUAGENS NO CORPO",
  "YEARS OF VIDEOGAME KNOWLEDGE": "ANOS DE CONHECIMENTO EM VIDEOGAMES",
  "GAMES DEVELOPED": "JOGOS DESENVOLVIDOS",
  "DEGREE IN TECHNOLOGY": "FORMAÇÃO NA ÁREA DE TECNOLOGIA",
  "TECHNOLOGY CERTIFICATIONS": "CERTIFICADOS NA ÁREA DE TECNOLOGIA",
  "DUOLINGO SCORE": "SCORE NO DUOLINGO"
```

- [ ] **Step 2: Add the same keys (Spanish translations) to `src/locales/es.json`**

```json
  "My name is": "Mi nombre es",
  "I've worked as a game developer and UI Designer, currently focused on improving my skills related to programming and creating captivating and intuitive interfaces.": "He trabajado como desarrollador de juegos y diseñador UI, actualmente enfocado en mejorar mis habilidades relacionadas con la programación y crear interfaces cautivadoras e intuitivas.",
  "DOWNLOAD CV": "DESCARGAR CV",
  "YEARS OF WEB DEVELOPMENT EXPERIENCE": "AÑOS DE EXPERIENCIA EN DESARROLLO WEB",
  "YEARS OF GRAPHIC DESIGN EXPERIENCE": "AÑOS DE EXPERIENCIA EN DISEÑO GRÁFICO",
  "TATTOOS ON THE BODY": "TATUAJES EN EL CUERPO",
  "YEARS OF VIDEOGAME KNOWLEDGE": "AÑOS DE CONOCIMIENTO EN VIDEOJUEGOS",
  "GAMES DEVELOPED": "JUEGOS DESARROLLADOS",
  "DEGREE IN TECHNOLOGY": "FORMACIÓN EN EL ÁREA DE TECNOLOGÍA",
  "TECHNOLOGY CERTIFICATIONS": "CERTIFICADOS EN EL ÁREA DE TECNOLOGÍA",
  "DUOLINGO SCORE": "PUNTUACIÓN EN DUOLINGO"
```

- [ ] **Step 3: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/pt.json','utf8')); JSON.parse(require('fs').readFileSync('src/locales/es.json','utf8')); console.log('OK')"`
Expected: `OK` printed, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/pt.json src/locales/es.json
git commit -m "feat: add i18n keys for About section"
```

---

### Task 2: Create the KPI card stylesheet

**Files:**
- Create: `src/components/AboutSection.css`

**Interfaces:**
- Produces: CSS classes consumed by Task 3's `renderItem` markup and Task 4's wrapper markup:
  - `.about-kpi-loop` (wrapper div around `<LogoLoop>`, provides height + `overflow: hidden` + a scoped override so vertical list items stretch full width)
  - `.about-kpi-card`, `.about-kpi-card__value`, `.about-kpi-card__label` (card content, default + `:hover` variant)
- Consumes: existing CSS custom properties from `src/styles/global.css` (`--line-mid`, `--text-primary`, `--page-bg`) — no changes to that file.

- [ ] **Step 1: Write the stylesheet**

```css
.about-kpi-loop {
  position: relative;
  overflow: hidden;
  height: clamp(26rem, 58dvh, 42rem);
}

.about-kpi-loop .logoloop__list {
  align-items: stretch;
}

.about-kpi-loop .logoloop__item {
  width: 100%;
}

.about-kpi-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.1rem 1.5rem;
  border-radius: 1rem;
  border: 1px solid var(--line-mid);
  background: rgba(255, 255, 255, 0.03);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.about-kpi-card__value {
  font-size: clamp(1.75rem, 2.4vw, 2.5rem);
  font-weight: 700;
  color: rgba(244, 242, 237, 0.55);
  transition: color 0.3s ease;
  white-space: nowrap;
}

.about-kpi-card__label {
  font-size: clamp(0.72rem, 0.85vw, 0.95rem);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(244, 242, 237, 0.4);
  transition: color 0.3s ease;
}

.about-kpi-card:hover {
  background: linear-gradient(135deg, #f4f2ed 0%, #ffffff 100%);
  border-color: transparent;
}

.about-kpi-card:hover .about-kpi-card__value,
.about-kpi-card:hover .about-kpi-card__label {
  color: var(--page-bg);
}

@media (prefers-reduced-motion: reduce) {
  .about-kpi-card {
    transition: none;
  }

  .about-kpi-card__value,
  .about-kpi-card__label {
    transition: none;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AboutSection.css
git commit -m "feat: add KPI card stylesheet for About section"
```

---

### Task 3: Create the `AboutKpiLoop` React component

**Files:**
- Create: `src/components/AboutKpiLoop.jsx`

**Interfaces:**
- Consumes:
  - `LogoLoop` default export from `./LogoLoop.jsx` — props used: `logos`, `direction`, `speed`, `gap`, `hoverSpeed`, `fadeOut`, `fadeOutColor`, `renderItem`, `ariaLabel`.
  - `__` and `useLocale` named exports from `../lib/i18n` (same pattern as `src/components/SkillsViewport.tsx`).
  - CSS classes from Task 2: `.about-kpi-loop`, `.about-kpi-card`, `.about-kpi-card__value`, `.about-kpi-card__label`.
- Produces: default export `AboutKpiLoop` (a React component, no props), to be mounted from `AboutSection.astro` in Task 4 as `<AboutKpiLoop client:only="react" />`.

- [ ] **Step 1: Write the component**

```jsx
import { useMemo } from 'react';
import LogoLoop from './LogoLoop.jsx';
import { __, useLocale } from '../lib/i18n';
import './AboutSection.css';

const KPI_DEFS = [
  { value: '+3', labelKey: 'YEARS OF WEB DEVELOPMENT EXPERIENCE' },
  { value: '+5', labelKey: 'YEARS OF GRAPHIC DESIGN EXPERIENCE' },
  { value: '+4', labelKey: 'TATTOOS ON THE BODY' },
  { value: '+25', labelKey: 'YEARS OF VIDEOGAME KNOWLEDGE' },
  { value: '+3', labelKey: 'GAMES DEVELOPED' },
  { value: '+1', labelKey: 'DEGREE IN TECHNOLOGY' },
  { value: '+28', labelKey: 'TECHNOLOGY CERTIFICATIONS' },
  { value: '+60', labelKey: 'DUOLINGO SCORE' }
];

function renderKpiCard(item) {
  return (
    <div className="about-kpi-card">
      <span className="about-kpi-card__value">{item.value}</span>
      <span className="about-kpi-card__label">{item.label}</span>
    </div>
  );
}

export default function AboutKpiLoop() {
  const locale = useLocale();

  const logos = useMemo(
    () => KPI_DEFS.map(def => ({ value: def.value, label: __(def.labelKey) })),
    [locale]
  );

  return (
    <div className="about-kpi-loop">
      <LogoLoop
        logos={logos}
        direction="up"
        speed={38}
        gap={16}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="#000000"
        renderItem={renderKpiCard}
        ariaLabel="Key achievements"
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it type-checks / builds with the rest of the app**

Run: `npm run build`
Expected: build completes with no errors mentioning `AboutKpiLoop.jsx` (the component isn't wired into any page yet, so this only confirms the file itself has no syntax errors if Astro's dependency graph reaches it later in Task 4 — if the build succeeds with no reference to this file, that's expected too, since nothing imports it yet).

- [ ] **Step 3: Commit**

```bash
git add src/components/AboutKpiLoop.jsx
git commit -m "feat: add AboutKpiLoop component wrapping LogoLoop for KPI cards"
```

---

### Task 4: Create `AboutSection.astro`

**Files:**
- Create: `src/components/AboutSection.astro`

**Interfaces:**
- Consumes:
  - `__` from `../lib/i18n` (server-side translation, same pattern as `HeroSection.astro`/`Header.astro`).
  - Default export `AboutKpiLoop` from `./AboutKpiLoop.jsx` (Task 3), mounted with `client:only="react"`.
- Produces: default export (Astro component) `AboutSection`, consumed by `src/pages/index.astro` in Task 5.

- [ ] **Step 1: Write the component**

```astro
---
import { __ } from '../lib/i18n';
import AboutKpiLoop from './AboutKpiLoop.jsx';
---

<section id="sobre" class="relative bg-[var(--page-bg)] text-[var(--text-primary)] px-3 py-16 sm:px-4 sm:py-20 lg:px-6 lg:py-24">
  <div class="mx-auto grid w-full max-w-[112rem] grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <div class="flex flex-col justify-center gap-8 lg:gap-10">
      <p class="text-[clamp(1.05rem,1.6vw,1.4rem)] leading-relaxed text-[var(--text-primary)]">
        <span data-i18n-key="My name is">{__('My name is')}</span>{' '}
        <strong class="font-semibold">Nikolas Guedes</strong>{' '}
        <span data-i18n-key="I've worked as a game developer and UI Designer, currently focused on improving my skills related to programming and creating captivating and intuitive interfaces.">
          {__("I've worked as a game developer and UI Designer, currently focused on improving my skills related to programming and creating captivating and intuitive interfaces.")}
        </span>
      </p>

      <div class="flex flex-wrap items-center gap-3">
        <a
          href="#"
          data-i18n-key="DOWNLOAD CV"
          class="rounded-full border border-[var(--text-primary)] bg-[var(--text-primary)] px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
          style="color: var(--page-bg);"
        >
          {__('DOWNLOAD CV')}
        </a>
        <a
          href="#"
          data-i18n-key="MY SKILLS"
          class="rounded-full border border-[var(--text-primary)] px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:bg-[var(--surface-softer)]"
        >
          {__('MY SKILLS')}
        </a>
      </div>
    </div>

    <div>
      <AboutKpiLoop client:only="react" />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AboutSection.astro
git commit -m "feat: add AboutSection component"
```

---

### Task 5: Wire `AboutSection` into the page and verify end-to-end

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: default export `AboutSection` from `../components/AboutSection.astro` (Task 4).

- [ ] **Step 1: Import and render `AboutSection` after `HeroSection`**

```astro
---
import HeroSection from '../components/HeroSection.astro';
import AboutSection from '../components/AboutSection.astro';
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout
  title="NK Studios Hub"
>
  <HeroSection />
  <AboutSection />
</BaseLayout>
```

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build completes with `0 errors` (Astro prints a summary of built pages including `/`).

- [ ] **Step 3: Start the dev server and manually verify in the browser**

Run: `npm run dev` (leave running)

Open the printed local URL and check:
- Scrolling past the Hero reveals the About section with the bio paragraph, "Nikolas Guedes" in bold, and the two buttons ("BAIXAR CV" / "MINHAS HABILIDADES" in the default `pt` locale).
- The right column shows a vertical, continuously scrolling list of 8 KPI cards, faded at top and bottom edges.
- Hovering over an individual KPI card: that card's background switches to the light gradient with dark text, and the loop's scroll pauses; moving the mouse off resumes scrolling and reverts that card's style.
- Switching the language via the header's language switcher updates the bio, both buttons, and all 8 KPI labels (numbers stay the same, e.g. `+3`) to the selected locale, without a page reload.
- Resize the window to a mobile width: the two columns stack (bio/buttons on top, KPI loop below), and content stays readable (no horizontal overflow).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: render About section on the landing page"
```
