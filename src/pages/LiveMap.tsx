import { matchesStand } from '@/services/stand-search';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Plus, Minus, RotateCcw } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { useLive } from '@/state/live';
import { Empty, Pill } from '@/ui/components';
import { livePlan } from '@/features/campus/live-plan';
import type { CampusCamera } from '@/features/campus/IndoorScene';
const IndoorScene = lazy(() => import('@/features/campus/IndoorScene'));
function Controls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();
  return (
    <div className="zoom-buttons">
      <button className="icon-button" aria-label="Acercar plano" onClick={() => zoomIn()}>
        <Plus size={18} />
      </button>
      <button className="icon-button" aria-label="Alejar plano" onClick={() => zoomOut()}>
        <Minus size={18} />
      </button>
      <button
        className="icon-button"
        aria-label="Restablecer plano"
        onClick={() => resetTransform()}
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
export function LiveMap() {
  const s = useLive();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const camera = useRef<CampusCamera | null>(null);
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.dataset.theme === 'dark'),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  const target = params.get('stand');
  const viewMode = params.get('view') === '2d' ? '2d' : '3d';
  const floor =
    s.map?.floors.find((f) => f.id === params.get('floor')) ||
    s.map?.floors.find((f) => f.stands.some((stand) => stand.standId === target)) ||
    s.map?.floors[0];
  const geometry = useMemo(() => (floor ? livePlan(floor) : null), [floor]);
  const selected = geometry?.stands.find((stand) => stand.standId === target);
  const setView = (view: '2d' | '3d') =>
    setParams({
      ...(floor ? { floor: floor.id } : {}),
      view,
      ...(target ? { stand: target } : {}),
    });
  const stands = s.stands.filter((stand) => matchesStand(stand, query));
  const view = floor?.viewBox.trim().split(/[ ,]+/).map(Number) || [0, 0, 1000, 1000];
  const [x, y, w, h] =
    view.length === 4 && view.every(Number.isFinite) && view[2] > 0 && view[3] > 0
      ? view
      : [0, 0, 1000, 1000];
  const coordinates = (px: number | null, py: number | null) => ({
    x: x + (px || 0) * w,
    y: y + (py || 0) * h,
  });
  return (
    <div className="stack map-page">
      <label className="search-field">
        <Search size={21} />
        <input
          aria-label="Buscar stands y empresas"
          placeholder="Buscar stands y empresas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {!!s.map?.floors.length && (
        <div className="catalog-chips">
          {s.map.floors.map((f) => (
            <button
              className={floor?.id === f.id ? 'selected' : ''}
              key={f.id}
              onClick={() => setParams({ floor: f.id, view: viewMode })}
            >
              {f.name}
              {f.levelLabel ? ` · ${f.levelLabel}` : ''}
            </button>
          ))}
        </div>
      )}
      {floor && geometry && !query && (
        <div className="live-map-modes" aria-label="Vista del mapa">
          <button aria-pressed={viewMode === '3d'} onClick={() => setView('3d')}>
            3D
          </button>
          <button aria-pressed={viewMode === '2d'} onClick={() => setView('2d')}>
            2D
          </button>
        </div>
      )}
      {floor && !query && (
        <>
          <div className="section-title">
            <span>
              <h2>{floor.name}</h2>
              <small className="muted">{floor.stands.length} stands en este plano</small>
            </span>
            <MapPin size={24} />
          </div>
          {viewMode === '3d' && geometry ? (
            <>
              <div className="indoor-viewer live-indoor-viewer" data-mode="3d">
                <Suspense
                  fallback={
                    <div className="campus-loading" role="status">
                      Preparando el plano 3D…
                    </div>
                  }
                >
                  <IndoorScene
                    key={`${floor.id}-${s.map?.version}`}
                    plan={geometry.plan}
                    lots={geometry.lots}
                    showAvatar={false}
                    dark={dark}
                    aerial={false}
                    position={geometry.plan.origin}
                    follow={false}
                    selectedLot={
                      geometry.stands.findIndex((stand) => stand.standId === target) < 0
                        ? null
                        : geometry.stands.findIndex((stand) => stand.standId === target)
                    }
                    onSelectLot={(index) =>
                      setParams({
                        floor: floor.id,
                        view: '3d',
                        stand: geometry.stands[index].standId,
                      })
                    }
                    cameraRef={camera}
                    onFailure={() => setView('2d')}
                  />
                </Suspense>
                <div className="indoor-zoom">
                  <button aria-label="Acercar mapa" onClick={() => camera.current?.zoom(1.2)}>
                    <Plus size={22} />
                  </button>
                  <button aria-label="Alejar mapa" onClick={() => camera.current?.zoom(1 / 1.2)}>
                    <Minus size={22} />
                  </button>
                  <button aria-label="Restablecer mapa" onClick={() => camera.current?.reset()}>
                    <RotateCcw size={19} />
                  </button>
                </div>
              </div>
              {selected && (
                <Link
                  className="card stand-result selected-map-stand"
                  to={`/stands/${selected.standId}`}
                >
                  <MapPin size={22} />
                  <span className="grow">
                    <strong>{selected.displayName}</strong>
                    <small>{selected.boothCode}</small>
                  </span>
                  <ChevronRight size={18} />
                </Link>
              )}
              <p className="footnote">
                Arrastra para mover · pellizca para acercar · toca un stand para abrir su ficha.
              </p>
            </>
          ) : (
            <div className="floor-viewport">
              <TransformWrapper key={floor.id} minScale={0.8} maxScale={5} centerOnInit>
                <Controls />
                <TransformComponent
                  wrapperStyle={{ width: '100%', height: '100%' }}
                  contentStyle={{ width: '100%', height: '100%' }}
                >
                  <svg
                    className="floor-svg"
                    viewBox={`${x} ${y} ${w} ${h}`}
                    aria-label={`Plano de ${floor.name}; también puedes usar la lista inferior`}
                  >
                    {!floor.outline && floor.svgUrl && /^https?:\/\//.test(floor.svgUrl) && (
                      <image href={floor.svgUrl} x={x} y={y} width={w} height={h} />
                    )}
                    {floor.outline && (
                      <path
                        d={floor.outline}
                        fill="var(--surface)"
                        stroke="var(--muted)"
                        strokeWidth={w / 250}
                      />
                    )}
                    {floor.zones.map((zone) => (
                      <g key={zone.id}>
                        {zone.path && (
                          <path
                            d={zone.path}
                            fill="var(--blue)"
                            fillOpacity=".06"
                            stroke="var(--border)"
                          />
                        )}
                        {zone.labelX != null && zone.labelY != null && (
                          <text
                            {...coordinates(zone.labelX, zone.labelY)}
                            fill="var(--muted)"
                            fontSize={w / 45}
                            textAnchor="middle"
                          >
                            {zone.name}
                          </text>
                        )}
                      </g>
                    ))}
                    {floor.structures.map((structure) => (
                      <g key={structure.id}>
                        <path
                          d={structure.path}
                          fill="var(--surface-muted)"
                          stroke="var(--border)"
                        />
                        {structure.label && (
                          <text
                            x={structure.labelX ?? undefined}
                            y={structure.labelY ?? undefined}
                            fill="var(--muted)"
                            fontSize={w / 60}
                            textAnchor="middle"
                          >
                            {structure.label}
                          </text>
                        )}
                      </g>
                    ))}
                    {floor.pois.map((poi) => (
                      <g key={poi.id}>
                        <circle
                          cx={coordinates(poi.x, poi.y).x}
                          cy={coordinates(poi.x, poi.y).y}
                          r={w / 100}
                          fill="#d8a137"
                        />
                        <title>{poi.label}</title>
                      </g>
                    ))}
                    {floor.stands.map((stand) => {
                      const p = coordinates(stand.x, stand.y);
                      const sw = (stand.width || 0.035) * w;
                      const sh = (stand.height || 0.035) * h;
                      const visited = s.visits.some((v) => v.standId === stand.standId);
                      return (
                        <Link
                          to={`/stands/${stand.standId}`}
                          key={stand.standId}
                          aria-label={`${stand.displayName}, stand ${stand.boothCode}`}
                        >
                          <g transform={`rotate(${stand.rotation || 0} ${p.x} ${p.y})`}>
                            <rect
                              x={p.x - sw / 2}
                              y={p.y - sh / 2}
                              width={sw}
                              height={sh}
                              rx={w / 400}
                              fill={
                                target === stand.standId
                                  ? '#d4a12d'
                                  : visited
                                    ? '#2e9e68'
                                    : '#087ec2'
                              }
                              stroke="var(--surface)"
                              strokeWidth={w / 500}
                            />
                            <text
                              x={p.x}
                              y={p.y + w / 200}
                              textAnchor="middle"
                              fontSize={Math.min(sw / 4, w / 55)}
                              fill="#fff"
                            >
                              {stand.boothCode}
                            </text>
                          </g>
                          <title>{stand.displayName}</title>
                        </Link>
                      );
                    })}
                  </svg>
                </TransformComponent>
              </TransformWrapper>
            </div>
          )}
          {viewMode === '2d' && (
            <p className="footnote">Pellizca para acercar · toca un stand para ver su perfil.</p>
          )}
        </>
      )}
      <h3>{query ? 'Resultados' : floor ? 'Stands en el recinto' : 'Explorar stands'}</h3>
      {!floor && !query && (
        <p className="muted">
          El plano se mostrará cuando lo publique la organización. Puedes explorar el catálogo.
        </p>
      )}
      {stands.map((stand) => (
        <Link className="card stand-result" key={stand.id} to={`/stands/${stand.id}`}>
          <MapPin size={22} />
          <span className="grow">
            <strong>{stand.name}</strong>
            <small>
              {stand.boothCode} · {stand.categoryLabel}
            </small>
          </span>
          {s.visits.some((v) => v.standId === stand.id) && <Pill tone="green">Visitado</Pill>}
          <ChevronRight size={18} />
        </Link>
      ))}
      {!stands.length && !s.catalogLoading && (
        <Empty title={query ? 'Sin coincidencias' : 'Esperando los stands'}>
          {query
            ? 'Prueba con otro nombre o número de stand.'
            : 'El catálogo aparecerá cuando conectemos con la feria.'}
        </Empty>
      )}
    </div>
  );
}
