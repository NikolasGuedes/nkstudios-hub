import { ArrowRight } from 'lucide-react';
import type { Project } from '../data/projects';
import { getProjectTextColor } from '../data/projects';
import { __ } from '../lib/i18n';

type ProjectSuggestionsProps = {
  projects: Project[];
  onSelect: (projectId: string) => void;
};

export default function ProjectSuggestions({ projects, onSelect }: ProjectSuggestionsProps) {
  const suggestions = projects.slice(0, 2);

  if (suggestions.length === 0) return null;

  return (
    <div className="grid gap-3" aria-label={__('Suggested projects')}>
      {suggestions.map(project => {
        const textColor = getProjectTextColor(project.COLOR);

        return (
          <button
            key={project.ID}
            type="button"
            onClick={() => onSelect(project.ID)}
            className="group relative flex min-h-20 w-full items-stretch overflow-hidden rounded-[1.4rem] border border-black/10 text-left shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            style={{ backgroundColor: project.COLOR, color: textColor }}
          >
            {project.IMAGES[0] ? (
              <img
                src={project.IMAGES[0]}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : null}
            <span className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
            <span className="relative z-10 flex min-w-0 flex-1 items-center px-5 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--Branco)]">
              {project.NAME}
            </span>
            <span className="relative z-10 m-3 flex aspect-square w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--Branco)] text-black transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight aria-hidden="true" size={24} strokeWidth={1.8} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
