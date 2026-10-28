import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Check,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  LockKeyhole,
  MapPin,
  Share2,
  ScanLine,
  Ticket,
  Package,
  MessageCircle,
} from 'lucide-react';
import type { Stand } from '@/types/domain';
import { useExperience } from '@/state/experience';
import { useUI } from '@/state/demo';
import { LIVE } from '@/services/config';
import { CategoryTile, Modal, Pill } from './components';
import { BusinessConnection } from './BusinessConnection';
function safeLink(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
export function StandProfile({ stand }: { stand: Stand }) {
  const state = useExperience();
  const [tab, setTab] = useState('offers');
  const [preview, setPreview] = useState(false);
  const saved = state.favorites.includes(stand.id);
  const visited = state.visits.some((v) => v.standId === stand.id);
  const socials = [
    { label: 'Web', value: stand.website, Icon: Globe },
    { label: 'Facebook', value: stand.socialLinks?.facebook, Icon: Facebook },
    { label: 'Instagram', value: stand.socialLinks?.instagram, Icon: Instagram },
    { label: 'LinkedIn', value: stand.socialLinks?.linkedin, Icon: Linkedin },
    { label: 'WhatsApp', value: stand.socialLinks?.whatsapp, Icon: MessageCircle },
  ].filter((item) => safeLink(item.value));
  async function share() {
    const data = { title: stand.name, url: `${location.origin}/stands/${stand.id}` };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        useUI.getState().notify('Enlace copiado.');
      }
    } catch {
      useUI.getState().notify('No se compartió el enlace.');
    }
  }
  return (
    <div className="stack compact-stand-profile">
      <section className="company-identity">
        <div className="company-name">
          <h2>{stand.name}</h2>
          <small>{stand.categoryLabel}</small>
          <span className="company-booth">
            <MapPin size={13} />
            {stand.boothCode}
          </span>
        </div>
        <div className="company-avatar">
          {stand.logoUrl ? (
            <img
              src={stand.logoUrl}
              alt={`Logo de ${stand.name}`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <CategoryTile category={stand.category} />
          )}
        </div>
      </section>
      {!!socials.length && (
        <div className="company-socials">
          {socials.map(({ label, value, Icon }) => (
            <a
              key={label}
              href={safeLink(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-button outline"
              aria-label={`${label} de ${stand.name}`}
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      )}
      <p className="company-description">
        {stand.description || 'Conoce sus productos y servicios en el stand.'}
      </p>
      <div className="company-actions">
        <button
          className={`button secondary ${saved ? 'is-saved' : ''}`}
          aria-pressed={saved}
          onClick={() => void state.favorite(stand.id)}
        >
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
          {saved ? 'Guardado' : 'Guardar'}
        </button>
        <Link className="button secondary" to={`/map?stand=${stand.id}`}>
          <MapPin size={17} />
          Ubicación
        </Link>
        <button
          className="icon-button outline"
          aria-label="Compartir stand"
          onClick={() => void share()}
        >
          <Share2 size={18} />
        </button>
      </div>
      <BusinessConnection stand={stand} />
      {visited && (
        <Pill tone="green">
          <Check size={14} />
          {LIVE ? 'Visita confirmada' : 'Visita de demostración'}
        </Pill>
      )}
      <div className="stand-tabs compact-tabs" role="tablist" aria-label="Servicios del stand">
        {[
          { id: 'offers', label: 'Ofertas' },
          { id: 'games', label: 'Dinámicas' },
          { id: 'catalog', label: 'Catálogo' },
        ].map((item) => (
          <button
            role="tab"
            id={`stand-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`stand-panel-${item.id}`}
            key={item.id}
            onClick={() => setTab(item.id)}
          >
            <LockKeyhole size={12} />
            {item.label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        id={`stand-panel-${tab}`}
        aria-labelledby={`stand-tab-${tab}`}
        className="locked-module"
      >
        <div className="locked-label">
          <LockKeyhole size={15} />
          <strong>Módulo no habilitado</strong>
          <span>Vista de ejemplo</span>
        </div>
        {tab === 'offers' && (
          <div className="offer-example">
            <Ticket size={27} />
            <strong>20% de descuento</strong>
            <span>Para las primeras 10 visitas</span>
            <small>Ejemplo ilustrativo · no es una oferta de esta empresa</small>
          </div>
        )}
        {tab === 'games' && (
          <div className="scratch-example">
            <div className="scratch-sample">
              <Ticket size={32} />
              <strong>Raspa y descubre</strong>
              <span>Una experiencia para tu stand</span>
            </div>
            <button className="button secondary" onClick={() => setPreview(true)}>
              Ver ejemplo
            </button>
            <small>Demostración sin premios ni puntos</small>
          </div>
        )}
        {tab === 'catalog' && (
          <div className="catalog-example">
            <span>
              <Package size={46} />
            </span>
            <div>
              <strong>Producto destacado</strong>
              <p>Imagen, descripción y consulta directa.</p>
              <small>Contenido ilustrativo</small>
            </div>
          </div>
        )}
        <p className="footnote">
          Servicio personalizado de pago para empresas. Su activación se gestiona con el equipo
          fexpo.
        </p>
      </section>
      <Link className="button secondary" to={`/scan?stand=${stand.id}`}>
        <ScanLine size={18} />
        Registrar visita
      </Link>
      {preview && (
        <Modal title="Raspa y gana · ejemplo" onClose={() => setPreview(false)}>
          <ScratchExample />
        </Modal>
      )}
    </div>
  );
}
function ScratchExample() {
  const [revealed, setRevealed] = useState(false);
  const [scratches, setScratches] = useState(0);
  return (
    <div className="stack">
      <button
        className={`scratch-interactive ${revealed ? 'revealed' : ''}`}
        onPointerMove={(e) => {
          if (e.buttons || e.pointerType === 'touch') {
            setScratches((n) => n + 1);
            if (scratches > 14) setRevealed(true);
          }
        }}
        onClick={() => setRevealed(true)}
      >
        <Ticket size={45} />
        <strong>{revealed ? '¡Sorpresa descubierta!' : 'Desliza para raspar'}</strong>
        <span>
          {revealed ? 'Así podría verse una dinámica de tu empresa.' : 'O toca para revelar'}
        </span>
      </button>
      <p className="footnote">Demostración. No entrega premios reales ni registra participación.</p>
    </div>
  );
}
