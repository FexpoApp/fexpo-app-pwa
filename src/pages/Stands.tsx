import { matchesStand } from '@/services/stand-search';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useStands } from '@/state/experience';
import { LIVE } from '@/services/config';
import { CATEGORIES } from '@/data/demo-data';
import { Empty } from '@/ui/components';
import { StandPoster, StandShelf } from '@/ui/StandShelf';
import { StandProfile } from '@/ui/StandProfile';
import { LiveStand } from './LiveStand';

export function StandsPage() {
  const [params] = useSearchParams();
  const category = params.get('category');
  const [query, setQuery] = useState(params.get('q') || '');
  const stands = useStands();
  const filtered = stands.filter((stand) => matchesStand(stand, query));
  const complete = category !== null;
  const selected = filtered.filter(
    (s) =>
      (!category || category === 'general' || s.category === category) &&
      (!params.has('featured') || s.featured),
  );
  const title = params.has('featured')
    ? 'Stands destacados'
    : (CATEGORIES.find((c) => c.id === category)?.label ?? 'Todos los stands');
  return (
    <div className="stack stand-catalog">
      <label className="catalog-search">
        <Search size={19} />
        <input
          type="search"
          aria-label="Buscar stands y empresas"
          placeholder="Buscar empresa o número de stand"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {complete ? (
        <>
          <div className="category-heading">
            <Link className="icon-button" to="/stands" aria-label="Volver a categorías">
              <ArrowLeft size={20} />
            </Link>
            <h2>{title}</h2>
            <small>{selected.length}</small>
          </div>
          <div className="poster-grid">
            {selected.map((s) => (
              <StandPoster key={s.id} stand={s} />
            ))}
          </div>
        </>
      ) : (
        <>
          <StandShelf
            title={query.trim() ? 'Resultados' : 'Todos'}
            stands={filtered}
            to={`/stands?category=general&q=${encodeURIComponent(query)}`}
          />
          {!query.trim() &&
            CATEGORIES.map((c) => (
              <StandShelf
                key={c.id}
                title={c.label}
                stands={filtered.filter((s) => s.category === c.id)}
                to={`/stands?category=${c.id}`}
              />
            ))}
        </>
      )}
      {!(complete ? selected : filtered).length && (
        <Empty title="No encontramos ese stand">
          Prueba con el nombre de la empresa o su número.
        </Empty>
      )}
      {!LIVE && <p className="footnote">Empresas e imágenes de categoría de demostración.</p>}
    </div>
  );
}
function DemoStandPage() {
  const { id } = useParams();
  const stand = useStands().find((s) => s.id === id);
  return stand ? (
    <StandProfile key={stand.id} stand={stand} />
  ) : (
    <Empty title="Stand no encontrado">
      <Link to="/stands">Explorar stands</Link>
    </Empty>
  );
}
export function StandPage() {
  return LIVE ? <LiveStand /> : <DemoStandPage />;
}
