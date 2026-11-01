import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LIVE } from '@/services/config';
import { LiveQr } from './LiveAccount';
import { DemoQrPage } from './Secondary';
import { STANDS } from '@/data/demo-data';
import { useDemo, type Receipt } from '@/state/demo';
import { useStands } from '@/state/experience';
import { Modal } from '@/ui/components';

/** The visitor displays a credential; only authorized stand staff confirms a real visit. */
export function QrCheckin() {
  const [params] = useSearchParams();
  const stands = useStands();
  const selected = stands.find(
    (stand) => stand.id === (params.get('stand') || params.get('standId')),
  );
  return (
    <div className="qr-checkin compact-flow">
      {selected && <p className="qr-stand-context">En {selected.name}</p>}
      {LIVE ? <LiveQr /> : <DemoQrPage checkin />}
      {!LIVE && <DemoVisit target={params.get('stand') || params.get('standId')} />}
    </div>
  );
}

function DemoVisit({ target }: { target: string | null }) {
  const state = useDemo();
  const [standId, setStandId] = useState(
    STANDS.some((stand) => stand.id === target) ? target! : STANDS[0].id,
  );
  const [reading, setReading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setReading(false);
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  if (!state.signedIn) return null;
  return (
    <details className="demo-visit-controls">
      <summary>Probar una visita de ejemplo</summary>
      <p>Simula lo que confirma el personal. No registra visitas reales.</p>
      <label>
        Stand de ejemplo
        <select value={standId} onChange={(event) => setStandId(event.target.value)}>
          {STANDS.map((stand) => (
            <option key={stand.id} value={stand.id}>
              {stand.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button secondary"
        disabled={reading}
        onClick={() => {
          setReading(true);
          timer.current = setTimeout(() => {
            timer.current = null;
            setReceipt(useDemo.getState().visit(standId));
            setReading(false);
          }, 1600);
        }}
      >
        Simular confirmación QR
      </button>
      {reading && (
        <Modal title="Simulando confirmación" onClose={cancel}>
          <p>Preparando una visita de demostración.</p>
          <button className="button secondary" onClick={cancel}>
            Cancelar lectura
          </button>
        </Modal>
      )}
      {receipt && (
        <Modal
          title={receipt.duplicate ? 'Visita ya registrada' : '¡Una nueva conexión!'}
          onClose={() => setReceipt(null)}
        >
          <p>{STANDS.find((stand) => stand.id === receipt.standId)?.name}</p>
          <strong>
            {receipt.duplicate ? 'Sin puntos duplicados' : `+${receipt.points} puntos demo`}
          </strong>
          <p>Confirmación simulada · sin validez real.</p>
          <button className="button" onClick={() => setReceipt(null)}>
            Listo
          </button>
        </Modal>
      )}
    </details>
  );
}
