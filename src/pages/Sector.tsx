import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MapPin, QrCode, Users } from 'lucide-react';
import QRCode from 'react-qr-code';
import { GAMLP } from '@/features/sectors/gamlp';
import { SectorDirectory } from '@/features/sectors/SectorDirectory';
import { sectorDemoPayload, useSectorDemo } from '@/features/sectors/visit-demo';

export function GamlpSectorPage() {
  const [params, setParams] = useSearchParams();
  const demo = params.get('demo') === '1';
  const tab = params.get('tab') === 'visit' ? 'visit' : 'entrepreneurs';
  function change(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <section className="sector-page">
      <header className="sector-hero">
        <img src={GAMLP.logo} alt="Escudo del Gobierno Autónomo Municipal de La Paz" />
        <div>
          <small>SECTOR MUNICIPAL</small>
          <h1>Emprende La Paz</h1>
          <p>{GAMLP.name}</p>
        </div>
      </header>
      <Link to={GAMLP.mapUrl} className="sector-location">
        <MapPin size={19} />
        <span>
          <strong>P14-A + P14-B</strong>
          <small>{GAMLP.location}</small>
        </span>
        <span className="sector-map-label">Ver mapa</span>
      </Link>
      <div
        className="sector-tabs"
        role="tablist"
        aria-label="Contenido del sector"
        onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next =
            event.key === 'Home'
              ? 'entrepreneurs'
              : event.key === 'End'
                ? 'visit'
                : tab === 'visit'
                  ? 'entrepreneurs'
                  : 'visit';
          change('tab', next);
          event.currentTarget.querySelector<HTMLButtonElement>(`#${next}-tab`)?.focus();
        }}
      >
        <button
          role="tab"
          id="entrepreneurs-tab"
          aria-controls="sector-panel"
          aria-selected={tab === 'entrepreneurs'}
          tabIndex={tab === 'entrepreneurs' ? 0 : -1}
          onClick={() => change('tab', 'entrepreneurs')}
        >
          <Users size={17} />
          Emprendedores
        </button>
        <button
          role="tab"
          id="visit-tab"
          aria-controls="sector-panel"
          aria-selected={tab === 'visit'}
          tabIndex={tab === 'visit' ? 0 : -1}
          onClick={() => change('tab', 'visit')}
        >
          <QrCode size={17} />
          Visita QR
        </button>
      </div>
      <div
        id="sector-panel"
        role="tabpanel"
        aria-labelledby={tab === 'visit' ? 'visit-tab' : 'entrepreneurs-tab'}
      >
        {tab === 'entrepreneurs' ? (
          <SectorDirectory demo={demo} />
        ) : demo ? (
          <SectorVisitDemo />
        ) : (
          <div className="sector-real-visit">
            <p>Muestra tu pase al personal para registrar tu visita a todo el sector.</p>
            <Link className="button" to="/scan?sector=gamlp">
              <QrCode size={18} />
              Mostrar mi QR
            </Link>
            <p className="footnote">
              El registro específico del GAMLP se habilitará cuando esté configurado con el personal
              autorizado.
            </p>
          </div>
        )}
      </div>
      <div className="sector-demo-switch">
        <button className="button ghost" onClick={() => change('demo', demo ? null : '1')}>
          {demo ? 'Salir de la demostración' : 'Probar demo del sector'}
        </button>
        {demo && <small>Prueba en este dispositivo · no registra visitas reales ni puntos.</small>}
      </div>
    </section>
  );
}

function SectorVisitDemo() {
  const { visitorId, visits, confirm, reset, nextVisitor } = useSectorDemo();
  const [result, setResult] = useState<'recorded' | 'duplicate' | 'invalid' | null>(null);
  const payload = sectorDemoPayload(visitorId);
  return (
    <div className="sector-visit-demo">
      <p className="sector-demo-label">Demostración · QR sin validez real</p>
      <p>Un solo pase para visitar P14-A y P14-B.</p>
      <div className="sector-qr">
        <QRCode
          value={payload}
          size={220}
          title="QR de prueba del sector GAMLP, sin validez real"
        />
      </div>
      <button className="button" onClick={() => setResult(confirm(payload))}>
        Simular lectura del personal
      </button>
      {result && (
        <p className="sector-visit-result" role="status">
          <CheckCircle2 size={19} />
          {result === 'recorded'
            ? 'Visita de prueba registrada en el sector GAMLP.'
            : result === 'duplicate'
              ? 'Esta visita ya fue registrada. Sin duplicar el conteo.'
              : 'Código de prueba inválido.'}
        </p>
      )}
      <div className="sector-demo-total">
        <strong>{visits.length}</strong>
        <span>
          visitas únicas de prueba
          <br />
          <small>GAMLP · P14-A + P14-B</small>
        </span>
      </div>
      <button
        className="button secondary"
        onClick={() => {
          nextVisitor();
          setResult(null);
        }}
      >
        Probar otro pase
      </button>
      <button
        className="button ghost"
        onClick={() => {
          reset();
          setResult(null);
        }}
      >
        Reiniciar prueba
      </button>
    </div>
  );
}
