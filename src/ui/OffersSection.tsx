import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { useStands } from '@/state/experience';
import { useInterestEditor, useVisitorInterests } from '@/state/interests';
import { LIVE } from '@/services/config';
import { offersFor, type PublishedOffer } from '@/features/discovery/model';
import { Modal, categoryMeta } from './components';

function OfferCard({ offer, onOpen }: { offer: PublishedOffer; onOpen?: () => void }) {
  return (
    <Link
      className={'offer-card poster-' + offer.stand.category}
      to={'/stands/' + offer.stand.id}
      onClick={onOpen}
      draggable={false}
    >
      <span className="offer-art">
        <span className="category-poster-image" aria-hidden="true" />
        {offer.stand.coverUrl && (
          <img
            src={offer.stand.coverUrl}
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </span>
      <span className="offer-shade" aria-hidden="true" />
      <span className="offer-category">
        <Tag size={12} />
        {offer.example ? 'Ejemplo' : categoryMeta[offer.stand.category].label}
      </span>
      <span className="offer-copy">
        <small>{offer.stand.name}</small>
        <strong>{offer.title}</strong>
        <span>
          {offer.stand.boothCode}
          <ArrowUpRight size={17} />
        </span>
      </span>
    </Link>
  );
}
export function OffersSection() {
  const stands = useStands(),
    preference = useVisitorInterests(),
    editor = useInterestEditor();
  const offers = offersFor(stands, preference.categories, LIVE);
  const [explore, setExplore] = useState(false);
  return (
    <section className="offers-section" aria-label="Ofertas de la feria">
      <div className="offers-heading">
        <button
          className="shelf-heading"
          onClick={() => setExplore(true)}
          disabled={!offers.length}
        >
          <h2>Ofertas para ti</h2>
          <ChevronRight size={20} />
          <span className="sr-only">Explorar ofertas</span>
        </button>
        <button className="interest-edit" onClick={editor.show} aria-label="Cambiar mis intereses">
          <SlidersHorizontal size={15} />
          <span>Intereses</span>
        </button>
      </div>
      {offers.length ? (
        <div className="offer-rail" tabIndex={0} aria-label="Desliza para ver ofertas">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <div className="offers-empty">
          <Tag size={25} />
          <p>
            {preference.categories.length
              ? 'Todavía no hay ofertas publicadas para tus intereses.'
              : 'Las ofertas aparecerán cuando las publiquen los expositores.'}
          </p>
          {preference.categories.length > 0 && (
            <button onClick={() => preference.save([])}>
              Ver todas las categorías
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      )}
      {explore && offers.length > 0 && (
        <OfferExplorer offers={offers} onClose={() => setExplore(false)} />
      )}
    </section>
  );
}
function OfferExplorer({ offers, onClose }: { offers: PublishedOffer[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null),
    swiped = useRef(false);
  const current = Math.min(index, offers.length - 1);
  const move = (direction: number) =>
    setIndex((i) =>
      Math.min(offers.length - 1, Math.max(0, Math.min(i, offers.length - 1) + direction)),
    );
  return (
    <Modal title="Descubre las ofertas" onClose={onClose} className="offer-explorer">
      <div
        className="offer-swipe-stage"
        aria-label="Oferta actual. Desliza horizontalmente para cambiar"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            move(1);
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            move(-1);
          }
        }}
        tabIndex={0}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          swiped.current = false;
        }}
        onPointerUp={(e) => {
          if (!start.current) return;
          const dx = e.clientX - start.current.x,
            dy = e.clientY - start.current.y;
          if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
            swiped.current = true;
            move(dx < 0 ? 1 : -1);
          }
          start.current = null;
        }}
        onPointerCancel={() => {
          start.current = null;
        }}
        onClickCapture={(e) => {
          if (swiped.current) {
            e.preventDefault();
            e.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        <OfferCard offer={offers[current]} onOpen={onClose} />
      </div>
      <div className="offer-browser-controls">
        <button
          className="icon-button outline"
          aria-label="Oferta anterior"
          disabled={current === 0}
          onClick={() => move(-1)}
        >
          <ArrowLeft size={21} />
        </button>
        <span aria-live="polite">
          {current + 1} de {offers.length}
        </span>
        <button
          className="icon-button outline"
          aria-label="Siguiente oferta"
          disabled={current === offers.length - 1}
          onClick={() => move(1)}
        >
          <ArrowRight size={21} />
        </button>
      </div>
      <p className="footnote">
        {offers[current].example
          ? 'Oferta de demostración. No es canjeable.'
          : 'Consulta las condiciones y disponibilidad con el expositor.'}{' '}
        Desliza para explorar; toca la oferta para ver el stand.
      </p>
    </Modal>
  );
}
