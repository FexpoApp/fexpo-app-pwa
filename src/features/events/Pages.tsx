import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Map,
  MapPin,
  Route,
  ScanLine,
  ChevronRight,
  LogOut,
  CalendarDays,
  Check,
  Download,
  ArrowLeftRight,
} from 'lucide-react';
import { LIVE } from '@/services/config';
import { GoogleLogin } from '@/ui/GoogleLogin';
import { useLive } from '@/state/live';
import {
  FAIRS,
  PUC_BASE,
  PUC_EXPERIENCES,
  PUC_EXPERIENCE_COUNT,
  pucExperience,
  experienceUrl,
} from './catalog';
import { Art, Progress } from '@/ui/components';
import { PUC_ASSETS, PUC_CONTENT } from './content';
import { usePucScans } from './progress';
import { usePucServer, syncPucProgress } from './server';

export function FairSelectionPage() {
  const [query, setQuery] = useState('');
  const items = FAIRS.filter((fair) =>
    `${fair.name} ${fair.venue} ${fair.organizer}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(
        query
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase(),
      ),
  );
  return (
    <section className="fair-selection">
      <div className="fair-page-heading">
        <div>
          <span className="eyebrow">LA PAZ · BOLIVIA</span>
          <h1>Elige tu feria</h1>
        </div>
        <CalendarDays size={26} />
      </div>
      <label className="search-field">
        <MapPin size={17} />
        <input
          aria-label="Buscar una feria"
          placeholder="Buscar una feria"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="fair-cards">
        {items.map((fair) => (
          <Link
            className={`fair-event-card ${fair.slug === 'gamlp-puc-2026' ? 'municipal-fair-card' : 'fipaz-fair-card'}`}
            key={fair.slug}
            to={fair.path}
          >
            <div className="fair-card-copy">
              <span className="fair-card-organizer">
                {fair.slug === 'gamlp-puc-2026'
                  ? 'CIUDAD PRODUCTIVA'
                  : 'FERIA INTERNACIONAL DE LA PAZ'}
              </span>
              <div className="fair-card-title">
                <h2>{fair.name}</h2>
                {fair.status && <span className="fair-card-status">{fair.status}</span>}
              </div>
              <p>
                <MapPin size={14} />
                {fair.venue}
              </p>
            </div>
            {fair.slug === 'gamlp-puc-2026' ? (
              <img
                className="municipal-card-photo"
                src={PUC_ASSETS.banner}
                alt="Imagina tu ciudad · Ciudad Productiva · Ilustración del domo"
              />
            ) : (
              <div className="fipaz-card-photo">
                <img
                  src="/assets/events/fipaz-cover.webp"
                  alt="FIPAZ en el Campo Ferial Chuquiago Marka"
                />
              </div>
            )}
            <span className="fair-card-action">
              {fair.status ? 'Ver edición' : 'Explorar feria'}
              <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
      {!items.length && <p role="status">No encontramos una feria con ese nombre.</p>}
    </section>
  );
}

export function ExperienceRows({ rich = false }: { rich?: boolean }) {
  const scanned = usePucScans();
  const owner = useLive((s) => s.user?.id);
  const confirmed = usePucServer((s) => (s.owner === owner ? s.progress : null));
  const completed = LIVE
    ? confirmed?.experiences.filter((p) => p.myRating).map((p) => p.slug) || []
    : scanned;
  return (
    <ol className={`puc-experience-list ${rich ? 'rich-route' : ''}`}>
      {PUC_EXPERIENCES.map((point) => (
        <li key={point.slug}>
          <Link to={experienceUrl(point.slug)}>
            <span className={`puc-step ${completed.includes(point.slug) ? 'is-scanned' : ''}`}>
              {completed.includes(point.slug) ? <Check size={17} /> : point.order}
            </span>
            {rich && (
              <img
                className={PUC_CONTENT[point.slug].art ? 'route-art' : ''}
                src={PUC_CONTENT[point.slug].image}
                alt=""
                loading="lazy"
              />
            )}
            <span className="grow">
              <strong>{point.shortName}</strong>
              <small>
                {rich ? PUC_CONTENT[point.slug].teaser : PUC_CONTENT[point.slug].location}
              </small>
              {rich && (
                <span className="route-point-meta">
                  {point.type === 'domo' ? 'DOMO' : point.type === 'tunel' ? 'PASAJE' : 'CARPA'} ·{' '}
                  {scanned.includes(point.slug)
                    ? 'QR leído'
                    : `PUNTO ${point.order} DE ${PUC_EXPERIENCE_COUNT}`}
                </span>
              )}
            </span>
            <ChevronRight size={18} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
export function PucHomePage() {
  return (
    <section className="puc-home">
      <h1 className="sr-only">Ciudad Productiva</h1>
      <Link
        className="puc-hero"
        to={PUC_BASE + '/recorrido'}
        aria-label="Imagina tu ciudad, conocer el recorrido"
      >
        <img
          src={PUC_ASSETS.banner}
          alt="Imagina tu ciudad · Secretaría Municipal de Ciudad Productiva y La Paz · Imagen conceptual"
        />
        <span className="puc-hero-caption">
          <strong>Imagina tu ciudad</strong>
          <span>
            6–8 NOV · PUC <ChevronRight size={14} />
          </span>
        </span>
      </Link>
      <div className="puc-quick-actions">
        <Link to={PUC_BASE + '/mapa'}>
          <span className="puc-action-art">
            <Art name="map" size={58} />
          </span>
          <span>
            Mapa <ChevronRight size={13} />
          </span>
        </Link>
        <Link to={PUC_BASE + '/recorrido'}>
          <span className="puc-action-art">
            <Art name="route" size={58} />
          </span>
          <span>
            Recorrido <ChevronRight size={13} />
          </span>
        </Link>
        <Link to={PUC_BASE + '/escanear'}>
          <span className="puc-action-art">
            <Art name="my-qr" size={58} />
          </span>
          <span>
            Escanear <ChevronRight size={13} />
          </span>
        </Link>
      </div>
      <div className="puc-section-line">
        <h2>Descubre Ciudad Productiva</h2>
        <Link to={PUC_BASE + '/recorrido'} aria-label="Ver todo el recorrido">
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <div className="puc-discover-strip">
        {PUC_EXPERIENCES.filter((point) => [2, 3, 4].includes(point.order)).map((point) => (
          <Link key={point.slug} to={experienceUrl(point.slug)}>
            <img src={PUC_CONTENT[point.slug].image} alt="" loading="lazy" />
            <span className="puc-discover-number">0{point.order}</span>
            <strong>{point.shortName}</strong>
            <small>
              {point.type === 'tunel' ? 'Una experiencia en pantallas' : 'Talento y emprendimiento'}
            </small>
          </Link>
        ))}
      </div>
      <Link className="puc-scan-callout" to={PUC_BASE + '/escanear'}>
        <ScanLine size={23} />
        <span>
          <strong>Tu experiencia cuenta</strong>
          <small>Escanea el QR de cada punto y comparte tu opinión.</small>
        </span>
        <ChevronRight size={18} />
      </Link>
      <div className="puc-home-footer">
        <MapPin size={14} />
        <span>Parque Urbano Central · 6 al 8 de noviembre</span>
        <img src={PUC_ASSETS.lapaz} alt="La Paz, Capital del Cielo" />
      </div>
    </section>
  );
}
export function PucRoutePage() {
  return (
    <section className="puc-route-page">
      <div className="fair-page-heading">
        <div>
          <h1>Tu recorrido</h1>
          <p>Cinco paradas exteriores y una experiencia en el domo central.</p>
        </div>
        <Route size={25} />
      </div>
      <Link className="puc-location-link" to={PUC_BASE + '/mapa'}>
        <Map size={18} />
        Ver el mapa completo
        <ArrowUpRight size={17} />
      </Link>
      <ExperienceRows rich />
      <p className="puc-small-note">
        Escanea el QR de cada lugar para calificar. El domo se visita desde el centro del recinto.
      </p>
    </section>
  );
}
export function PucExperiencePage() {
  const { point: slug = '' } = useParams();
  const point = pucExperience(slug);
  if (!point) return <PucNotFound />;
  const next = point.order < 5 ? PUC_EXPERIENCES[point.order] : undefined;
  return (
    <article className="puc-experience-page">
      <span className="puc-label">
        {point.type === 'domo' ? 'DOMO' : point.type === 'tunel' ? 'PASAJE' : 'CARPA'} · PUNTO{' '}
        {point.order} DE {PUC_EXPERIENCE_COUNT}
      </span>
      <div className="puc-experience-title">
        <span className="puc-step">{point.order}</span>
        <h1>{point.name}</h1>
      </div>
      <figure
        className={`puc-experience-photo ${PUC_CONTENT[point.slug].art ? 'is-art' : ''} ${point.type === 'domo' ? 'is-banner' : ''}`}
      >
        <img src={PUC_CONTENT[point.slug].image} alt={`Ilustración de ${point.shortName}`} />
        <figcaption>Imagen conceptual</figcaption>
      </figure>
      <p>{PUC_CONTENT[point.slug].detail}</p>
      <Link className="puc-location-link" to={PUC_BASE + '/mapa?point=' + point.slug}>
        <MapPin size={18} />
        Ubicar en el mapa
        <ArrowUpRight size={17} />
      </Link>
      <Link className="button puc-primary" to={PUC_BASE + '/escanear?point=' + point.slug}>
        <ScanLine size={19} />
        Escanear para calificar
      </Link>
      <div className="puc-next-point">
        <small>
          {next
            ? 'SIGUIENTE EXPERIENCIA'
            : point.type === 'domo'
              ? 'VISITA LIBRE'
              : 'FINAL DEL RECORRIDO'}
        </small>
        {next ? (
          <Link to={experienceUrl(next.slug)}>
            {next.shortName}
            <ArrowRight size={18} />
          </Link>
        ) : (
          <p>
            {point.type === 'domo'
              ? 'El domo es una visita libre en el centro del recinto.'
              : 'La salida está junto a la carpa de Publicidad. También puedes visitar el domo central.'}
          </p>
        )}
      </div>
    </article>
  );
}
export function PucAccountPage() {
  const inFair = useLocation().pathname.startsWith(PUC_BASE);
  const user = useLive((s) => s.user);
  const status = useLive((s) => s.status);
  const scanned = usePucScans();
  const remote = usePucServer((s) => (s.owner === user?.id ? s.progress : null));
  const remoteError = usePucServer((s) => (s.owner === user?.id ? s.error : ''));
  const remoteLoading = usePucServer((s) => s.owner === user?.id && s.loading);
  const catalog = usePucServer((s) => s.catalog);
  const total = LIVE
    ? (remote?.progress.totalExperiences ?? catalog?.experiences.length ?? PUC_EXPERIENCE_COUNT)
    : PUC_EXPERIENCE_COUNT;
  const scannedCount = LIVE ? (remote?.progress.scannedCount ?? 0) : scanned.length;
  const ratedCount = LIVE ? (remote?.progress.ratedCount ?? 0) : 0;
  return (
    <section className="puc-account-page">
      <h1>{inFair ? 'Mi perfil' : 'Tu cuenta FEXPO'}</h1>
      {inFair && (
        <div className="puc-progress-card">
          <div className="puc-progress-heading">
            <span>
              <small>CIUDAD PRODUCTIVA</small>
              <strong>Tu recorrido, paso a paso</strong>
            </span>
            <Route size={25} />
          </div>
          <div className="puc-progress-counts">
            <span>
              <strong>
                {LIVE && !remote ? '—' : scannedCount}
                <small>/{total}</small>
              </strong>{' '}
              {LIVE ? 'QR confirmados' : 'QR escaneados'}
            </span>
            <span>
              <strong>
                {LIVE && !remote ? '—' : ratedCount}
                <small>/{total}</small>
              </strong>{' '}
              Calificaciones confirmadas
            </span>
          </div>
          <Progress
            value={LIVE ? ratedCount : scannedCount}
            total={total}
            label={LIVE ? 'Lugares con calificación confirmada' : 'Lugares con QR escaneado'}
          />
          <ol className="puc-progress-points">
            {PUC_EXPERIENCES.map((point) => {
              const row = remote?.experiences.find((p) => p.slug === point.slug);
              const done = LIVE ? !!row?.myRating : scanned.includes(point.slug);
              return (
                <li key={point.slug}>
                  <Link
                    to={experienceUrl(point.slug)}
                    aria-label={`${point.shortName}: ${LIVE ? (row?.scannedAt ? 'QR confirmado' : 'QR pendiente') : scanned.includes(point.slug) ? 'QR escaneado' : 'QR pendiente'}, ${row?.myRating ? 'calificación confirmada' : 'calificación pendiente'}`}
                  >
                    <span className={done ? 'done' : ''}>
                      {done ? <Check size={15} /> : point.order}
                    </span>
                    <small>
                      {
                        ['Mercados', 'Túnel', 'Desarrollo', 'CITEs', 'Publicidad', 'Domo'][
                          point.order - 1
                        ]
                      }
                    </small>
                  </Link>
                </li>
              );
            })}
          </ol>
          <p>
            {LIVE
              ? 'Avance de tu cuenta confirmado por el servidor.'
              : 'QR leídos en este dispositivo. Un borrador aún no cuenta como calificación.'}
          </p>
          {LIVE && catalog && !catalog.experiences.some((p) => p.slug === 'domo') && (
            <p>El domo estará disponible para calificar próximamente.</p>
          )}
          {remoteLoading && <p role="status">Consultando tu avance…</p>}
          {remoteError && (
            <>
              <p role="alert">{remoteError}</p>
              <button
                className="button secondary"
                onClick={() => user && void syncPucProgress(user.id).catch(() => {})}
              >
                Reintentar
              </button>
            </>
          )}
          <Link className="button puc-primary" to={PUC_BASE + '/escanear'}>
            <ScanLine size={17} />
            Continuar escaneando
          </Link>
        </div>
      )}
      {LIVE && status === 'signedIn' && user ? (
        <>
          <div className="puc-account-identity">
            <span className="puc-account-avatar">{user.displayName?.slice(0, 1) || 'V'}</span>
            <span>
              <strong>{user.displayName}</strong>
              <small>
                {user.authProvider === 'google' ? 'Sesión de Google' : 'Sesión iniciada'}
              </small>
            </span>
          </div>
          <p>
            Tu cuenta te acompaña entre ferias. Para calificar, abre el QR de la experiencia que
            visitaste.
          </p>
          <button className="button secondary" onClick={() => void useLive.getState().signOut()}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </>
      ) : LIVE ? (
        <GoogleLogin purpose="account" />
      ) : (
        <div className="puc-access-note">
          <UserRoundIcon />
          <strong>Explora sin cuenta</strong>
          <p>
            El envío de opiniones requiere una sesión de Google en la versión conectada. La cuenta
            de prueba local no habilita calificaciones reales.
          </p>
          <button className="button secondary" disabled>
            Continuar con Google
          </button>
        </div>
      )}
      <div className="puc-profile-tools">
        <button onClick={() => window.dispatchEvent(new Event('fexpo-request-install'))}>
          <Download size={15} />
          Instalar la app
        </button>
        <Link to="/">
          <ArrowLeftRight size={14} />
          {inFair ? 'Cambiar feria' : 'Ver ferias'}
        </Link>
      </div>
    </section>
  );
}
function UserRoundIcon() {
  return <span className="puc-account-avatar">G</span>;
}
export function PucNotFound() {
  return (
    <section className="puc-empty">
      <h1>Experiencia no encontrada</h1>
      <p>Revisa el enlace del QR o elige un punto del recorrido.</p>
      <Link className="button" to={PUC_BASE + '/recorrido'}>
        Ver recorrido
      </Link>
    </section>
  );
}

export function UnknownFairPage() {
  return (
    <section className="puc-empty">
      <h1>Feria no disponible</h1>
      <p>Elige una de las ferias publicadas para continuar.</p>
      <Link className="button" to="/">
        Ver ferias
      </Link>
    </section>
  );
}
