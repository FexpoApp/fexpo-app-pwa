import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { get, set } from 'idb-keyval';
import { request } from '@/services/api';
import { EVENT_ID, UUID } from '@/services/config';
import { useLive, normalizeStand, message } from '@/state/live';
import { Empty } from '@/ui/components';
import { StandProfile } from '@/ui/StandProfile';
import type { StandDto } from '@/types/api';
import type { Stand } from '@/types/domain';
export function LiveStand() {
  const { id = '' } = useParams();
  const catalog = useLive((s) => s.stands);
  const [detail, setDetail] = useState<Stand | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const stand = detail?.id === id ? detail : catalog.find((s) => s.id === id);
  useEffect(() => {
    let active = true;
    setDetail(null);
    setError('');
    setLoading(true);
    if (!UUID.test(id)) {
      setError('El identificador del stand no es válido.');
      setLoading(false);
      return;
    }
    const key = `fexpo-stand-detail-v2:${EVENT_ID}:${id}`;
    void (async () => {
      const cached = await get<Stand>(key).catch(() => undefined);
      if (active && cached) setDetail(cached);
      try {
        const item = normalizeStand((await request<StandDto>(`/stands/${id}`)).data);
        if (active) setDetail(item);
        await set(key, item).catch(() => {});
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, attempt]);
  if (!stand)
    return (
      <Empty
        title={loading ? 'Buscando el stand…' : 'No pudimos abrir el stand'}
        action={
          <Link className="button" to="/stands">
            Explorar stands
          </Link>
        }
      >
        {error || 'Preparando su perfil.'}
      </Empty>
    );
  return (
    <>
      {error && (
        <div className="card stack" role="status">
          <p>{error} Se muestra la información guardada.</p>
          <button className="button secondary" onClick={() => setAttempt((n) => n + 1)}>
            Actualizar perfil
          </button>
        </div>
      )}
      <StandProfile key={stand.id} stand={stand} />
    </>
  );
}
