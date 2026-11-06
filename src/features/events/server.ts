import { create } from 'zustand';
import { request, ApiError } from '@/services/api';
import { useLive } from '@/state/live';
import { hasPucRatingAccess, readPucScan } from './scan-access';
import { PUC_SLUG } from './catalog';
import type {
  ResolvedEventDto,
  ExperienceProgressDto,
  ExperienceRatingResultDto,
  ExperienceScanResultDto,
} from '@/types/api';

type ServerState = {
  catalog: ResolvedEventDto | null;
  owner: string | null;
  progress: ExperienceProgressDto | null;
  loading: boolean;
  error: string;
};
export const usePucServer = create<ServerState>(() => ({
  catalog: null,
  owner: null,
  progress: null,
  loading: false,
  error: '',
}));
let catalogFlight: Promise<ResolvedEventDto> | null = null;
let catalogLoadedAt = 0;
const scans = new Map<string, Promise<ExperienceScanResultDto>>();
let epoch = 0;
useLive.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id || state.status !== previous.status) {
    epoch++;
    scans.clear();
    usePucServer.setState({
      owner: state.user?.id || null,
      progress: null,
      loading: false,
      error: '',
    });
  }
});
function assertOwner(owner: string, generation: number) {
  const state = useLive.getState();
  if (
    generation !== epoch ||
    state.status !== 'signedIn' ||
    state.user?.id !== owner ||
    state.user.authProvider !== 'google'
  )
    throw new ApiError('SESSION_CHANGED', 'La sesión cambió. Inicia sesión con Google.');
}
export async function resolvePucEvent() {
  if (usePucServer.getState().catalog && Date.now() - catalogLoadedAt < 60_000)
    return usePucServer.getState().catalog!;
  if (catalogFlight) return catalogFlight;
  const work = request<ResolvedEventDto>(`/events/resolve/${PUC_SLUG}`).then(({ data }) => {
    if (
      data.slug !== PUC_SLUG ||
      !/^[\da-f-]{36}$/i.test(data.id) ||
      !Array.isArray(data.experiences)
    )
      throw new ApiError('INVALID_EVENT', 'No pudimos cargar esta feria. Reintenta.');
    usePucServer.setState({ catalog: data });
    catalogLoadedAt = Date.now();
    return data;
  });
  catalogFlight = work;
  try {
    return await work;
  } finally {
    if (catalogFlight === work) catalogFlight = null;
  }
}
async function pointIds(slug: string) {
  const event = await resolvePucEvent();
  const point = event.experiences.find((p) => p.slug === slug);
  if (!point)
    throw new ApiError(
      'EXPERIENCE_UNPUBLISHED',
      'La calificación de este punto todavía no está disponible.',
    );
  return { eventId: event.id, experienceId: point.id };
}
let progressFlight: {
  owner: string;
  generation: number;
  promise: Promise<ExperienceProgressDto>;
} | null = null;
export async function syncPucProgress(owner: string) {
  const generation = epoch;
  assertOwner(owner, generation);
  if (progressFlight?.owner === owner && progressFlight.generation === generation)
    return progressFlight.promise;
  usePucServer.setState({ owner, loading: true, error: '' });
  const work = (async () => {
    const event = await resolvePucEvent();
    assertOwner(owner, generation);
    const { data } = await request<ExperienceProgressDto>(
      `/events/${event.id}/experience-progress`,
      { auth: true },
    );
    assertOwner(owner, generation);
    if (data.eventId !== event.id || !Array.isArray(data.experiences))
      throw new ApiError('INVALID_PROGRESS', 'No pudimos leer tu avance.');
    usePucServer.setState({ progress: data, owner, loading: false, error: '' });
    return data;
  })().catch((error) => {
    if (generation === epoch)
      usePucServer.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'No pudimos cargar tu avance.',
      });
    throw error;
  });
  progressFlight = { owner, generation, promise: work };
  try {
    return await work;
  } finally {
    if (progressFlight?.promise === work) progressFlight = null;
  }
}
export async function ensurePucScan(slug: string, owner: string) {
  const generation = epoch;
  assertOwner(owner, generation);
  const scan = readPucScan(slug, owner);
  if (!scan)
    throw new ApiError('QR_SCAN_REQUIRED', 'Escanea el QR de este lugar antes de calificar.');
  const key = `${owner}:${slug}:${scan.requestKey}`;
  if (scans.has(key)) return scans.get(key)!;
  const work = (async () => {
    const ids = await pointIds(slug);
    assertOwner(owner, generation);
    const { data } = await request<ExperienceScanResultDto>(
      `/events/${ids.eventId}/experiences/${ids.experienceId}/scans`,
      {
        auth: true,
        method: 'POST',
        body: { source: scan.source, requestKey: scan.requestKey },
      },
    );
    assertOwner(owner, generation);
    const previous = usePucServer.getState().progress;
    if (previous && usePucServer.getState().owner === owner)
      usePucServer.setState({
        progress: {
          ...previous,
          progress: data.progress,
          experiences: previous.experiences.map((p) =>
            p.slug === slug ? { ...p, scannedAt: data.scan.lastScannedAt } : p,
          ),
        },
      });
    return data;
  })();
  scans.set(key, work);
  try {
    return await work;
  } catch (error) {
    scans.delete(key);
    throw error;
  }
}
export async function savePucRating(slug: string, owner: string, stars: number, comment: string) {
  const generation = epoch;
  assertOwner(owner, generation);
  if (!hasPucRatingAccess(slug, owner))
    throw new ApiError('QR_SCAN_REQUIRED', 'Escanea nuevamente el QR de este lugar.');
  if (!Number.isInteger(stars) || stars < 1 || stars > 5 || comment.length > 1000)
    throw new ApiError(
      'VALIDATION_ERROR',
      'Elige de 1 a 5 estrellas y un comentario de hasta 1.000 caracteres.',
    );
  const ids = await pointIds(slug);
  await ensurePucScan(slug, owner);
  assertOwner(owner, generation);
  const payload = JSON.stringify({ stars, comment: comment.trim() });
  const key = `fexpo-rating-request-v1:${PUC_SLUG}:${encodeURIComponent(owner)}:${slug}`;
  let operation: { payload: string; requestKey: string } | null = null;
  try {
    operation = JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {
    /* New operation. */
  }
  if (!operation || operation.payload !== payload)
    operation = { payload, requestKey: crypto.randomUUID() };
  sessionStorage.setItem(key, JSON.stringify(operation));
  try {
    const { data } = await request<ExperienceRatingResultDto>(
      `/events/${ids.eventId}/experiences/${ids.experienceId}/my-rating`,
      {
        auth: true,
        method: 'PUT',
        body: {
          stars,
          ...(comment.trim() ? { comment: comment.trim() } : {}),
          requestKey: operation.requestKey,
        },
      },
    );
    assertOwner(owner, generation);
    if (
      !data.rating?.id ||
      data.rating.eventId !== ids.eventId ||
      data.rating.experienceId !== ids.experienceId
    )
      throw new ApiError('INVALID_RATING', 'No pudimos confirmar el guardado. Reintenta.');
    const previous = usePucServer.getState().progress;
    if (previous && usePucServer.getState().owner === owner)
      usePucServer.setState({
        progress: {
          ...previous,
          progress: data.progress,
          experiences: previous.experiences.map((p) =>
            p.slug === slug ? { ...p, myRating: data.rating, status: 'complete' } : p,
          ),
        },
      });
    sessionStorage.removeItem(key);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) sessionStorage.removeItem(key);
    throw error;
  }
}
