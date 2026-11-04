import { useState } from 'react';
import { ChevronRight, Package, Store } from 'lucide-react';
import { Modal } from '@/ui/components';
import { EXAMPLE_ENTREPRENEURS, GAMLP_ENTREPRENEURS, type Entrepreneur } from './gamlp';
import './sector.css';

export function SectorDirectory({ demo = false }: { demo?: boolean }) {
  const [selected, setSelected] = useState<Entrepreneur | null>(null);
  const entries = demo ? EXAMPLE_ENTREPRENEURS : GAMLP_ENTREPRENEURS;
  return (
    <div className="sector-directory">
      {demo && <p className="sector-demo-label">Demostración · emprendimientos ficticios</p>}
      {entries.length ? (
        <div className="sector-entrepreneurs" aria-label="Emprendedores del sector GAMLP">
          {entries.map((entry) => (
            <button key={entry.id} onClick={() => setSelected(entry)}>
              <span className="sector-product-icon">
                <Package size={21} />
              </span>
              <span className="grow">
                <strong>{entry.name}</strong>
                <small>{entry.category}</small>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </div>
      ) : (
        <div className="sector-directory-empty">
          <Store size={25} />
          <div>
            <strong>Emprendedores del GAMLP</strong>
            <p>Pronto podrás consultar sus productos aquí.</p>
          </div>
        </div>
      )}
      {selected && (
        <Modal
          title={selected.name}
          onClose={() => setSelected(null)}
          className="sector-mini-profile"
        >
          {selected.example && (
            <p className="sector-demo-label">Perfil de ejemplo · sin datos comerciales reales</p>
          )}
          <p>{selected.description}</p>
          <h3>Qué encontrarás</h3>
          <ul className="sector-products">
            {selected.products.map((product) => (
              <li key={product}>{product}</li>
            ))}
          </ul>
          <p className="footnote">
            Dentro del sector GAMLP · P14-A y P14-B. La visita se registra para todo el sector.
          </p>
        </Modal>
      )}
    </div>
  );
}
