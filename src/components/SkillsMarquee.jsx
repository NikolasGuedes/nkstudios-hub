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
    <span className="flex items-center gap-8 text-[clamp(3.5rem,9vw,9rem)] font-extrabold uppercase leading-none text-[var(--text-primary)]">
      {item}
      <span aria-hidden="true">-</span>
    </span>
  );
}

export default function SkillsMarquee() {
  useLocale();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('web');

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
      <ShaderBackground isVisible={isVisible} reduceMotion={reduceMotion} />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6">
        {isVisible ? (
          <div
            key={activeCategoryId}
            className="contents"
            style={reduceMotion ? undefined : { animation: 'skills-marquee-fade 0.5s ease' }}
          >
            <LogoLoop
              logos={activeCategory.items}
              direction="left"
              speed={55}
              gap={48}
              pauseOnHover={false}
              renderItem={renderMarqueeItem}
              ariaLabel={__(activeCategory.labelKey)}
            />
            <div aria-hidden="true">
              <LogoLoop
                logos={activeCategory.items}
                direction="right"
                speed={55}
                gap={48}
                pauseOnHover={false}
                renderItem={renderMarqueeItem}
                ariaLabel={__(activeCategory.labelKey)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-8 z-20 flex flex-wrap items-center justify-center gap-3 px-5 md:bottom-12">
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
