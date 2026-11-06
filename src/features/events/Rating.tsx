import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Check, MapPin, Star, ArrowRight } from 'lucide-react';
import { LIVE } from '@/services/config';
import { useLive } from '@/state/live';
import { GoogleLogin } from '@/ui/GoogleLogin';
import { PUC_BASE, pucExperience, experienceUrl, type PucExperience } from './catalog';
import { PucNotFound } from './Pages';
import { markPucScanned } from './progress';
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
function useDraft(point: string, userId: string | undefined) {
  const [owner, setOwner] = useState(userId || 'guest');
  const [draft, setDraft] = useState<Draft>(
    () => readDraft(draftKey(point, userId || 'guest')) || empty(),
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
  return point ? <RatingForm key={point.slug} point={point} /> : <PucNotFound />;
}
function RatingForm({ point }: { point: PucExperience }) {
  const [params] = useSearchParams();
  const preview = !LIVE && params.get('preview') === '1';
  const viaQr = params.get('via') === 'qr';
  useEffect(() => {
    if (viaQr) markPucScanned(point.slug);
  }, [viaQr, point.slug]);
  const user = useLive((s) => s.user);
  const signedIn = useLive((s) => s.status === 'signedIn');
  const [draft, setDraft] = useDraft(point.slug, user?.id);
  const [example, setExample] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  if (example)
    return (
      <section className="puc-rating-success">
        <p className="puc-preview-label">Vista de diseño · ninguna opinión enviada</p>
        <span className="puc-success-mark">
          <Check size={35} />
        </span>
        <h1>¡Gracias por tu opinión!</h1>
        <p>Así se verá la confirmación cuando el servidor guarde tu calificación.</p>
        <div className="puc-rating-target">
          <span className="puc-step">{point.order}</span>
          <div>
            <strong>{point.shortName}</strong>
            <small>GAMLP · Ciudad Productiva</small>
            <span className="puc-star-summary" aria-label={`${draft.stars} de 5 estrellas`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={21} fill={n <= draft.stars ? 'currentColor' : 'none'} />
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
        <button className="button ghost" onClick={() => setExample(false)}>
          Volver al borrador
        </button>
      </section>
    );
  return (
    <section className="puc-rating-page">
      <span className="puc-label">PUNTO {point.order} DE 5 · GAMLP</span>
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
        onSubmit={(event) => {
          event.preventDefault();
          setError(
            !LIVE || !signedIn
              ? 'Necesitas iniciar sesión con Google para enviar tu opinión.'
              : 'El envío todavía no está habilitado para esta feria. Conservamos tu borrador.',
          );
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
        <p className="puc-small-note">
          El envío de opiniones se habilitará próximamente. Tu borrador no cuenta como una
          calificación.
        </p>
        <button
          className="button puc-primary"
          type="submit"
          disabled={!LIVE || !signedIn || !draft.stars}
        >
          Enviar calificación
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
