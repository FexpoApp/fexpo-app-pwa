import { Link } from 'react-router-dom';
import { ChevronRight, MapPin } from 'lucide-react';
import { useStands } from '@/state/experience';
import { LIVE } from '@/services/config';
import { Art } from '@/ui/components';
import { StandShelf } from '@/ui/StandShelf';
import { OffersSection } from '@/ui/OffersSection';

const actions = [
  { path: '/map', name: 'Mapa', art: 'map', tint: 'blue' },
  { path: '/stands', name: 'Stands', art: 'stands', tint: 'coral' },
  { path: '/scan', name: 'Check-in', art: 'checkin', tint: 'green' },
];

export function HomePage() {
  const stands = useStands();
  const featured = stands.filter((stand) => stand.featured);
  return (
    <div className="stack home-page compact-home">
      <Link className="fair-compact" to="/events/event-fipaz-2026" aria-label="Conocer FIPAZ 2026">
        <img src="/assets/events/fipaz-banner.jpg" alt="FIPAZ 2026" fetchPriority="high" />
        <span className="fair-image-title" aria-hidden="true">
          FIPAZ <small>2026</small>
        </span>
        <span className="fair-compact-caption">
          <strong>FIPAZ 2026</strong>
          <span>
            <MapPin size={13} />
            La Paz
            <ChevronRight size={15} />
          </span>
        </span>
      </Link>
      <div className="quick-grid">
        {actions.map((action) => (
          <Link className="quick-action" to={action.path} key={action.path}>
            <span className={`quick-image ${action.tint}`}>
              <Art name={action.art} size={76} />
            </span>
            <span>
              <strong>{action.name}</strong>
              <ChevronRight size={14} />
            </span>
          </Link>
        ))}
      </div>
      <StandShelf
        title={featured.length ? 'Stands destacados' : 'Explora los stands'}
        stands={featured.length ? featured : stands}
        to={featured.length ? '/stands?category=general&featured=1' : '/stands?category=general'}
      />
      <OffersSection />
      {!LIVE && <p className="footnote">Vista de demostración · empresas de ejemplo.</p>}
    </div>
  );
}
