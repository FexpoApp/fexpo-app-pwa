import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActivityDto } from '../../src/types/api';
import {
  dateInLaPaz,
  dayLabel,
  DEMO_PROGRAMME,
  fairDays,
  fromPublishedActivity,
  programmeForDay,
  programmeTime,
  mergeProgramme,
  selectedFairDay,
} from '../../src/features/fair/programme';
import { activeAdvertisements, DEMO_ADVERTISEMENTS } from '../../src/features/advertising/model';
import { request } from '../../src/services/api';
import { loadProgramme } from '../../src/features/fair/load-programme';
import { OFFICIAL_PUBLICATIONS } from '../../src/features/fair/publications';

vi.mock('../../src/services/api', () => ({ request: vi.fn() }));

const activity: ActivityDto = {
  id: 'activity-1',
  title: 'Encuentro publicado',
  description: null,
  startsAt: '2026-11-01T20:00:00-04:00',
  endsAt: null,
  status: 'scheduled',
  locationText: 'Escenario principal',
  standId: null,
};

describe('agenda de la feria', () => {
  beforeEach(() => vi.resetAllMocks());

  it('incluye los doce días de feria atravesando el cambio de mes', () => {
    const days = fairDays();
    expect(days).toHaveLength(12);
    expect(days[0]).toBe('2026-10-28');
    expect(days.at(-1)).toBe('2026-11-08');
    expect(new Set(days).size).toBe(days.length);
    expect(dayLabel('2026-11-01')).toMatch(/domingo/);
  });

  it('usa el día y hora de La Paz, independientemente de la zona del dispositivo', () => {
    expect(dateInLaPaz('2026-11-02T02:30:00Z')).toBe('2026-11-01');
    expect(programmeTime('2026-11-02T02:30:00Z')).toBe('22:30');
    expect(dateInLaPaz('not-a-date')).toBe('');
  });

  it('restaura un día compartido válido y limita fechas fuera del evento', () => {
    expect(selectedFairDay('2026-11-07', Date.parse('2026-11-01T14:00:00Z'))).toBe('2026-11-07');
    expect(selectedFairDay('2026-11-99', Date.parse('2026-11-01T14:00:00Z'))).toBe('2026-11-01');
    expect(selectedFairDay(null, Date.parse('2026-10-01T14:00:00Z'))).toBe('2026-10-28');
    expect(selectedFairDay(null, Date.parse('2026-12-01T14:00:00Z'))).toBe('2026-11-08');
  });

  it('no convierte borradores, cancelaciones ni fechas inválidas en actividades publicadas', () => {
    expect(fromPublishedActivity({ ...activity, status: 'draft' })).toBeNull();
    expect(fromPublishedActivity({ ...activity, status: 'cancelled' })).toBeNull();
    expect(fromPublishedActivity({ ...activity, startsAt: null })).toBeNull();
    expect(fromPublishedActivity({ ...activity, title: ' ' })).toBeNull();
    expect(fromPublishedActivity(activity)).toMatchObject({
      location: 'Escenario principal',
      example: false,
    });
  });

  it('ordena cronológicamente y filtra por la fecha local de inicio', () => {
    const first = fromPublishedActivity({
      ...activity,
      id: 'early',
      startsAt: '2026-11-01T17:00:00-04:00',
    })!;
    const last = fromPublishedActivity({
      ...activity,
      id: 'late',
      startsAt: '2026-11-02T02:30:00Z',
    })!;
    const tomorrow = fromPublishedActivity({
      ...activity,
      id: 'tomorrow',
      startsAt: '2026-11-02T12:00:00Z',
    })!;
    expect(programmeForDay([tomorrow, last, first], '2026-11-01').map((item) => item.id)).toEqual([
      'early',
      'late',
    ]);
    expect(DEMO_PROGRAMME.every((item) => item.example)).toBe(true);
  });

  it('lee todas las páginas, deduplica y rechaza datos de otro evento', async () => {
    vi.mocked(request)
      .mockResolvedValueOnce({
        success: true,
        data: [{ ...activity, eventId: 'our-event' }],
        meta: { page: 1, limit: 100, total: 3, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: [activity, { ...activity, id: 'foreign', eventId: 'other-event' }],
        meta: { page: 2, limit: 100, total: 3, totalPages: 2 },
      });
    expect(await loadProgramme('our-event')).toHaveLength(1);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith('/events/our-event/activities?page=2&limit=100');
  });

  it('no sustituye una agenda caída por contenido de demostración', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('offline'));
    await expect(loadProgramme('our-event')).rejects.toThrow('offline');
  });

  it('no inventa horas de conciertos ni reutiliza la cartelera antigua', () => {
    const today = programmeForDay(OFFICIAL_PUBLICATIONS, '2026-11-01');
    expect(today).toHaveLength(6);
    expect(today.every((item) => item.startsAt === null && !item.example)).toBe(true);
    expect(programmeForDay(OFFICIAL_PUBLICATIONS, '2026-11-02')[0].startsAt).toBe(
      '2026-11-02T18:00:00-04:00',
    );
    expect(OFFICIAL_PUBLICATIONS.some((item) => /2023|Bonny Lovy|Matamba/i.test(item.title))).toBe(
      false,
    );
  });

  it('prioriza la hora de API y no mezcla ejemplos en un día con afiches reales', () => {
    const poster = OFFICIAL_PUBLICATIONS[0];
    const api = {
      ...poster,
      id: 'api-show',
      startsAt: '2026-11-01T20:30:00-04:00',
      poster: undefined,
    };
    const items = mergeProgramme([api], OFFICIAL_PUBLICATIONS, DEMO_PROGRAMME);
    const today = programmeForDay(items, '2026-11-01');
    expect(today).toHaveLength(6);
    expect(today[0].id).toBe('api-show');
    expect(today.some((item) => item.example)).toBe(false);
    expect(programmeForDay(items, '2026-11-07').every((item) => item.example)).toBe(true);
  });

  it('informa cancelaciones devueltas por la API para retirar afiches coincidentes', async () => {
    const withdrawn = vi.fn();
    vi.mocked(request).mockResolvedValueOnce({
      success: true,
      data: [{ ...activity, status: 'cancelled' }],
      meta: null,
    });
    expect(await loadProgramme('our-event', withdrawn)).toEqual([]);
    expect(withdrawn).toHaveBeenCalledWith([expect.objectContaining({ status: 'cancelled' })]);
  });
});

describe('publicidad separada del catálogo', () => {
  const now = Date.parse('2026-11-01T16:00:00-04:00');
  it('solo admite campañas publicadas del evento y dentro de vigencia', () => {
    const sample = DEMO_ADVERTISEMENTS[0];
    expect(
      activeAdvertisements(
        [
          sample,
          { ...sample, id: 'draft', status: 'draft' },
          { ...sample, id: 'foreign', eventId: 'another-event' },
          { ...sample, id: 'expired', endsAt: '2026-11-01T16:00:00-04:00' },
          { ...sample, id: 'future', startsAt: '2026-11-02T16:00:00-04:00' },
          { ...sample, id: 'invalid', endsAt: 'invalid' },
        ],
        sample.eventId,
        now,
      ).map((item) => item.id),
    ).toEqual([sample.id]);
  });
});
