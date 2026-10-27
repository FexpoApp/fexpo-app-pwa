import { lazy, Suspense } from 'react';
import { LIVE } from '@/services/config';
import { LiveMap } from './LiveMap';
import { useLive } from '@/state/live';
import { PLAN_GEOMETRY } from '@/data/map-plans';
import '@/features/campus/campus.css';
const CampusMap = lazy(() => import('@/features/campus/CampusMap'));
export function MapPage() {
  const map = useLive((state) => state.map);
  const campusPublished =
    !LIVE ||
    (!!map?.floors.length &&
      map.floors.every((floor) =>
        PLAN_GEOMETRY.some(
          (plan) =>
            plan.name === floor.name &&
            plan.outline === floor.outline &&
            plan.viewBox === floor.viewBox,
        ),
      ));
  return LIVE && !campusPublished ? (
    <LiveMap />
  ) : (
    <Suspense
      fallback={
        <div className="loading-view" role="status">
          Cargando el recinto…
        </div>
      }
    >
      <CampusMap />
    </Suspense>
  );
}
