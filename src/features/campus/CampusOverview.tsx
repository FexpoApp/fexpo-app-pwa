import { lazy, Suspense, useRef } from 'react';
import type { CampusCamera } from './IndoorScene';
import { SITE_COLORS, SITE_LOTS, SITE_PLAN, SITE_ZONES, siteRoute } from './site';
import { PLAN_GEOMETRY } from '@/data/map-plans';
import { Plus, Minus } from 'lucide-react';
const Scene = lazy(() => import('./IndoorScene'));
export function CampusOverview({
  mode,
  dark,
  from,
  to,
  onBuilding,
  onFailure,
}: {
  mode: '2d' | '3d';
  dark: boolean;
  from?: string;
  to?: string;
  onBuilding: (zone: string) => void;
  onFailure: () => void;
}) {
  const camera = useRef<CampusCamera | null>(null);
  const route = siteRoute(from, to);
  return (
    <div className="campus-overview" data-mode={mode}>
      {mode === '3d' ? (
        <Suspense fallback={<div className="campus-loading">Preparando el recinto…</div>}>
          <Scene
            plan={SITE_PLAN}
            lots={SITE_LOTS}
            lotColors={SITE_COLORS}
            lotHeights={[2, 2, 2, 4, 4, 4, 4]}
            showAvatar={false}
            showLotLabels={false}
            showStructureLabels={false}
            dark={dark}
            aerial={false}
            position={SITE_PLAN.origin}
            follow={false}
            selectedLot={to ? SITE_ZONES.indexOf(to) : null}
            onSelectLot={(i) => onBuilding(SITE_ZONES[i])}
            cameraRef={camera}
            route={route}
            onFailure={onFailure}
          />
        </Suspense>
      ) : (
        <svg viewBox={SITE_PLAN.viewBox} aria-label="Vista general del recinto">
          <path
            d={SITE_PLAN.outline}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="2"
          />
          {SITE_PLAN.structures.map((s) => (
            <g key={s.label}>
              <path d={s.path} fill="var(--surface-muted)" />
              <text
                x={s.x}
                y={s.y}
                textAnchor="middle"
                fontSize={14}
                fill="var(--muted)"
                transform={s.label === 'Parqueo' ? `rotate(-90 ${s.x} ${s.y})` : undefined}
              >
                {s.label}
              </text>
            </g>
          ))}
          {SITE_LOTS.map(([name, x, y, w, h], i) => (
            <g
              key={name}
              role="button"
              tabIndex={0}
              aria-label={`Abrir bloque ${name}`}
              onClick={() => onBuilding(SITE_ZONES[i])}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBuilding(SITE_ZONES[i]);
                }
              }}
            >
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={7}
                fill={SITE_COLORS[i]}
                stroke={to === SITE_ZONES[i] ? 'var(--ink)' : 'none'}
                strokeWidth={5}
              />
              <text
                x={x + w / 2}
                y={y + h / 2 + 7}
                textAnchor="middle"
                fontSize={String(name).length > 5 ? 20 : 25}
                fontWeight="700"
                fill={i === 1 || i === 4 || i === 5 ? '#132d46' : 'white'}
              >
                {i < 3 ? `Bloque ${name}` : name}
              </text>
            </g>
          ))}
          {route.length > 0 && (
            <>
              <polyline
                points={route.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#fff"
                strokeWidth={13}
                strokeLinejoin="round"
              />
              <polyline
                data-route="campus"
                points={route.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#132d46"
                strokeWidth={7}
                strokeDasharray="13 7"
              />
              <circle
                cx={route[0].x}
                cy={route[0].y}
                r={10}
                fill="#132d46"
                stroke="white"
                strokeWidth={4}
              />
              <circle
                cx={route.at(-1)!.x}
                cy={route.at(-1)!.y}
                r={10}
                fill="#d5f24a"
                stroke="#132d46"
                strokeWidth={4}
              />
            </>
          )}
        </svg>
      )}
      {mode === '3d' && (
        <>
          <div className="indoor-markers">
            {SITE_LOTS.map(([name, x, y, w, h], i) => (
              <button
                key={name}
                className={'indoor-marker overview-marker' + (i > 2 ? ' tower-marker' : '')}
                data-plan-x={x + w / 2}
                data-plan-y={y + h / 2}
                data-elevation={i > 2 ? '4.7' : '2.7'}
                aria-label={'Abrir bloque ' + name}
                onClick={() => onBuilding(SITE_ZONES[i])}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="indoor-zoom">
            <button aria-label="Acercar recinto" onClick={() => camera.current?.zoom(1.2)}>
              <Plus size={19} />
            </button>
            <button aria-label="Alejar recinto" onClick={() => camera.current?.zoom(1 / 1.2)}>
              <Minus size={19} />
            </button>
          </div>
        </>
      )}
      <div className="overview-building-legend">
        {['red', 'yellow', 'green'].map((zone) => (
          <button key={zone} onClick={() => onBuilding(zone)}>
            <span style={{ background: SITE_COLORS[SITE_ZONES.indexOf(zone)] }} />
            {zone === 'red' ? 'Rojo' : zone === 'yellow' ? 'Amarillo' : 'Verde'}
            <small>{PLAN_GEOMETRY.filter((p) => p.zoneId === zone).length} planos</small>
          </button>
        ))}
      </div>
      <small className="overview-caption">Esquema del recinto · toca un bloque para entrar</small>
    </div>
  );
}
