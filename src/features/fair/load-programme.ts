import { request } from '@/services/api';
import type { ActivityDto } from '@/types/api';
import { fromPublishedActivity, type ProgrammeItem } from './programme';

export async function loadProgramme(
  eventId: string,
  onWithdrawn?: (items: ActivityDto[]) => void,
): Promise<ProgrammeItem[]> {
  const items = new Map<string, ProgrammeItem>();
  const withdrawn: ActivityDto[] = [];
  for (let page = 1; page <= 50; page++) {
    const response = await request<ActivityDto[]>(
      `/events/${eventId}/activities?page=${page}&limit=100`,
    );
    for (const activity of response.data) {
      // An older deployment may omit eventId; an explicit foreign event is never displayed.
      if (activity.eventId && activity.eventId !== eventId) continue;
      if (['cancelled', 'canceled'].includes(activity.status ?? '')) withdrawn.push(activity);
      const item = fromPublishedActivity(activity);
      if (item) items.set(item.id, item);
    }
    if (!response.meta || page >= response.meta.totalPages) {
      onWithdrawn?.(withdrawn);
      return [...items.values()];
    }
  }
  throw new Error('La agenda es demasiado extensa para cargarla en este momento.');
}
