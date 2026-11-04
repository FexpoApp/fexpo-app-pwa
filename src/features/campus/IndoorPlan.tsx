import { useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { PLAN_LOTS, type PlanGeometry, type Lot } from '@/data/map-plans';
import { standAtLot, standAtLotIn, type PlanPosition } from './model';
import type { Stand } from '@/types/domain';
import type { CampusCamera } from './IndoorScene';
import { ServiceMark } from './ServiceMark';
import { GAMLP, isGamlpLot } from '@/features/sectors/gamlp';
function Controls({
  cameraRef,
  host,
  selectedLot,
  focusSelection,
}: {
  cameraRef: React.RefObject<CampusCamera | null>;
  host: React.RefObject<HTMLDivElement | null>;
  selectedLot: number | null;
  focusSelection: boolean;
}) {
  const c = useControls();
  useEffect(() => {
    cameraRef.current = {
      zoom: (factor) => (factor > 1 ? c.zoomIn() : c.zoomOut()),
      reset: () => c.resetTransform(),
      rotate: () => {},
      follow: () => c.centerView(),
    };
    return () => {
      cameraRef.current = null;
    };
  }, [c, cameraRef]);
  useEffect(() => {
    if (!focusSelection || selectedLot === null) return;
    let frame = 0;
    const focus = () => {
      const selected = host.current?.querySelector<SVGGElement>(
        `[data-lot-index="${selectedLot}"]`,
      );
      const target =
        selected?.dataset.sector === 'gamlp'
          ? host.current?.querySelector<SVGGElement>('[data-sector-focus="gamlp"]')
          : selected;
      const wrapper = c.instance.wrapperComponent;
      if (!target || !wrapper) return;
      const box = target.getBoundingClientRect(),
        viewport = wrapper.getBoundingClientRect();
      if (!box.width || !viewport.width) return;
      const { scale, positionX, positionY } = c.instance.transformState;
      const next = Math.min(
        4,
        Math.max(
          1.8,
          Math.min((viewport.width * 0.32) / box.width, (viewport.height * 0.25) / box.height) *
            scale,
        ),
      );
      const ratio = next / scale;
      c.setTransform(
        positionX * ratio + viewport.width / 2 - (box.x + box.width / 2 - viewport.x) * ratio,
        positionY * ratio + viewport.height / 2 - (box.y + box.height / 2 - viewport.y) * ratio,
        next,
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260,
      );
    };
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(focus);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedLot, focusSelection]);
  return null;
}
export default function IndoorPlan({
  plan,
  position,
  selectedLot,
  onSelectLot,
  cameraRef,
  stands,
  route,
  showAvatar = true,
  focusSelection = false,
  lots = PLAN_LOTS[plan.id] ?? [],
  lotStands,
  lotRotations,
  backgroundSvgUrl,
  municipalSector = false,
}: {
  plan: PlanGeometry;
  position: PlanPosition;
  selectedLot: number | null;
  onSelectLot: (index: number) => void;
  cameraRef: React.RefObject<CampusCamera | null>;
  stands?: readonly Stand[];
  route?: PlanPosition[];
  showAvatar?: boolean;
  focusSelection?: boolean;
  lots?: Lot[];
  lotStands?: readonly (Stand | undefined)[];
  lotRotations?: number[];
  backgroundSvgUrl?: string;
  municipalSector?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  return (
    <div className="indoor-plan" ref={host}>
      <TransformWrapper
        key={plan.id}
        minScale={0.7}
        maxScale={6}
        centerOnInit
        limitToBounds={false}
      >
        <Controls
          cameraRef={cameraRef}
          host={host}
          selectedLot={selectedLot}
          focusSelection={focusSelection}
        />
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <svg viewBox={plan.viewBox} className="indoor-svg" aria-label={`Plano de ${plan.name}`}>
            <path d={plan.outline} fill="var(--surface)" stroke={plan.color} strokeWidth={5} />
            {backgroundSvgUrl && /^https?:\/\//.test(backgroundSvgUrl) && (
              <image
                href={backgroundSvgUrl}
                x={Number(plan.viewBox.split(' ')[0])}
                y={Number(plan.viewBox.split(' ')[1])}
                width={Number(plan.viewBox.split(' ')[2])}
                height={Number(plan.viewBox.split(' ')[3])}
              />
            )}
            {plan.structures.map((s, i) => (
              <g key={i}>
                <path
                  d={s.path}
                  fill="var(--surface-muted)"
                  stroke="var(--border)"
                  strokeWidth={2}
                />
                {s.x !== undefined && s.y !== undefined && s.label && (
                  <foreignObject
                    x={s.x - 10}
                    y={s.y - 26}
                    width={20}
                    height={20}
                    className="plan-service-icon"
                  >
                    <ServiceMark label={s.label} size={18} />
                  </foreignObject>
                )}
                <text x={s.x} y={s.y} textAnchor="middle" fontSize={15} fill="var(--muted)">
                  {s.label}
                </text>
              </g>
            ))}
            {lots.map(([code, x, y, w, h], index) => {
              const municipal = municipalSector && isGamlpLot(plan.id, code);
              const selectedSector =
                municipal && selectedLot !== null && isGamlpLot(plan.id, lots[selectedLot]?.[0]);
              const stand = lotStands
                ? lotStands[index]
                : stands
                  ? standAtLotIn(stands, plan.id, code)
                  : standAtLot(plan.id, code);
              return (
                <g
                  key={index}
                  data-lot={String(code)}
                  data-lot-index={index}
                  data-sector={municipal ? 'gamlp' : undefined}
                  data-sector-selected={municipal ? String(selectedSector) : undefined}
                  transform={
                    lotRotations?.[index]
                      ? `rotate(${lotRotations[index]} ${x + w / 2} ${y + h / 2})`
                      : undefined
                  }
                  role="button"
                  tabIndex={0}
                  aria-label={
                    municipal
                      ? `Ver sector GAMLP, espacio ${code}`
                      : stand
                        ? `Ver ${stand.name}, stand ${stand.boothCode}`
                        : `Espacio ${code}`
                  }
                  onClick={() => onSelectLot(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectLot(index);
                    }
                  }}
                >
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill={
                      municipal
                        ? selectedSector
                          ? '#d5f24a'
                          : '#ece8b3'
                        : selectedLot === index
                          ? '#087ec2'
                          : stand
                            ? plan.color
                            : `color-mix(in srgb, ${plan.color} 14%, var(--surface))`
                    }
                    stroke={municipal ? '#656219' : selectedLot === index ? '#087ec2' : plan.color}
                    strokeWidth={municipal || selectedLot === index ? 4 : 1.3}
                  />
                  <text
                    x={x + w / 2}
                    y={municipal && code === 'P14-A' ? y + 27 : y + h / 2 + 5}
                    textAnchor="middle"
                    fontSize={w < 35 ? 12 : 16}
                    fill={
                      municipal
                        ? '#132d46'
                        : stand || selectedLot === index
                          ? 'white'
                          : 'var(--ink)'
                    }
                  >
                    {code}
                  </text>
                </g>
              );
            })}
            {municipalSector && (
              <g data-sector-focus="gamlp" pointerEvents="none" aria-hidden="true">
                <rect x="950" y="271" width="143" height="285" fill="none" />
                <image href={GAMLP.logo} x="973" y="315" width="96" height="96" />
                <text
                  x="1021"
                  y="440"
                  textAnchor="middle"
                  fontSize="23"
                  fontWeight="700"
                  fill="#132d46"
                >
                  GAMLP
                </text>
                <text x="1021" y="465" textAnchor="middle" fontSize="12" fill="#132d46">
                  Emprendedores
                </text>
              </g>
            )}
            {route && route.length > 1 && (
              <>
                <polyline
                  points={route.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="white"
                  strokeWidth={10}
                  strokeLinejoin="round"
                />
                <polyline
                  data-route="indoor"
                  points={route.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#132d46"
                  strokeWidth={5}
                  strokeDasharray="10 5"
                  strokeLinejoin="round"
                />
              </>
            )}
            {showAvatar && (
              <g
                className="indoor-avatar"
                data-avatar-x={position.x}
                data-avatar-y={position.y}
                transform={`translate(${position.x} ${position.y})`}
                aria-label="Avatar"
              >
                <circle r={19} fill="#219bea" opacity={0.18} />
                <circle r={10} fill="#087ec2" stroke="white" strokeWidth={4} />
              </g>
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
