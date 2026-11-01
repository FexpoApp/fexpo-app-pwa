import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
  Tag,
  Utensils,
} from 'lucide-react';
import { useStands } from '@/state/experience';
import { LIVE } from '@/services/config';
import {
  FAIR,
  dateInLaPaz,
  programmeForDay,
  programmeTime,
  selectedFairDay,
} from '@/features/fair/programme';
import { useProgramme } from '@/features/fair/use-programme';
import { DEMO_MENUS, PUBLISHED_MENUS } from '@/features/discovery/menus';
import { OffersSection } from '@/ui/OffersSection';
import { CategoryTile, Modal } from '@/ui/components';
import type { Stand } from '@/types/domain';

const sections = [
  { id: 'hoy', label: 'Hoy', icon: CalendarDays },
  { id: 'comer', label: 'Comer', icon: Utensils },
  { id: 'ofertas', label: 'Ofertas', icon: Tag },
  { id: 'servicios', label: 'Servicios', icon: MapPin },
] as const;

export function DiscoverPage() {
  const [params, setParams] = useSearchParams();
  const selected = sections.some((section) => section.id === params.get('section'))
    ? params.get('section')!
    : 'hoy';
  const stands = useStands();
  const [query, setQuery] = useState('');
  const [restaurant, setRestaurant] = useState<Stand | null>(null);
  const [now, setNow] = useState(Date.now());
  const programme = useProgramme();
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const day = selectedFairDay(null, now);
  const activities = programmeForDay(programme.items, day);
  const food = stands.filter(
    (stand) =>
      stand.category === 'gastronomy' &&
      [stand.name, ...stand.tags].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const menu = (LIVE ? PUBLISHED_MENUS : DEMO_MENUS).find(
    (item) => item.standId === restaurant?.id,
  );
  return (
    <div className="discover-page compact-flow">
      <div className="discover-sections" role="group" aria-label="Explorar la feria">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            aria-pressed={selected === section.id}
            onClick={() => setParams({ section: section.id })}
          >
            <section.icon size={19} />
            <span>{section.label}</span>
          </button>
        ))}
      </div>
      {selected === 'comer' && (
        <section className="discover-food" aria-label="Comer en la feria">
          <div className="discover-location">
            <Utensils size={16} />
            <span>Patio de comidas · entre bloques Amarillo y Verde</span>
            <a
              href={FAIR.map}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver patio de comidas en el plano oficial"
            >
              <ArrowUpRight size={18} />
            </a>
          </div>
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar comida o restaurante"
              placeholder="Busca comida o restaurante"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {!LIVE && <small className="discover-note">Restaurantes y menús de ejemplo.</small>}
          <div className="restaurant-list">
            {food.map((stand) => (
              <button
                className="restaurant-row"
                key={stand.id}
                onClick={() => setRestaurant(stand)}
              >
                <CategoryTile category={stand.category} />
                <span>
                  <strong>{stand.name}</strong>
                  <small>
                    {stand.tags.slice(0, 2).join(' · ') || stand.categoryLabel || 'Gastronomía'}
                  </small>
                  <small>{stand.boothCode || 'Ubicación por publicar'}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
          {!food.length && (
            <p className="discover-empty">
              {query
                ? 'No encontramos coincidencias.'
                : 'Los restaurantes aparecerán cuando publiquen su stand.'}
            </p>
          )}
        </section>
      )}
      {selected === 'hoy' && (
        <section className="discover-today" aria-label="Actividades de hoy">
          <Link className="discover-inline-heading" to={`${FAIR.route}?day=${day}`}>
            <strong>{dateInLaPaz(now) === day ? 'Hoy en FIPAZ' : 'Agenda FIPAZ'}</strong>
            <span>
              Ver agenda <ChevronRight size={15} />
            </span>
          </Link>
          {programme.loading && (
            <p role="status" className="discover-note">
              Actualizando actividades…
            </p>
          )}
          {programme.error && (
            <p role="alert" className="discover-note">
              {programme.error} <button onClick={programme.retry}>Reintentar</button>
            </p>
          )}
          {activities.map((item) => (
            <Link
              className="discover-event"
              key={item.id}
              to={`${FAIR.route}?day=${day}#${item.id}`}
            >
              {item.poster ? (
                <img src={item.poster} alt="" loading="lazy" width="60" height="74" />
              ) : (
                <span className="discover-event-icon">
                  <CalendarDays size={24} />
                </span>
              )}
              <span>
                <small>
                  {item.startsAt ? programmeTime(item.startsAt) : 'Horario no publicado'}
                  {item.example ? ' · Ejemplo' : ''}
                </small>
                <strong>{item.title}</strong>
                <small>{item.location || 'Ubicación por publicar'}</small>
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
          {!programme.loading && !activities.length && (
            <p className="discover-empty">
              Aún no hay actividades publicadas para este día.{' '}
              <a href={FAIR.facebook} target="_blank" rel="noopener noreferrer">
                Ver canal oficial
              </a>
            </p>
          )}
        </section>
      )}
      {selected === 'ofertas' && <OffersSection />}
      {selected === 'servicios' && (
        <section className="discover-services" aria-label="Servicios del recinto">
          {[
            ['Patio de comidas', 'Entre bloques Amarillo y Verde'],
            ['Ingreso principal', 'Entre bloques Rojo y Amarillo · Plaza Akapana'],
            ['Escenario principal', 'Área de ingreso principal'],
            ['Enfermería y boletería', 'Señalizadas en el plano oficial'],
            ['Baños y conexión entre plantas', 'Consulta el pabellón correspondiente'],
          ].map(([title, detail]) => (
            <a
              key={title}
              className="service-row"
              href={FAIR.map}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={19} />
              <span>
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight size={17} />
            </a>
          ))}
          <Link className="button secondary" to="/map?plan=general&view=2d">
            Abrir mapa interactivo
          </Link>
        </section>
      )}
      {restaurant && (
        <Modal
          title={restaurant.name}
          onClose={() => setRestaurant(null)}
          className="restaurant-menu"
        >
          <p className="discover-note">
            {menu?.example ? 'Menú de ejemplo · precios ilustrativos en Bs' : 'Menú del expositor'}
          </p>
          {menu ? (
            <>
              <ul className="menu-items">
                {menu.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      <strong>{item.name}</strong>
                      {!item.available && <small>No disponible</small>}
                    </span>
                    <b>{item.priceBs} Bs</b>
                  </li>
                ))}
              </ul>
              <small className="discover-note">Actualizado: {menu.updatedOn}</small>
            </>
          ) : (
            <p>Este expositor todavía no publicó su menú. Consulta su oferta en el stand.</p>
          )}
          <Link
            className="button secondary"
            to={`/stands/${restaurant.id}`}
            onClick={() => setRestaurant(null)}
          >
            Ver stand <ChevronRight size={16} />
          </Link>
          <Link
            className="button outline"
            to={`/map?stand=${encodeURIComponent(restaurant.id)}&view=2d`}
            onClick={() => setRestaurant(null)}
          >
            Ubicar en el mapa
          </Link>
        </Modal>
      )}
    </div>
  );
}
