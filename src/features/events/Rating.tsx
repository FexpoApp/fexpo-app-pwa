import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, MapPin, Star, ArrowRight, ScanLine } from 'lucide-react';
import { LIVE } from '@/services/config';
import { useLive } from '@/state/live';
import { GoogleLogin } from '@/ui/GoogleLogin';
import {
  PUC_BASE,
  PUC_EXPERIENCE_COUNT,
  pucExperience,
  experienceUrl,
  isPucExternalQr,
  type PucExperience,
} from './catalog';
import { PucNotFound } from './Pages';
import { hasPucRatingAccess, grantPucRatingAccess } from './scan-access';
import { ensurePucScan, syncPucProgress, savePucRating, usePucServer } from './server';
import type { ExperienceRatingDto } from '@/types/api';
type Draft = { stars: number; comment: string };
const empty = (): Draft => ({ stars: 0, comment: '' });
const draftKey = (point: string, owner: string) =>
  `fexpo-rating-draft-v1:gamlp-puc-2026:${point}:${owner}`;
function readDraft(key: string): Draft | null {
  try {
    const d = JSON.parse(sessionStorage.getItem(key) || 'null');
    return d &&
      Number.isInteger(d.stars) &&
      d.stars >= 0 &&
      d.stars <= 5 &&
      typeof d.comment === 'string'
      ? { stars: d.stars, comment: d.comment.slice(0, 1000) }
      : null;
  } catch {
    return null;
  }
}
function useDraft(point: string, userId: string | undefined, initial?: ExperienceRatingDto | null) {
  const [owner, setOwner] = useState(userId || 'guest');
  const [draft, setDraft] = useState<Draft>(
    () =>
      readDraft(draftKey(point, userId || 'guest')) ||
      (initial ? { stars: initial.stars, comment: initial.comment || '' } : empty()),
  );
  useEffect(() => {
    const next = userId || 'guest';
    if (owner === next) return;
    const stored = readDraft(draftKey(point, next));
    setDraft(stored || (owner === 'guest' && next !== 'guest' ? draft : empty()));
    try {
      sessionStorage.removeItem(draftKey(point, owner));
    } catch {
      /* Storage is optional. */
    }
    setOwner(next);
  }, [userId, owner, point]);
  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(draftKey(point, owner), JSON.stringify(draft));
      } catch {
        /* Optional storage. */
      }
    };
    window.addEventListener('fexpo-before-update', save);
    return () => window.removeEventListener('fexpo-before-update', save);
  }, [point, owner, draft]);
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey(point, owner), JSON.stringify(draft));
    } catch {
      /* The form still works without storage. */
    }
  }, [point, owner, draft]);
  return [draft, setDraft] as const;
}
export function PucRatingPage() {
  const { point: slug = '' } = useParams();
  const point = pucExperience(slug);
  return point ? <RatingScanGate key={point.slug} point={point} /> : <PucNotFound />;
}
function RatingScanGate({ point }: { point: PucExperience }) {
  const [params, setParams] = useSearchParams();
  const owner = useLive((s) => s.user?.id);
  const [access, setAccess] = useState(() => hasPucRatingAccess(point.slug, owner));
  const external = isPucExternalQr(point.slug, params.get('qr'));
  useEffect(() => {
    if (!external || !owner) return;
    if (
      hasPucRatingAccess(point.slug, owner) ||
      grantPucRatingAccess(point.slug, owner, 'external-qr', params.get('qr'))
    ) {
      setAccess(true);
      const next = new URLSearchParams(params);
      next.delete('qr');
      next.delete('via');
      setParams(next, { replace: true });
    }
  }, [external, owner, point.slug, params, setParams]);
  if (!access || !hasPucRatingAccess(point.slug, owner))
    return (
      <section className="puc-scan-required">
        <span className="puc-gate-symbol">
          <ScanLine size={29} />
        </span>
        <h1>Escanea el QR de este lugar</h1>
        <p>
          Para calificar <strong>{point.shortName}</strong>, primero lee el código de esta
          experiencia.
        </p>
        <Link className="button puc-primary" to={PUC_BASE + '/escanear?point=' + point.slug}>
          <ScanLine size={18} />
          Escanear QR
        </Link>
        <Link className="button ghost" to={experienceUrl(point.slug)}>
          Ver la experiencia
        </Link>
      </section>
    );
  return <ConnectedRating key={owner + point.slug} point={point} owner={owner!} />;
}
function ConnectedRating({ point, owner }: { point: PucExperience; owner: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const data = usePucServer((s) => (s.owner === owner ? s.progress : null));
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');
    void (async () => {
      await syncPucProgress(owner);
      await ensurePucScan(point.slug, owner);
      if (!cancelled) setReady(true);
    })().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'No pudimos cargar este punto.');
    });
    return () => {
      cancelled = true;
    };
  }, [owner, point.slug, retry]);
  if (!ready)
    return (
      <section className="puc-scan-required">
        <h1>{error ? 'No pudimos abrir la calificación' : 'Preparando tu calificación…'}</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button puc-primary" onClick={() => setRetry((v) => v + 1)}>
              Reintentar
            </button>
          </>
        ) : (
          <p role="status">Comprobando tu lectura y tu opinión guardada.</p>
        )}
        <Link className="button ghost" to={experienceUrl(point.slug)}>
          Ver la experiencia
        </Link>
      </section>
    );
  return (
    <RatingForm
      key={owner + point.slug}
      point={point}
      initial={data?.experiences.find((p) => p.slug === point.slug)?.myRating}
    />
  );
}
function RatingForm({
  point,
  initial,
}: {
  point: PucExperience;
  initial?: ExperienceRatingDto | null;
}) {
  const [params] = useSearchParams();
  const preview = !LIVE && params.get('preview') === '1';
  const user = useLive((s) => s.user);
  const signedIn = useLive((s) => s.status === 'signedIn');
  const [draft, setDraft] = useDraft(point.slug, user?.id, initial);
  const [example, setExample] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<ExperienceRatingDto | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  if (example || saved)
    return (
      <section className="puc-rating-success">
        {example && <p className="puc-preview-label">Vista de diseño · ninguna opinión enviada</p>}
        <span className="puc-success-mark">
          <Check size={35} />
        </span>
        <h1>¡Gracias por tu opinión!</h1>
        <p>
          {saved
            ? 'Tu calificación quedó guardada.'
            : 'Así se verá la confirmación cuando el servidor guarde tu calificación.'}
        </p>
        <div className="puc-rating-target">
          <span className="puc-step">{point.order}</span>
          <div>
            <strong>{point.shortName}</strong>
            <small>GAMLP · Ciudad Productiva</small>
            <span className="puc-star-summary" aria-label={`${draft.stars} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={21}
                  fill={n <= (saved?.stars || draft.stars) ? 'currentColor' : 'none'}
                />
              ))}
            </span>
          </div>
        </div>
        <Link className="button puc-primary" to={PUC_BASE + '/mapa?point=' + point.slug}>
          Volver al mapa
          <ArrowRight size={17} />
        </Link>
        <Link className="button secondary" to={PUC_BASE + '/recorrido'}>
          Explorar otro punto
        </Link>
        <button
          className="button ghost"
          onClick={() => {
            setExample(false);
            setSaved(null);
          }}
        >
          {saved ? 'Editar mi calificación' : 'Volver al borrador'}
        </button>
      </section>
    );
  return (
    <section className="puc-rating-page">
      <span className="puc-label">
        PUNTO {point.order} DE {PUC_EXPERIENCE_COUNT} · GAMLP
      </span>
      <h1>¿Cómo fue tu experiencia?</h1>
      <Link className="puc-rating-target" to={experienceUrl(point.slug)}>
        <span className="puc-step">{point.order}</span>
        <span>
          <strong>{point.name}</strong>
          <small>
            <MapPin size={12} />
            Ciudad Productiva · Parque Urbano Central
          </small>
        </span>
      </Link>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (saving || !LIVE || !signedIn || !user) return;
          setSaving(true);
          setError('');
          try {
            const result = await savePucRating(point.slug, user.id, draft.stars, draft.comment);
            setSaved(result.rating);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No pudimos guardar tu opinión. Reintenta.');
          } finally {
            setSaving(false);
          }
        }}
      >
        <fieldset className="puc-rating-field">
          <legend>Elige de 1 a 5 estrellas</legend>
          <div className="puc-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className={value <= draft.stars ? 'selected' : ''}>
                <input
                  type="radio"
                  name="stars"
                  value={value}
                  checked={draft.stars === value}
                  ref={(element) => {
                    inputRefs.current[value - 1] = element;
                  }}
                  disabled={saving}
                  onChange={() => setDraft((d) => ({ ...d, stars: value }))}
                  aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                  onKeyDown={(event) => {
                    if (!['Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const target = event.key === 'Home' ? 1 : 5;
                    setDraft((d) => ({ ...d, stars: target }));
                    inputRefs.current[target - 1]?.focus();
                  }}
                />
                <Star aria-hidden="true" fill={value <= draft.stars ? 'currentColor' : 'none'} />
              </label>
            ))}
          </div>
          <p className="puc-rating-caption" aria-live="polite">
            {
              ['Tu opinión nos importa', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][
                draft.stars
              ]
            }
          </p>
        </fieldset>
        <label className="puc-comment-label">
          Comentario <span>(opcional)</span>
          <textarea
            disabled={saving}
            value={draft.comment}
            maxLength={1000}
            placeholder="Cuéntanos cómo te fue…"
            onChange={(event) => setDraft((d) => ({ ...d, comment: event.target.value }))}
          />
        </label>
        {LIVE && !signedIn ? (
          <GoogleLogin purpose="rating" />
        ) : !LIVE ? (
          <div className="puc-access-note">
            <strong>Google es necesario para enviar</strong>
            <p>
              Esta vista local permite preparar tu opinión. Una cuenta de prueba no sustituye el
              acceso con Google.
            </p>
            <button className="button secondary" disabled>
              Continuar con Google
            </button>
          </div>
        ) : (
          <p className="puc-signed-in">Conectado como {user?.displayName}</p>
        )}
        {initial && (
          <p className="puc-small-note">Ya calificaste este lugar. Puedes actualizar tu opinión.</p>
        )}
        <button
          className="button puc-primary"
          type="submit"
          disabled={!LIVE || !signedIn || !draft.stars || saving}
        >
          {saving ? 'Guardando…' : initial ? 'Actualizar calificación' : 'Enviar calificación'}
        </button>
        {error && (
          <p role="alert" className="puc-form-error">
            {error}
          </p>
        )}
        {preview && (
          <div className="puc-preview-actions">
            <p>Vista de diseño · sin envío ni estadísticas reales</p>
            <button
              className="button secondary"
              type="button"
              disabled={!draft.stars}
              onClick={() => setExample(true)}
            >
              Ver confirmación de ejemplo
            </button>
          </div>
        )}
      </form>
      <Link className="button ghost" to={PUC_BASE + '/mapa?point=' + point.slug}>
        Ahora no
      </Link>
    </section>
  );
}
