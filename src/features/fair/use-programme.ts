import { useEffect, useState } from 'react';
import { LIVE, EVENT_ID, eventReady } from '@/services/config';
import { loadProgramme } from './load-programme';
import { DEMO_PROGRAMME, dateInLaPaz, mergeProgramme, type ProgrammeItem } from './programme';
import { OFFICIAL_PUBLICATIONS } from './publications';

export function useProgramme() {
  const [published, setPublished] = useState<readonly ProgrammeItem[]>([]);
  const [loading, setLoading] = useState(LIVE && eventReady);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [withdrawn, setWithdrawn] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!LIVE || !eventReady) return;
    let active = true;
    setLoading(true);
    setError('');
    loadProgramme(EVENT_ID, (items) => {
      if (active)
        setWithdrawn(
          new Set(
            items.map(
              (item) =>
                `${dateInLaPaz(item.startsAt || '')}:${item.title.trim().toLocaleLowerCase()}`,
            ),
          ),
        );
    })
      .then((items) => {
        if (active) setPublished(items);
      })
      .catch(() => {
        if (active)
          setError(
            'No pudimos actualizar la agenda. Puedes consultar los afiches disponibles o reintentar.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return {
    items: mergeProgramme(
      published,
      OFFICIAL_PUBLICATIONS.filter(
        (item) => !withdrawn.has(`${item.day}:${item.title.trim().toLocaleLowerCase()}`),
      ),
      LIVE ? [] : DEMO_PROGRAMME,
    ),
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}
