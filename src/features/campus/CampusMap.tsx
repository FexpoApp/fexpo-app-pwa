import { matchesStand } from '@/services/stand-search';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  Store,
  Compass,
  Plus,
  Minus,
  Layers,
  ChevronRight,
  RotateCcw,
  Navigation,
  List,
  Info,
} from 'lucide-react';
import { STANDS } from '@/data/demo-data';
import { LIVE } from '@/services/config';
import { useLive } from '@/state/live';
import { PLAN_GEOMETRY, PLAN_LOTS } from '@/data/map-plans';
import { CategoryTile, Modal } from '@/ui/components';
import { BottomSheet } from '@/ui/BottomSheet';
import { useCampusLocation } from './location';
import { useRelativeGps } from './gps';
import { CAMPUS_POINTS, lotAtPublishedPosition, pointsForStands, standAtLotIn } from './model';
import IndoorPlan from './IndoorPlan';
import { CampusOverview } from './CampusOverview';
import { ServiceMark } from './ServiceMark';
import { routeThroughAisles } from './routing';
import type { CampusCamera } from './IndoorScene';
import './campus.css';
const Scene = lazy(() => import('./IndoorScene'));
const buildings = [
  { id: 'red', name: 'Rojo' },
  { id: 'yellow', name: 'Amarillo' },
  { id: 'green', name: 'Verde' },
  { id: 'entrance', name: 'Plaza Akapana' },
  { id: 'food', name: 'Comidas' },
];
export default function CampusMap() {
  const live = useLive();
  const plans = LIVE
    ? PLAN_GEOMETRY.filter((candidate) =>
        live.map?.floors.some(
          (floor) =>
            floor.name === candidate.name &&
            floor.outline === candidate.outline &&
            floor.viewBox === candidate.viewBox,
        ),
      )
    : PLAN_GEOMETRY;
  const stands = LIVE
    ? live.stands.map((stand) => {
        const floor = live.map?.floors.find((floor) =>
          floor.stands.some((item) => item.standId === stand.id),
        );
        const plan = plans.find((candidate) => candidate.name === floor?.name);
        const published = floor?.stands.find((item) => item.standId === stand.id);
        return {
          ...stand,
          planId: plan && published ? plan.id : '',
          lotCode:
            plan && published ? lotAtPublishedPosition(plan, published.x, published.y) : null,
        };
      })
    : STANDS;

  const points = LIVE ? pointsForStands(stands) : CAMPUS_POINTS;
  const [params, setParams] = useSearchParams();
  const requestedStand = stands.find((s) => s.id === params.get('stand'));
  const plan =
    plans.find((p) => p.id === (params.get('plan') || requestedStand?.planId)) || plans[0];
  const mode = params.get('view') === '3d' ? '3d' : '2d';
  const general = params.get('plan') === 'general' || (!params.get('plan') && !requestedStand);
  const [query, setQuery] = useState(''),
    [listing, setListing] = useState(false),
    [help, setHelp] = useState(false);
  const [aerial, setAerial] = useState(false),
    [failed, setFailed] = useState(false),
    [routeDialog, setRouteDialog] = useState(false);
  const [routeSource, setRouteSource] = useState(''),
    [routing, setRouting] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false),
    [gpsAnchor, setGpsAnchor] = useState('entry');
  const [dark, setDark] = useState(document.documentElement.dataset.theme === 'dark');
  const camera = useRef<CampusCamera | null>(null);
  const last = useCampusLocation((s) => s.last);
  const gps = useRelativeGps(plan.id);
  const knownPoint = points.find((p) => p.id === last?.standId);
  const sourcePlan = plans.find(
    (p) => p.id === (routeSource === 'nfc' ? knownPoint?.planId : routeSource),
  );
  const selectedLot = PLAN_LOTS[plan.id].findIndex(([code]) =>
    requestedStand
      ? standAtLotIn(stands, plan.id, code)?.id === requestedStand.id
      : params.get('lot') === String(code),
  );
  const lot = selectedLot >= 0 ? PLAN_LOTS[plan.id][selectedLot] : null;
  const selectedStand = lot ? standAtLotIn(stands, plan.id, lot[0]) : null;
  const destination = points.find((p) => p.id === requestedStand?.id);
  const destinationPlan = plans.find((p) => p.id === destination?.planId);
  const position = gps.position || (knownPoint?.planId === plan.id ? knownPoint : plan.origin);
  const origin = routeSource === 'nfc' && knownPoint?.planId === plan.id ? knownPoint : plan.origin;
  const route = useMemo(
    () =>
      routing && sourcePlan && destination?.planId === plan.id
        ? routeThroughAisles(plan, origin, destination)
        : [],
    [
      routing,
      sourcePlan?.id,
      destination?.id,
      destination?.x,
      destination?.y,
      plan.id,
      origin.x,
      origin.y,
    ],
  );
  const results = stands.filter((s) => matchesStand(s, query));
  const sheetOpen = params.get('detail') === '1' && !!lot && !general;
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
  useEffect(() => {
    setAerial(false);
  }, [plan.id]);
  function changePlan(id: string) {
    setQuery('');
    setRouting(false);
    setParams({ plan: id, view: mode }, { replace: true });
  }
  function changeMode(view: '2d' | '3d') {
    setFailed(false);
    const next = new URLSearchParams(params);
    next.set('view', view);
    setParams(next, { replace: true });
  }
  function select(id: string) {
    const stand = stands.find((s) => s.id === id);
    if (!stand) return;
    setQuery('');
    setListing(false);
    setRouting(false);
    setParams({ plan: stand.planId, view: '2d', stand: id }, { replace: true });
  }
  function selectLot(index: number) {
    const value = PLAN_LOTS[plan.id][index];
    if (!value) return;
    const stand = standAtLotIn(stands, plan.id, value[0]);
    setRouting(false);
    setParams(
      {
        plan: plan.id,
        view: mode,
        lot: String(value[0]),
        detail: '1',
        ...(stand ? { stand: stand.id } : {}),
      },
      { replace: true },
    );
  }
  function closeSheet() {
    const next = new URLSearchParams(params);
    next.delete('detail');
    setParams(next, { replace: true });
  }
  function openRoute() {
    closeSheet();
    setRouteSource(routeSource || (knownPoint ? 'nfc' : ''));
    setRouteDialog(true);
  }
  function startRoute() {
    if (!destinationPlan || !sourcePlan) return;
    setRouting(true);
    setRouteDialog(false);
    setParams(
      {
        plan: sourcePlan.zoneId === destinationPlan.zoneId ? destinationPlan.id : 'general',
        stand: requestedStand!.id,
        view: '2d',
      },
      { replace: true },
    );
  }
  function stopRoute() {
    setRouting(false);
    if (destinationPlan && requestedStand)
      setParams(
        { plan: destinationPlan.id, stand: requestedStand.id, view: mode },
        { replace: true },
      );
  }
  return (
    <section className="indoor-experience compact-map" aria-label="Mapa interactivo FIPAZ">
      <div className="indoor-toolbar">
        <div className="indoor-search-row">
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Buscar stands y empresas"
              placeholder="Buscar stands y empresas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Limpiar búsqueda" onClick={() => setQuery('')}>
                <X size={17} />
              </button>
            )}
          </label>
          <button
            className="icon-button"
            aria-label="Lista de stands"
            onClick={() => setListing(true)}
          >
            <List size={21} />
          </button>
          <button
            className="icon-button"
            aria-label="Acerca del mapa"
            onClick={() => setHelp(true)}
          >
            <Info size={20} />
          </button>
        </div>
        <div className="building-chips" aria-label="Bloques del recinto">
          <button
            aria-pressed={general}
            onClick={() =>
              setParams(
                {
                  plan: 'general',
                  view: mode,
                  ...(routing && requestedStand ? { stand: requestedStand.id } : {}),
                },
                { replace: true },
              )
            }
          >
            General
          </button>
          {buildings
            .filter((b) => plans.some((p) => p.zoneId === b.id))
            .map((b) => (
              <button
                key={b.id}
                aria-pressed={!general && plan.zoneId === b.id}
                style={
                  {
                    '--building-color': plans.find((p) => p.zoneId === b.id)!.color,
                  } as React.CSSProperties
                }
                onClick={() => changePlan(plans.find((p) => p.zoneId === b.id)!.id)}
              >
                <span />
                {b.name}
              </button>
            ))}
        </div>
        <div className="compact-floor-heading">
          <h2>{general ? 'Campo ferial Chuquiago Marka' : plan.name}</h2>
          {!general && (
            <div className="indoor-floor-tabs" aria-label="Planta">
              {plans
                .filter((p) => p.zoneId === plan.zoneId)
                .map((p) => (
                  <button
                    key={p.id}
                    aria-pressed={p.id === plan.id}
                    onClick={() => changePlan(p.id)}
                  >
                    {p.level === 'Planta baja'
                      ? 'Baja'
                      : p.level === 'Planta alta'
                        ? 'Alta'
                        : 'Exterior'}
                  </button>
                ))}
            </div>
          )}
        </div>
        {query && (
          <div className="indoor-results">
            <small>{results.length} stands</small>
            {results.length ? (
              results.map((s) => (
                <button key={s.id} onClick={() => select(s.id)}>
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.boothCode}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))
            ) : (
              <p>No encontramos ese stand.</p>
            )}
          </div>
        )}
      </div>
      <div
        className="indoor-viewer"
        data-mode={mode}
        data-plan-id={general ? 'general' : plan.id}
        data-position-source={
          gps.position ? 'gps' : knownPoint?.planId === plan.id ? 'nfc' : 'unconfirmed'
        }
        data-avatar-x={position.x}
        data-avatar-y={position.y}
      >
        {general ? (
          <CampusOverview
            mode={mode}
            dark={dark}
            from={routing ? sourcePlan?.zoneId : undefined}
            to={routing ? destinationPlan?.zoneId : undefined}
            onBuilding={(zone) => {
              const p = plans.find((p) => p.zoneId === zone);
              if (p)
                setParams(
                  {
                    plan: routing && destinationPlan?.zoneId === zone ? destinationPlan.id : p.id,
                    view: mode,
                    ...(routing && requestedStand ? { stand: requestedStand.id } : {}),
                  },
                  { replace: true },
                );
            }}
            onFailure={() => {
              changeMode('2d');
              setFailed(true);
            }}
          />
        ) : (
          <>
            {mode === '2d' ? (
              <IndoorPlan
                plan={plan}
                position={position}
                selectedLot={selectedLot < 0 ? null : selectedLot}
                onSelectLot={selectLot}
                cameraRef={camera}
                stands={stands}
                route={route}
                showAvatar={!!gps.position || knownPoint?.planId === plan.id}
                focusSelection={!routing && selectedLot >= 0}
              />
            ) : (
              <Suspense
                fallback={
                  <div className="campus-loading" role="status">
                    Preparando el plano 3D…
                  </div>
                }
              >
                <Scene
                  plan={plan}
                  dark={dark}
                  aerial={aerial}
                  position={position}
                  follow={gps.status === 'active'}
                  route={route}
                  showAvatar={!!gps.position || knownPoint?.planId === plan.id}
                  selectedLot={selectedLot < 0 ? null : selectedLot}
                  onSelectLot={selectLot}
                  cameraRef={camera}
                  onFailure={() => {
                    changeMode('2d');
                    setFailed(true);
                  }}
                />
              </Suspense>
            )}
            {mode === '3d' && (
              <div className="indoor-markers" key={plan.id}>
                {plan.structures
                  .filter((s) => s.x !== undefined && s.y !== undefined)
                  .map((s, i) => (
                    <span
                      className="indoor-service"
                      key={i}
                      data-plan-x={s.x}
                      data-plan-y={s.y}
                      data-elevation=".6"
                    >
                      {s.label && <ServiceMark label={s.label} size={12} />}
                      <span>{s.label}</span>
                    </span>
                  ))}
                {points
                  .filter((p) => p.planId === plan.id)
                  .map((p) => {
                    const s = stands.find((s) => s.id === p.id)!;
                    return (
                      <button
                        className={
                          'indoor-marker' + (p.id === requestedStand?.id ? ' marker-selected' : '')
                        }
                        key={p.id}
                        data-plan-x={p.x}
                        data-plan-y={p.y}
                        aria-label={'Ver ' + s.name + ', stand ' + s.boothCode}
                        onClick={() =>
                          selectLot(
                            PLAN_LOTS[plan.id].findIndex(
                              ([code]) => standAtLotIn(stands, plan.id, code)?.id === s.id,
                            ),
                          )
                        }
                      >
                        <Store size={14} />
                        <span>{s.boothCode}</span>
                      </button>
                    );
                  })}
              </div>
            )}
            {mode === '3d' && (
              <div className="indoor-camera-top">
                <button aria-label="Girar mapa" onClick={() => camera.current?.rotate()}>
                  <Compass size={20} />
                </button>
                <button
                  aria-label="Alternar vista aérea"
                  aria-pressed={aerial}
                  onClick={() => setAerial(!aerial)}
                >
                  <Layers size={20} />
                </button>
              </div>
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
              <button
                aria-label={
                  gps.status === 'active' || gps.status === 'waiting'
                    ? 'Detener GPS'
                    : 'Mi ubicación'
                }
                aria-pressed={gps.status === 'active'}
                onClick={() => {
                  if (gps.status === 'active' || gps.status === 'waiting') gps.stop();
                  else setLocationDialog(true);
                }}
              >
                <Navigation size={18} />
              </button>
            </div>
          </>
        )}
        {routing && requestedStand && (
          <div className="route-indicator" role="status">
            <Navigation size={15} />
            <span>Ruta orientativa · {requestedStand.boothCode}</span>
            {general && destinationPlan && (
              <button
                onClick={() =>
                  setParams(
                    { plan: destinationPlan.id, view: '2d', stand: requestedStand.id },
                    { replace: true },
                  )
                }
              >
                Ver interior
              </button>
            )}
            <button aria-label="Quitar recorrido" onClick={stopRoute}>
              <X size={16} />
            </button>
          </div>
        )}
        {!general && gps.position && (
          <div className="map-gps-indicator" role="status">
            GPS relativo · ±{Math.round(gps.accuracy || 0)} m
          </div>
        )}
        <div className="map-footer-controls">
          <div className="indoor-modes">
            <button aria-pressed={mode === '2d'} onClick={() => changeMode('2d')}>
              2D
            </button>
            <button aria-pressed={mode === '3d'} onClick={() => changeMode('3d')}>
              3D
            </button>
          </div>
          {requestedStand && destination && (
            <button className="map-route-button" onClick={openRoute}>
              <Navigation size={17} />
              {routing ? 'Cambiar inicio' : 'Cómo llegar'}
            </button>
          )}
        </div>
      </div>
      {failed && (
        <p className="map-render-notice" role="status">
          Vista 2D activada: no se pudo iniciar el 3D.
        </p>
      )}
      {gps.error && (
        <p className="map-render-notice" role="alert">
          {gps.error}
        </p>
      )}
      {locationDialog && (
        <Modal title="Ubicación relativa" onClose={() => setLocationDialog(false)}>
          <p>
            El GPS interior es aproximado. Confirma desde qué punto del plano empiezas; tus
            desplazamientos moverán el avatar a partir de allí.
          </p>
          <label className="route-origin-field">
            Estoy en
            <select
              aria-label="Punto inicial del GPS"
              value={gpsAnchor}
              onChange={(e) => setGpsAnchor(e.target.value)}
            >
              <option value="entry">Ingreso de {plan.name}</option>
              {knownPoint?.planId === plan.id && (
                <option value="nfc">Última visita NFC registrada</option>
              )}
            </select>
          </label>
          <button
            className="button"
            onClick={() => {
              gps.start(
                gpsAnchor === 'nfc' && knownPoint?.planId === plan.id ? knownPoint : plan.origin,
              );
              camera.current?.reset();
              setLocationDialog(false);
            }}
          >
            Iniciar GPS relativo
          </button>
          <p className="footnote">
            No representa una ubicación absoluta ni identifica la planta. Puede perder precisión
            dentro del recinto.
          </p>
        </Modal>
      )}
      {sheetOpen && (
        <BottomSheet title={selectedStand?.name || 'Espacio ' + lot![0]} onClose={closeSheet}>
          <div className="sheet-stand-summary">
            {selectedStand ? (
              <CategoryTile category={selectedStand.category} />
            ) : (
              <span className="sheet-lot-icon">
                <Store size={25} />
              </span>
            )}
            <span>
              <strong>{selectedStand?.boothCode || 'Espacio ' + lot![0]}</strong>
              <small>{selectedStand ? plan.name : 'Expositor por publicar'}</small>
            </span>
          </div>
          {selectedStand && (
            <div className="sheet-actions">
              <Link className="button" to={'/stands/' + selectedStand.id} onClick={closeSheet}>
                Ver perfil
                <ChevronRight size={16} />
              </Link>
              {destination && (
                <button className="button secondary" onClick={openRoute}>
                  <Navigation size={17} />
                  Cómo llegar
                </button>
              )}
            </div>
          )}
        </BottomSheet>
      )}
      {routeDialog && requestedStand && (
        <Modal title="Cómo llegar" onClose={() => setRouteDialog(false)}>
          <p>
            Elige tu punto de partida para llegar a <strong>{requestedStand.name}</strong>. El
            recorrido es orientativo.
          </p>
          <label className="route-origin-field">
            Punto de partida
            <select
              aria-label="Punto de inicio del recorrido"
              value={routeSource}
              onChange={(e) => setRouteSource(e.target.value)}
            >
              <option value="">Selecciona un ingreso</option>
              {knownPoint && <option value="nfc">Última visita NFC registrada</option>}
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  Ingreso · {p.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" disabled={!sourcePlan} onClick={startRoute}>
            <Navigation size={18} />
            Trazar recorrido
          </button>
          {sourcePlan && destinationPlan && sourcePlan.level !== destinationPlan.level && (
            <p className="footnote">
              El destino está en otra planta; utiliza las escaleras o el ascensor señalizados.
            </p>
          )}
        </Modal>
      )}
      {listing && (
        <Modal title="Stands" onClose={() => setListing(false)}>
          <div className="indoor-stand-list">
            {stands.map((s) => (
              <button key={s.id} onClick={() => select(s.id)}>
                <CategoryTile category={s.category} />
                <span className="grow">
                  <strong>{s.name}</strong>
                  <small>
                    {s.boothCode} ·{' '}
                    {plans.find((p) => p.id === s.planId)?.name || 'Ubicación por publicar'}
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
        </Modal>
      )}
      {help && (
        <Modal title="Explora el recinto" onClose={() => setHelp(false)}>
          <p>
            El mapa abre en 2D. Toca un bloque, cambia de planta o busca una empresa. Toca un
            espacio para abrir su ficha inferior.
          </p>
          <p>
            <strong>Cómo llegar</strong> permite elegir un ingreso o la última visita NFC
            registrada. La lectura de tarjetas se realiza desde Check-in.
          </p>
          <p>
            El recinto general es un esquema basado en la fotografía oficial; no está
            georreferenciado. Los recorridos orientan entre accesos y pasillos, sin representar una
            posición GPS exacta.
          </p>
          <button className="button secondary" onClick={() => setHelp(false)}>
            Entendido
          </button>
        </Modal>
      )}
    </section>
  );
}
