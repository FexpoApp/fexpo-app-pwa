import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BadgeCheck, Compass, LockKeyhole } from 'lucide-react';
import { LIVE } from '@/services/config';
import { useLive } from '@/state/live';
import { useExperience, useStands } from '@/state/experience';
import { explorationBadges } from '@/features/discovery/model';
import { categoryMeta, Modal, Progress } from './components';

export function BadgeShelf() {
  const stands = useStands(),
    experience = useExperience(),
    liveVisits = useLive((s) => s.visits);
  const badges = explorationBadges(stands, LIVE ? liveVisits : experience.visits);
  const [selected, setSelected] = useState<string | null>(null);
  const badge = badges.find((b) => b.id === selected);
  return (
    <section className="badge-section" aria-label="Insignias de recorrido">
      <div className="shelf-heading">
        <h2>Insignias de recorrido</h2>
        <Award size={20} />
      </div>
      <div className="badge-rail" tabIndex={0} aria-label="Desliza para descubrir insignias">
        {badges.map((b) => {
          const Icon = b.category
            ? categoryMeta[b.category].icon
            : b.id === 'first'
              ? Award
              : Compass;
          return (
            <button
              key={b.id}
              className={'exploration-badge' + (b.complete ? ' complete' : '')}
              onClick={() => setSelected(b.id)}
              aria-label={
                b.title + (b.complete ? ', completada' : ', ' + b.progress + ' de ' + b.target)
              }
            >
              <span className="badge-symbol">
                <Icon size={29} />
                {b.complete ? (
                  <BadgeCheck size={16} className="badge-status" />
                ) : (
                  <LockKeyhole size={12} className="badge-status" />
                )}
              </span>
              <strong>{b.title}</strong>
              <small>
                {b.complete ? 'Completada' : b.progress + ' / ' + b.target + ' visitas'}
              </small>
            </button>
          );
        })}
      </div>
      <p className="badge-caption">
        {LIVE ? 'Se completan con tus visitas confirmadas.' : 'Recorrido de demostración.'}
      </p>
      {badge && (
        <Modal title={badge.title} onClose={() => setSelected(null)}>
          <div className={'badge-detail ' + (badge.complete ? 'complete' : '')}>
            <Award size={48} />
          </div>
          <p>
            Visita {badge.target} {badge.target === 1 ? 'stand diferente' : 'stands diferentes'}
            {badge.category ? ' de ' + categoryMeta[badge.category].label.toLowerCase() : ''} para
            completar esta insignia.
          </p>
          <Progress
            value={badge.progress}
            total={badge.target}
            label={badge.title}
            success={badge.complete}
          />
          <strong>
            {badge.complete
              ? 'Insignia completada'
              : badge.progress + ' de ' + badge.target + ' visitas'}
          </strong>
          <Link
            className="button"
            to={badge.category ? '/stands?category=' + badge.category : '/stands'}
            onClick={() => setSelected(null)}
          >
            Explorar stands
          </Link>
        </Modal>
      )}
    </section>
  );
}
