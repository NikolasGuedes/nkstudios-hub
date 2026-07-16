import { useEffect, useMemo, useRef, useState } from 'react';
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
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

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

  const logos = useMemo(
    () => KPI_DEFS.map(def => ({ value: def.value, label: __(def.labelKey) })),
    [locale]
  );

  return (
    <div className="about-kpi-loop" ref={wrapperRef}>
      {isVisible ? (
        <LogoLoop
          logos={logos}
          direction="up"
          speed={38}
          gap={16}
          hoverSpeed={0}
          fadeOut
          fadeOutColor="#000000"
          renderItem={renderKpiCard}
          ariaLabel={__('Key achievements')}
        />
      ) : null}
    </div>
  );
}
