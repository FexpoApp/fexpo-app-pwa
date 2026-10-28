import { matchesStand } from '@/services/stand-search';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Minus, RotateCcw, ChevronRight } from 'lucide-react';
import { useLive } from '@/state/live';
import { CategoryTile, Empty } from '@/ui/components';
import { BottomSheet } from '@/ui/BottomSheet';
import { livePlan } from '@/features/campus/live-plan';
import IndoorPlan from '@/features/campus/IndoorPlan';
import type { CampusCamera } from '@/features/campus/IndoorScene';
const Scene = lazy(() => import('@/features/campus/IndoorScene'));

export function LiveMap() {
  const s = useLive(),
    [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(''),
    [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const camera = useRef<CampusCamera | null>(null);
  useEffect(() => {
    const o = new MutationObserver(() =>
      setDark(document.documentElement.dataset.theme === 'dark'),
    );
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => o.disconnect();
  }, []);
  const target = params.get('stand'),
    mode = params.get('view') === '3d' ? '3d' : '2d';
  const floor =
    s.map?.floors.find((f) => f.id === params.get('floor')) ||
    s.map?.floors.find((f) => f.stands.some((p) => p.standId === target)) ||
    s.map?.floors[0];
  const geometry = useMemo(() => (floor ? livePlan(floor) : null), [floor]);
  const selectedIndex = geometry?.stands.findIndex((p) => p.standId === target) ?? -1;
  const selectedStand = s.stands.find((p) => p.id === target);
  const results = s.stands.filter((p) => matchesStand(p, query));
  const goStand = (id: string, detail = false) => {
    setQuery('');
    setParams({ stand: id, view: '2d', ...(detail ? { detail: '1' } : {}) }, { replace: true });
  };
  const closeSheet = () => {
    const next = new URLSearchParams(params);
    next.delete('detail');
    setParams(next, { replace: true });
  };
  const setMode = (view: '2d' | '3d') => {
    const next = new URLSearchParams(params);
    next.set('view', view);
    setParams(next, { replace: true });
  };
  if (!floor || !geometry)
    return (
      <Empty title="Esperando el plano publicado">
        La organización todavía no publicó una geometría válida para este piso.
      </Empty>
    );
  return (
    <section className="indoor-experience compact-map" aria-label="Mapa publicado FIPAZ">
      <div className="indoor-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Buscar stands y empresas"
            placeholder="Buscar stands y empresas"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="building-chips">
          <button onClick={() => setParams({ plan: 'general', view: '2d' })}>General</button>
          {s.map?.floors.map((f) => (
            <button
              key={f.id}
              aria-pressed={f.id === floor.id}
              onClick={() => setParams({ floor: f.id, view: mode })}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="compact-floor-heading">
          <h2>{floor.name}</h2>
          <small>{floor.levelLabel}</small>
        </div>
        {query && (
          <div className="indoor-results">
            {results.map((p) => (
              <button className="stand-result" key={p.id} onClick={() => goStand(p.id)}>
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.boothCode}</small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
            {!results.length && <p>No encontramos ese stand.</p>}
          </div>
        )}
      </div>
      <div className="indoor-viewer" data-mode={mode} data-plan-id={floor.id}>
        {mode === '2d' ? (
          <IndoorPlan
            plan={geometry.plan}
            lots={geometry.lots}
            lotStands={geometry.stands.map((p) => s.stands.find((st) => st.id === p.standId))}
            lotRotations={geometry.stands.map((p) => p.rotation)}
            position={geometry.plan.origin}
            showAvatar={false}
            selectedLot={selectedIndex < 0 ? null : selectedIndex}
            focusSelection={selectedIndex >= 0}
            onSelectLot={(i) => goStand(geometry.stands[i].standId, true)}
            cameraRef={camera}
            backgroundSvgUrl={!floor.outline ? (floor.svgUrl ?? undefined) : undefined}
          />
        ) : (
          <Suspense fallback={<div className="campus-loading">Preparando el plano 3D…</div>}>
            <Scene
              plan={geometry.plan}
              lots={geometry.lots}
              showAvatar={false}
              dark={dark}
              aerial={false}
              position={geometry.plan.origin}
              follow={false}
              selectedLot={selectedIndex < 0 ? null : selectedIndex}
              onSelectLot={(i) => goStand(geometry.stands[i].standId, true)}
              cameraRef={camera}
              onFailure={() => setMode('2d')}
            />
          </Suspense>
        )}
        <div className="indoor-zoom">
          <button aria-label="Acercar mapa" onClick={() => camera.current?.zoom(1.2)}>
            <Plus size={21} />
          </button>
          <button aria-label="Alejar mapa" onClick={() => camera.current?.zoom(1 / 1.2)}>
            <Minus size={21} />
          </button>
          <button aria-label="Restablecer mapa" onClick={() => camera.current?.reset()}>
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="map-footer-controls">
          <div className="indoor-modes">
            <button aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>
              2D
            </button>
            <button aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>
              3D
            </button>
          </div>
        </div>
      </div>
      {selectedStand && params.get('detail') === '1' && (
        <BottomSheet title={selectedStand.name} onClose={closeSheet}>
          <div className="sheet-stand-summary">
            <CategoryTile category={selectedStand.category} />
            <span>
              <strong>{selectedStand.boothCode}</strong>
              <small>{floor.name}</small>
            </span>
          </div>
          <div className="sheet-actions">
            <Link className="button" to={'/stands/' + selectedStand.id}>
              Ver perfil
              <ChevronRight size={17} />
            </Link>
          </div>
        </BottomSheet>
      )}
    </section>
  );
}
