import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Megaphone, Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LIVE, EVENT_ID } from '@/services/config';
import { activeAdvertisements, DEMO_ADVERTISEMENTS, PUBLISHED_ADVERTISEMENTS } from './model';
import type { Advertisement } from './model';
import { GAMLP } from '@/features/sectors/gamlp';
import '@/features/sectors/sector.css';

export function AdvertisementShelf() {
  const campaigns = LIVE
    ? activeAdvertisements(PUBLISHED_ADVERTISEMENTS, EVENT_ID, Date.now())
    : DEMO_ADVERTISEMENTS;
  // Institutional directory feature requested for the presentation. It is not
  // inferred to be a paid campaign and has no fabricated stand UUID or metrics.
  const municipal: Advertisement = {
    id: 'gamlp-sector',
    eventId: EVENT_ID,
    standId: '',
    advertiser: 'Gobierno Autónomo Municipal de La Paz',
    title: 'Conoce a quienes emprenden en La Paz.',
    subtitle: 'Bloque amarillo · Planta alta · P14-A y P14-B',
    category: 'municipal',
    destination: GAMLP.mapUrl,
    institutional: true,
    status: 'published',
    startsAt: '2026-10-28T00:00:00-04:00',
    endsAt: '2026-11-09T00:00:00-04:00',
    example: false,
  };
  const ads = [...activeAdvertisements([municipal], EVENT_ID, Date.now()), ...campaigns];
  const [active, setActive] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(
    matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const go = useCallback((index: number) => {
    const target = rail.current?.children[index];
    if (target instanceof HTMLElement) {
      rail.current?.scrollTo({
        left: target.offsetLeft,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    }
  }, []);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setReducedMotion(preference.matches);
    const visibility = () => setForeground(!document.hidden);
    preference.addEventListener('change', changed);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.5,
    });
    if (rail.current) observer.observe(rail.current);
    return () => {
      preference.removeEventListener('change', changed);
      document.removeEventListener('visibilitychange', visibility);
      observer.disconnect();
    };
  }, []);
  const rotating =
    ads.length > 1 &&
    !paused &&
    !interacting &&
    !focused &&
    visible &&
    foreground &&
    !reducedMotion;
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => go((active + 1) % ads.length), 6000);
    return () => clearTimeout(timer);
  }, [active, ads.length, rotating, go]);
  return (
    <section
      className="advertisement-shelf"
      aria-label="Anuncios de la feria"
      aria-roledescription="carrusel"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="advertisement-heading">
        <h2>Anuncios</h2>
        {ads.length > 1 && (
          <div className="advertisement-controls">
            <span aria-live="off">
              {String(Math.min(active + 1, ads.length)).padStart(2, '0')}{' '}
              <i>/ {String(ads.length).padStart(2, '0')}</i>
            </span>
            <button
              className="icon-button"
              aria-label="Anuncio anterior"
              onClick={() => go((active - 1 + ads.length) % ads.length)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Anuncio siguiente"
              onClick={() => go((active + 1) % ads.length)}
            >
              <ChevronRight size={18} />
            </button>
            {!reducedMotion && (
              <button
                className="icon-button"
                aria-label={paused ? 'Reanudar anuncios' : 'Pausar anuncios'}
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            )}
          </div>
        )}
      </div>
      {ads.length ? (
        <div
          className="advertisement-rail"
          ref={rail}
          tabIndex={0}
          aria-label="Desliza para ver anuncios"
          data-active={active}
          onPointerDown={() => setInteracting(true)}
          onPointerUp={() => setInteracting(false)}
          onPointerCancel={() => setInteracting(false)}
          onScroll={() => {
            const element = rail.current;
            if (element)
              setActive(
                Math.min(
                  ads.length - 1,
                  Math.round(element.scrollLeft / (element.clientWidth + 12)),
                ),
              );
          }}
        >
          {ads.map((ad) => (
            <Link
              key={ad.id}
              className={`advertisement poster-${ad.category}`}
              to={ad.destination || `/stands/${ad.standId}`}
            >
              <span className="advertisement-art" aria-hidden="true">
                {ad.institutional ? (
                  <span className="municipal-ad-art">
                    <img src={GAMLP.logo} alt="" />
                    <span>GAMLP</span>
                  </span>
                ) : (
                  <span className="category-poster-image" />
                )}
              </span>
              <span className="advertisement-shade" aria-hidden="true" />
              <span className="advertisement-copy">
                <small className="advertisement-disclosure">
                  {ad.institutional
                    ? 'Sector municipal'
                    : ad.example
                      ? 'Ejemplo · Publicidad'
                      : 'Publicidad'}
                </small>
                <span className="advertisement-advertiser">{ad.advertiser}</span>
                <strong>{ad.title}</strong>
                <span className="advertisement-description">{ad.subtitle}</span>
                <span className="advertisement-cta">
                  {ad.institutional ? 'Ubicar el sector' : 'Conocer el stand'}
                  <ArrowUpRight size={17} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="advertisement-empty">
          <Megaphone size={22} />
          <div>
            <strong>Novedades de los expositores</strong>
            <p>Los anuncios aparecerán aquí cuando estén publicados.</p>
          </div>
        </div>
      )}
    </section>
  );
}
