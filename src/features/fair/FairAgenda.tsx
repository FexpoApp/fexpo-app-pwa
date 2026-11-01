import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Clock3, ExternalLink, MapPin, Music2, Sparkles, Utensils } from 'lucide-react';
import {
  FAIR,
  dateInLaPaz,
  dayLabel,
  fairDays,
  programmeForDay,
  programmeTime,
  selectedFairDay,
} from './programme';
import { useProgramme } from './use-programme';
import { POSTER_VISITOR_INFO } from './publications';

const categories = {
  experience: { name: 'Actividades', icon: Sparkles },
  food: { name: 'Gastronomía', icon: Utensils },
  music: { name: 'Música', icon: Music2 },
};

export function FairAgenda() {
  const [query, setQuery] = useSearchParams();
  const [now, setNow] = useState(Date.now());
  const programme = useProgramme();
  const selectedButton = useRef<HTMLButtonElement>(null);
  const selected = selectedFairDay(query.get('day'), now);
  const today = dateInLaPaz(now);
  const visible = programmeForDay(programme.items, selected);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    selectedButton.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [selected]);
  return (
    <div className="fair-agenda compact-flow">
      <div className="agenda-brandline">
        <img src={FAIR.logo} alt="FIPAZ" width="80" height="27" />
        <span>28 OCT — 8 NOV · 2026</span>
      </div>
      <h1 className="sr-only">Cartelera FIPAZ</h1>
      <section className="agenda-calendar" aria-label="Programación por día">
        <div className="agenda-days" role="group" aria-label="Elegir un día de la feria">
          {fairDays().map((day) => (
            <button
              key={day}
              type="button"
              ref={day === selected ? selectedButton : undefined}
              className="agenda-day"
              aria-pressed={day === selected}
              aria-label={dayLabel(day)}
              onClick={() => setQuery({ day })}
            >
              <span>{dayLabel(day, true).replace('.', '')}</span>
              <strong>{Number(day.slice(-2))}</strong>
              <small>{day.slice(5, 7) === '10' ? 'oct' : 'nov'}</small>
              {day === today && <i aria-label="Hoy" />}
            </button>
          ))}
        </div>
        <div className="agenda-date-heading">
          <span className="agenda-date-number">{selected.slice(-2)}</span>
          <div>
            <h2>{dayLabel(selected)}</h2>
            <p>
              {visible.length
                ? visible.length + (visible.length === 1 ? ' actividad' : ' actividades')
                : 'Cartelera del día'}
            </p>
          </div>
        </div>
        {programme.loading && (
          <p className="agenda-update" role="status">
            Actualizando actividades…
          </p>
        )}
        {programme.error && (
          <div className="agenda-update" role="alert">
            <p>{programme.error}</p>
            <button onClick={programme.retry}>Reintentar</button>
          </div>
        )}
        {visible.length ? (
          <ol className="agenda-timeline" aria-label={'Actividades del ' + dayLabel(selected)}>
            {visible.map((item) => {
              const category = categories[item.category];
              return (
                <li className={'agenda-entry agenda-' + item.category} key={item.id} id={item.id}>
                  <span className="agenda-entry-dot" aria-hidden="true">
                    <category.icon size={14} />
                  </span>
                  <div className="agenda-entry-top">
                    <span className="agenda-category">{category.name}</span>
                    {item.example && <small>Ejemplo</small>}
                    {item.status === 'completed' && <small>Finalizada</small>}
                  </div>
                  <div className="agenda-entry-content">
                    {item.poster && (
                      <a
                        className="agenda-poster"
                        href={item.poster}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={'Ver afiche de ' + item.title}
                      >
                        <img
                          src={item.poster}
                          alt={'Afiche: ' + item.title}
                          loading="lazy"
                          width="68"
                          height="85"
                        />
                      </a>
                    )}
                    <div>
                      <span className="agenda-time">
                        <Clock3 size={12} />
                        {item.startsAt ? (
                          <>
                            <time dateTime={item.startsAt}>{programmeTime(item.startsAt)}</time>
                            {item.endsAt && ' — ' + programmeTime(item.endsAt)}
                          </>
                        ) : (
                          'Horario no publicado'
                        )}
                      </span>
                      <h3>{item.title}</h3>
                      {item.description && <p>{item.description}</p>}
                      {item.location && (
                        <span className="agenda-item-place">
                          <MapPin size={12} />
                          {item.location}
                        </span>
                      )}
                      {item.sourceLabel && (
                        <small className="agenda-credit">{item.sourceLabel}</small>
                      )}
                      {item.standId && (
                        <Link className="agenda-stand-link" to={'/stands/' + item.standId}>
                          Ver stand <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          !programme.loading && (
            <div className="agenda-feedback">
              <p>Aún no hay actividades publicadas para este día.</p>
              <a href={FAIR.facebook} target="_blank" rel="noopener noreferrer">
                Ver novedades oficiales <ExternalLink size={13} />
              </a>
            </div>
          )
        )}
        {visible.some((item) => item.example) && (
          <p className="agenda-example">
            Actividades de ejemplo para explorar el diseño. No son la cartelera oficial.
          </p>
        )}
        {visible.some((item) => item.poster) && (
          <p className="agenda-example">
            Afiches compartidos el 1 nov. Consulta cambios en el canal oficial; el horario de
            apertura no es la hora del espectáculo.
          </p>
        )}
      </section>
      <details className="agenda-visit-info">
        <summary>Horarios y entradas</summary>
        <p>
          Según la cartelera del 1 nov: sábados, domingos y feriados{' '}
          {POSTER_VISITOR_INFO.weekendHours}. Adultos {POSTER_VISITOR_INFO.adultPrice}; niños y
          adultos mayores {POSTER_VISITOR_INFO.childAndSeniorPrice}.
        </p>
        <p>
          El folleto indica lunes a viernes 16:00–22:00 y fines de semana/feriados 11:00–23:00.
          Confirma cambios con FIPAZ.
        </p>
        <a className="agenda-source" href={FAIR.facebook} target="_blank" rel="noopener noreferrer">
          Canal oficial <ExternalLink size={12} />
        </a>
        <a className="agenda-source" href={FAIR.source} target="_blank" rel="noopener noreferrer">
          Folleto 2026 <ExternalLink size={12} />
        </a>
      </details>
      <Link className="button secondary agenda-map-link" to="/map">
        Ver mapa <ArrowRight size={17} />
      </Link>
    </div>
  );
}
