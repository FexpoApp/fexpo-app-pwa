import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { Plus, Minus, RotateCcw, ScanLine, ArrowUpRight } from 'lucide-react';
import type { CampusCamera } from '@/features/campus/IndoorScene';
import { PUC_PLAN, PUC_LOTS, PUC_LOT_EXPERIENCES, PUC_DOME } from './geometry';
import { PUC_BASE, PUC_EXPERIENCES, pucExperience, experienceUrl } from './catalog';
import '@/features/campus/campus.css';
const Scene = lazy(() => import('@/features/campus/IndoorScene'));
function PlanControls({ camera }: { camera: React.RefObject<CampusCamera | null> }) {
  const controls = useControls();
  useEffect(() => {
    camera.current = {
      zoom: (f) => (f > 1 ? controls.zoomIn() : controls.zoomOut()),
      reset: () => controls.resetTransform(),
      rotate: () => {},
      follow: () => controls.centerView(),
    };
    return () => {
      camera.current = null;
    };
  }, [controls, camera]);
  return null;
}
const labels: Record<string, string[]> = {
  '1': ['Actividades', 'Económicas', 'y Mercados'],
  '2': ['Nuevos', 'mercados'],
  '3A': ['Desarrollo Económico,'],
  '3B': ['Competitividad', 'e Inversiones'],
  '4': ['CITEs'],
  '5': ['Unidad', 'Publicidad'],
};
export function PucMapPage() {
  const [params, setParams] = useSearchParams();
  const point = pucExperience(params.get('point') || '');
  const mode = params.get('view') === '3d' ? '3d' : '2d';
  const [failed, setFailed] = useState(false);
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
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }
  const selected = point
    ? PUC_LOT_EXPERIENCES.indexOf(point.slug as (typeof PUC_LOT_EXPERIENCES)[number])
    : -1;
  return (
    <section className="puc-map-page" aria-label="Mapa de Ciudad Productiva">
      <div className="puc-map-heading">
        <h1>Mapa del recorrido</h1>
        <div className="puc-map-modes" aria-label="Vista del mapa">
          <button aria-pressed={mode === '2d'} onClick={() => change('view', '2d')}>
            2D
          </button>
          <button
            aria-pressed={mode === '3d'}
            onClick={() => {
              setFailed(false);
              change('view', '3d');
            }}
          >
            3D
          </button>
        </div>
      </div>
      <p className="puc-small-note">Ingreso por la derecha · salida por la izquierda</p>
      <div className="puc-map-stage indoor-viewer" data-puc-view={mode}>
        {mode === '2d' ? (
          <TransformWrapper minScale={0.8} maxScale={4} centerOnInit limitToBounds={false}>
            <PlanControls camera={camera} />
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <svg
                className="puc-plan"
                viewBox={PUC_PLAN.viewBox}
                aria-label="Plano del recorrido municipal"
              >
                <defs>
                  <marker
                    id="puc-arrow"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0 0 6 3 0 6" fill="none" stroke="#132d46" strokeWidth="1.5" />
                  </marker>
                </defs>
                <g fill="none" stroke="#132d46" strokeWidth="4" markerEnd="url(#puc-arrow)">
                  <path d="M690 837V792" />
                  <path d="M800 690H825V425H785" />
                  <path d="M690 290V260" />
                  <path d="M210 255V288" />
                  <path d="M210 562V593" />
                  <path d="M260 795V838" />
                </g>
                {PUC_LOTS.map(([id, x, y, w, h], i) => {
                  const p = pucExperience(PUC_LOT_EXPERIENCES[i])!;
                  const active = point?.slug === p.slug;
                  return (
                    <g
                      key={id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Punto ${p.order}: ${p.name}`}
                      data-puc-lot={id}
                      data-experience={p.slug}
                      data-selected={active}
                      onClick={() => change('point', p.slug)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          change('point', p.slug);
                        }
                      }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={4}
                        fill={active ? '#d5f24a' : p.type === 'tunel' ? '#dce7e5' : '#f8f8f2'}
                        stroke="#132d46"
                        strokeWidth={active ? 6 : 3}
                      />
                      <circle cx={x + 24} cy={y + 25} r={17} fill="#132d46" />
                      <text
                        x={x + 24}
                        y={y + 33}
                        textAnchor="middle"
                        fontSize={23}
                        fontWeight={700}
                        fill="white"
                      >
                        {p.order}
                      </text>
                      {labels[String(id)].map((line, j) => (
                        <text
                          key={line}
                          x={x + w / 2}
                          y={y + h / 2 + (j - (labels[String(id)].length - 1) / 2) * 29 + 10}
                          textAnchor="middle"
                          fontSize={String(id).startsWith('3') ? 23 : 25}
                          fontWeight={650}
                          fill="#132d46"
                        >
                          {line}
                        </text>
                      ))}
                    </g>
                  );
                })}
                <g
                  aria-label="Punto 6: Domo de Ciudad Productiva"
                  role="button"
                  tabIndex={0}
                  data-puc-dome
                  data-selected={point?.slug === 'domo'}
                  onClick={() => change('point', 'domo')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      change('point', 'domo');
                    }
                  }}
                >
                  <circle
                    cx="450"
                    cy="425"
                    r="110"
                    fill={point?.slug === 'domo' ? '#d5f24a' : '#fff'}
                    stroke="#132d46"
                    strokeWidth={point?.slug === 'domo' ? 6 : 4}
                  />
                  <path
                    d="m350 452 45-96h110l45 96M395 356l55 115 55-115M350 452h200M395 356l55-38 55 38"
                    fill="none"
                    stroke="#c6cece"
                    strokeWidth="2"
                  />
                  <rect x="426" y="517" width="48" height="15" rx="3" fill="#132d46" />
                  <text
                    x="450"
                    y="433"
                    textAnchor="middle"
                    fontWeight="700"
                    fontSize="32"
                    fill="#132d46"
                  >
                    6 · Domo
                  </text>
                </g>
                <text
                  x="690"
                  y="869"
                  textAnchor="middle"
                  fontSize="25"
                  fontWeight="650"
                  fill="#132d46"
                >
                  Ingreso
                </text>
                <text
                  x="260"
                  y="869"
                  textAnchor="middle"
                  fontSize="25"
                  fontWeight="650"
                  fill="#132d46"
                >
                  Salida
                </text>
              </svg>
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <Suspense
            fallback={
              <div className="puc-map-loading" role="status">
                Preparando el mapa 3D…
              </div>
            }
          >
            <Scene
              plan={PUC_PLAN}
              lots={PUC_LOTS}
              lotColors={PUC_LOTS.map((_, i) =>
                PUC_LOT_EXPERIENCES[i] === point?.slug
                  ? '#d5f24a'
                  : i === 1 || i === 4
                    ? '#b9cdcb'
                    : '#d7d8c9',
              )}
              lotHeights={[1.3, 0.65, 1.3, 1.3, 0.65, 1.3]}
              domes={[PUC_DOME]}
              initialZoom={1.15}
              focusSelection={false}
              showLotLabels={false}
              showAvatar={false}
              showStructureLabels={false}
              dark={dark}
              aerial={false}
              position={PUC_PLAN.origin}
              follow={false}
              selectedLot={selected < 0 ? null : selected}
              selectionBounds={
                point?.order === 3 ? { x: 130, y: 70, width: 640, height: 175 } : undefined
              }
              onSelectLot={(i) => change('point', PUC_LOT_EXPERIENCES[i])}
              cameraRef={camera}
              onFailure={() => {
                change('view', '2d');
                setFailed(true);
              }}
            />
          </Suspense>
        )}
        {mode === '3d' && (
          <div className="indoor-markers">
            {PUC_EXPERIENCES.map((p) => {
              if (p.type === 'domo')
                return (
                  <button
                    key={p.slug}
                    className="puc-3d-label"
                    data-plan-x="450"
                    data-plan-y="425"
                    data-elevation="4.7"
                    onClick={() => change('point', p.slug)}
                    aria-label={`Punto ${p.order}: ${p.name}`}
                  >
                    <b>{p.order}</b>
                    {p.shortName}
                  </button>
                );
              const i = PUC_LOT_EXPERIENCES.indexOf(p.slug as (typeof PUC_LOT_EXPERIENCES)[number]);
              const l = PUC_LOTS[i];
              return (
                <button
                  key={p.slug}
                  className="puc-3d-label"
                  data-plan-x={p.order === 3 ? 450 : l[1] + l[3] / 2}
                  data-plan-y={l[2] + l[4] / 2}
                  data-elevation="1.8"
                  onClick={() => change('point', p.slug)}
                  aria-label={`Punto ${p.order}: ${p.name}`}
                >
                  <b>{p.order}</b>
                  {p.shortName}
                </button>
              );
            })}
            <span className="puc-3d-label" data-plan-x="690" data-plan-y="835">
              ↑ Ingreso
            </span>
            <span className="puc-3d-label" data-plan-x="260" data-plan-y="835">
              ↓ Salida
            </span>
          </div>
        )}
        <div className="puc-map-tools">
          <button aria-label="Acercar mapa" onClick={() => camera.current?.zoom(1.3)}>
            <Plus size={19} />
          </button>
          <button aria-label="Alejar mapa" onClick={() => camera.current?.zoom(1 / 1.3)}>
            <Minus size={19} />
          </button>
          <button aria-label="Restablecer mapa" onClick={() => camera.current?.reset()}>
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
      {failed && (
        <p className="puc-small-note" role="status">
          Activamos el plano 2D porque no se pudo iniciar el 3D.
        </p>
      )}
      {point ? (
        <div className="puc-map-selection">
          <div>
            <span className="puc-step">{point.order}</span>
            <strong>{point.name}</strong>
          </div>
          <div className="puc-map-actions">
            <Link className="button secondary" to={experienceUrl(point.slug)}>
              Ver experiencia
              <ArrowUpRight size={15} />
            </Link>
            <Link className="button puc-primary" to={PUC_BASE + '/escanear?point=' + point.slug}>
              <ScanLine size={16} />
              Escanear QR
            </Link>
          </div>
        </div>
      ) : (
        <p className="puc-small-note">Toca una carpa o un túnel para conocer la experiencia.</p>
      )}
      <div className="puc-map-key" aria-label="Seis puntos del recorrido">
        {PUC_EXPERIENCES.map((p) => (
          <button
            key={p.slug}
            aria-pressed={point?.slug === p.slug}
            onClick={() => change('point', p.slug)}
          >
            <b>{p.order}</b>
            {p.shortName}
          </button>
        ))}
      </div>
    </section>
  );
}
