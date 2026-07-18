import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Images, Play, X } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { PROJECTS, getProjectTextColor } from '../data/projects';
import { __, useLocale } from '../lib/i18n';
import ProjectSuggestions from './ProjectSuggestions';

const PROJECT_DURATION_MS = 12000;
const IMAGE_DURATION_MS = 4500;

function getRandomProjects(activeProjectId: string, amount: number) {
  const availableProjects = PROJECTS.filter(project => project.ID !== activeProjectId);

  for (let index = availableProjects.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [availableProjects[index], availableProjects[randomIndex]] = [
      availableProjects[randomIndex],
      availableProjects[index]
    ];
  }

  return availableProjects.slice(0, amount);
}

export default function ProjectsShowcase() {
  useLocale();

  const reduceMotion = useReducedMotion();
  const [activeProjectId, setActiveProjectId] = useState(PROJECTS[0]?.ID ?? '');
  const [mediaMode, setMediaMode] = useState<'video' | 'images'>('images');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageRotationRun, setImageRotationRun] = useState(0);
  const [suggestions, setSuggestions] = useState(() =>
    PROJECTS.filter(project => project.ID !== activeProjectId).slice(0, 2)
  );
  const [progressRun, setProgressRun] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeProject = useMemo(
    () => PROJECTS.find(project => project.ID === activeProjectId) ?? PROJECTS[0],
    [activeProjectId]
  );

  useEffect(() => {
    if (!activeProject) return;

    setMediaMode(activeProject.VIDEO ? 'video' : 'images');
    setActiveImageIndex(0);
    setSuggestions(getRandomProjects(activeProject.ID, 2));
    setProgressRun(currentRun => currentRun + 1);
  }, [activeProject]);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (
      reduceMotion ||
      mediaMode !== 'images' ||
      !activeProject ||
      activeProject.IMAGES.length <= 1
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveImageIndex(currentIndex =>
        (currentIndex + 1) % activeProject.IMAGES.length
      );
    }, IMAGE_DURATION_MS);

    return () => window.clearInterval(intervalId);
  }, [activeProject, imageRotationRun, mediaMode, reduceMotion]);

  if (!activeProject) return null;

  const textColor = getProjectTextColor(activeProject.COLOR);
  const activeImage = activeProject.IMAGES[activeImageIndex] ?? activeProject.IMAGES[0];
  const hasVideo = Boolean(activeProject.VIDEO);
  const hasImages = activeProject.IMAGES.length > 0;

  const selectImage = (imageIndex: number) => {
    const totalImages = activeProject.IMAGES.length;

    if (totalImages <= 1) return;

    setActiveImageIndex((imageIndex + totalImages) % totalImages);
    setImageRotationRun(currentRun => currentRun + 1);
  };

  const selectProject = (projectId: string) => {
    if (projectId === activeProject.ID) {
      setProgressRun(currentRun => currentRun + 1);
    } else {
      setActiveProjectId(projectId);
    }

    setIsModalOpen(false);
  };

  const refreshSuggestions = () => {
    setSuggestions(getRandomProjects(activeProject.ID, 2));
    setProgressRun(currentRun => currentRun + 1);
  };

  return (
    <section
      id="projetos"
      className="relative isolate min-h-dvh overflow-hidden transition-colors duration-500 lg:h-dvh lg:min-h-0 lg:pt-[var(--header-height)]"
      style={{ backgroundColor: activeProject.COLOR, color: textColor }}
    >
      <div className="grid min-h-dvh lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,2.1fr)_minmax(23rem,0.9fr)]">
        <div className="relative min-h-[62svh] overflow-hidden bg-black lg:h-full lg:min-h-0">
          {mediaMode === 'video' && activeProject.VIDEO ? (
            <video
              key={activeProject.VIDEO}
              src={activeProject.VIDEO}
              poster={activeProject.IMAGES[0]}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              controls
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              loop
              muted
              playsInline
            />
          ) : activeImage ? (
            activeProject.IMAGES.map((image, index) => {
              const isActiveImage = index === activeImageIndex;

              return (
                <img
                  key={image}
                  src={image}
                  alt={isActiveImage ? `${activeProject.NAME} — ${__('Project image')}` : ''}
                  aria-hidden={!isActiveImage}
                  className="absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    opacity: isActiveImage ? 1 : 0,
                    transform: isActiveImage ? 'scale(1)' : 'scale(1.015)'
                  }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              );
            })
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-black text-sm uppercase tracking-[0.2em] text-[color:var(--Branco)]/55">
              {__('Media coming soon')}
            </div>
          )}

          <div className="absolute left-4 top-4 z-10 flex rounded-full bg-black/55 p-1 text-[var(--Branco)] shadow-xl backdrop-blur-xl sm:left-6 sm:top-6">
            <button
              type="button"
              onClick={() => setMediaMode('video')}
              disabled={!hasVideo}
              aria-pressed={mediaMode === 'video'}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm"
              style={{
                backgroundColor:
                  mediaMode === 'video'
                    ? 'color-mix(in srgb, var(--Branco) 20%, transparent)'
                    : undefined
              }}
            >
              <Play aria-hidden="true" size={15} fill="currentColor" />
              {__('Video')}
            </button>
            <button
              type="button"
              onClick={() => setMediaMode('images')}
              disabled={!hasImages}
              aria-pressed={mediaMode === 'images'}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-35 sm:text-sm"
              style={{
                backgroundColor:
                  mediaMode === 'images'
                    ? 'color-mix(in srgb, var(--Branco) 20%, transparent)'
                    : undefined
              }}
            >
              <Images aria-hidden="true" size={16} />
              {__('Images')}
            </button>
          </div>

          {activeProject.LINK ? (
            <a
              href={activeProject.LINK}
              target="_blank"
              rel="noreferrer noopener"
              className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-full bg-black/55 py-1.5 pl-5 pr-1.5 text-sm font-medium text-[var(--Branco)] shadow-xl backdrop-blur-xl transition hover:bg-black/70 sm:right-6 sm:top-6 sm:text-base"
            >
              {__('Visit website')}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--Branco)] text-black">
                <ArrowUpRight aria-hidden="true" size={20} />
              </span>
            </a>
          ) : null}

          {mediaMode === 'images' && activeProject.IMAGES.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => selectImage(activeImageIndex - 1)}
                aria-label={__('Previous image')}
                className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--Branco)]/20 bg-black/55 text-[var(--Branco)] shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-black/75 sm:left-5 sm:h-14 sm:w-14"
              >
                <ChevronLeft aria-hidden="true" size={30} strokeWidth={1.7} />
              </button>
              <button
                type="button"
                onClick={() => selectImage(activeImageIndex + 1)}
                aria-label={__('Next image')}
                className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--Branco)]/20 bg-black/55 text-[var(--Branco)] shadow-xl backdrop-blur-xl transition hover:scale-105 hover:bg-black/75 sm:right-5 sm:h-14 sm:w-14"
              >
                <ChevronRight aria-hidden="true" size={30} strokeWidth={1.7} />
              </button>
            </>
          ) : null}

          {mediaMode === 'images' && activeProject.IMAGES.length > 1 ? (
            <div className="absolute inset-x-0 bottom-5 z-10 flex justify-center gap-2">
              {activeProject.IMAGES.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => selectImage(index)}
                  aria-label={`${__('Show image')} ${index + 1}`}
                  aria-pressed={activeImageIndex === index}
                  className="h-2.5 rounded-full bg-[var(--Branco)] shadow transition-all"
                  style={{ width: activeImageIndex === index ? '2.25rem' : '0.625rem', opacity: activeImageIndex === index ? 1 : 0.55 }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-[38rem] flex-col px-5 py-8 sm:px-8 sm:py-10 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:px-[clamp(2rem,3.2vw,4.5rem)] lg:py-[clamp(1.75rem,3.5vh,3.5rem)]">
          <div>
            <h2 className="text-[clamp(2.7rem,4.2vw,5.5rem)] font-bold uppercase leading-[0.88] tracking-[-0.045em]">
              {activeProject.NAME}
            </h2>
          </div>

          <div className="flex flex-1 items-center py-10 lg:py-8">
            <p className="mx-auto max-w-[31rem] text-center text-[clamp(1.05rem,1.3vw,1.45rem)] font-light leading-[1.28]">
              {__(activeProject.DESCRIPTION)}
            </p>
          </div>

          <div className="space-y-6">
            <ProjectSuggestions projects={suggestions} onSelect={selectProject} />

            <div
              className="h-3 overflow-hidden bg-[color:var(--Branco)]/75"
              role="progressbar"
              aria-label={__('Time until next project')}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                key={`${activeProject.ID}-${progressRun}`}
                className="project-progress block h-full bg-black"
                onAnimationEnd={refreshSuggestions}
                style={{
                  animationDuration: `${PROJECT_DURATION_MS}ms`,
                  animationPlayState: isModalOpen ? 'paused' : 'running',
                  width: reduceMotion ? '100%' : undefined
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="group flex w-full items-center rounded-[1.4rem] bg-black p-2 pl-6 text-[var(--Branco)] transition hover:bg-black/85 sm:pl-8"
            >
              <span className="flex-1 text-center text-lg font-medium uppercase tracking-[-0.02em] sm:text-2xl">
                {__('View all')}
              </span>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--Branco)] text-black sm:h-16 sm:w-16">
                <ArrowRight aria-hidden="true" size={27} className="transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-xl sm:p-8"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-projects-title"
            className="relative my-auto w-full max-w-6xl rounded-[2rem] border border-[color:var(--Branco)]/15 bg-[#0a0a0a] p-5 text-[var(--Branco)] shadow-2xl sm:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-5">
              <div>
                <p className="mb-2 text-[0.65rem] uppercase tracking-[0.25em] text-[color:var(--Branco)]/50">
                  NK Studios
                </p>
                <h2 id="all-projects-title" className="text-3xl font-semibold uppercase sm:text-5xl">
                  {__('All projects')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label={__('Close projects')}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[color:var(--Branco)]/20 transition hover:bg-[color:var(--Branco)]/10"
              >
                <X aria-hidden="true" size={22} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map(project => (
                <button
                  key={project.ID}
                  type="button"
                  onClick={() => selectProject(project.ID)}
                  className="group relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-[color:var(--Branco)]/10 text-left"
                  style={{ backgroundColor: project.COLOR }}
                >
                  {project.IMAGES[0] ? (
                    <img
                      src={project.IMAGES[0]}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : null}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-[var(--Branco)]">
                    <span className="text-2xl font-semibold uppercase">{project.NAME}</span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--Branco)] text-black">
                      <ArrowRight aria-hidden="true" size={20} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .project-progress {
          width: 0;
          animation-name: nk-project-progress;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }

        @keyframes nk-project-progress {
          from { width: 0; }
          to { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .project-progress { animation: none; }
        }

        video::-webkit-media-controls-mute-button,
        video::-webkit-media-controls-volume-slider,
        video::-webkit-media-controls-overflow-button {
          display: none !important;
        }
      `}</style>
    </section>
  );
}
