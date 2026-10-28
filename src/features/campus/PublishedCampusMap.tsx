import { matchesStand } from '@/services/stand-search';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLive } from '@/state/live';
import { CampusOverview } from './CampusOverview';
import { LiveMap } from '@/pages/LiveMap';
import type { MapFloorDto } from '@/types/api';
function zoneOf(floor: MapFloorDto) {
  const text = [floor.code, floor.name, ...floor.zones.map((z) => z.colorToken ?? '')]
    .join(' ')
    .toLowerCase();
  if (/\bred\b|rojo|internacional|^r-/i.test(text)) return 'red';
  if (/\byellow\b|amarillo|bolivia|la paz|^a-/i.test(text)) return 'yellow';
  if (/\bgreen\b|verde|americano|^v-/i.test(text)) return 'green';
  return '';
}
/** Fallback for newly published floor geometry: never substitute demo booths. */
export function PublishedCampusMap() {
  const [params, setParams] = useSearchParams();
  const map = useLive((s) => s.map),
    stands = useLive((s) => s.stands);
  const [query, setQuery] = useState(''),
    [notice, setNotice] = useState('');
  const general =
    params.get('plan') === 'general' || (!params.has('floor') && !params.has('stand'));
  const mode = params.get('view') === '2d' ? '2d' : '3d';
  const dark = document.documentElement.dataset.theme === 'dark';
  if (!general)
    return (
      <>
        <button
          className="button secondary"
          onClick={() => setParams({ plan: 'general', view: mode })}
        >
          Ver recinto general
        </button>
        <LiveMap />
      </>
    );
  const results = stands.filter((stand) => matchesStand(stand, query));
  return (
    <section className="indoor-experience" aria-label="Mapa general FIPAZ">
      <div className="indoor-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar stands y empresas"
            placeholder="Buscar stands y empresas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {query && (
          <div className="indoor-results">
            {results.map((s) => (
              <button
                className="stand-result"
                key={s.id}
                onClick={() => {
                  setQuery('');
                  setParams({ stand: s.id, view: mode });
                }}
              >
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.boothCode}</small>
                </span>
              </button>
            ))}
            {!results.length && <p>No encontramos ese stand.</p>}
          </div>
        )}
      </div>
      <div className="indoor-viewer">
        <CampusOverview
          mode={mode}
          dark={dark}
          onBuilding={(zone) => {
            const floor = map?.floors.find((f) => zoneOf(f) === zone);
            if (floor) setParams({ floor: floor.id, view: mode });
            else setNotice('Este bloque todavía no tiene un plano publicado.');
          }}
          onFailure={() => setParams({ plan: 'general', view: '2d' })}
        />
        <div className="overview-modes indoor-modes">
          <button
            aria-pressed={mode === '2d'}
            onClick={() => setParams({ plan: 'general', view: '2d' })}
          >
            2D
          </button>
          <button
            aria-pressed={mode === '3d'}
            onClick={() => setParams({ plan: 'general', view: '3d' })}
          >
            3D
          </button>
        </div>
      </div>
      {notice && (
        <p className="footnote" role="status">
          {notice}
        </p>
      )}
      {!!map?.floors.length && (
        <div className="building-chips">
          {map.floors.map((f) => (
            <button key={f.id} onClick={() => setParams({ floor: f.id, view: mode })}>
              {f.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
