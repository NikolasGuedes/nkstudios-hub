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
    <span className="flex items-center gap-10 text-[clamp(12rem,100vh,80rem)] font-extrabold uppercase leading-none text-white/10">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}

function renderForegroundItem(item) {
  return (
    <span className="flex items-center gap-8 text-[clamp(3.5rem,100vh,20rem)] font-extrabold uppercase leading-none text-[var(--Branco)]">
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
