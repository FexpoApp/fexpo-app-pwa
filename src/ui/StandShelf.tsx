import { Bookmark, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Stand } from '@/types/domain';
import { categoryMeta } from './components';
import { useExperience } from '@/state/experience';

export function StandPoster({ stand }: { stand: Stand }) {
  const saved = useExperience().favorites.includes(stand.id);
  return (
    <Link className="stand-poster" to={`/stands/${stand.id}`}>
      <span className={`stand-poster-art poster-${stand.category}`}>
        <span className="category-poster-image" aria-hidden="true" />
        {stand.coverUrl && (
          <img
            src={stand.coverUrl}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <span className="poster-category">
          {stand.categoryLabel || categoryMeta[stand.category].label}
        </span>
        <span className="poster-booth">{stand.boothCode}</span>
        {saved && (
          <span className="poster-saved">
            <Bookmark size={14} fill="currentColor" />
            <span className="sr-only">Guardado</span>
          </span>
        )}
      </span>
      <strong>{stand.name}</strong>
      <small>{stand.categoryLabel || categoryMeta[stand.category].label}</small>
    </Link>
  );
}

export function StandShelf({
  title,
  stands,
  to,
}: {
  title: string;
  stands: readonly Stand[];
  to: string;
}) {
  if (!stands.length) return null;
  return (
    <section className="stand-shelf" aria-label={title}>
      <Link className="shelf-heading" to={to}>
        <h2>{title}</h2>
        <ChevronRight size={20} />
        <span className="sr-only">Ver todos</span>
      </Link>
      <div
        className="poster-rail"
        tabIndex={0}
        aria-label={`Desliza para explorar ${title.toLowerCase()}`}
      >
        {stands.map((stand) => (
          <StandPoster stand={stand} key={stand.id} />
        ))}
      </div>
    </section>
  );
}
