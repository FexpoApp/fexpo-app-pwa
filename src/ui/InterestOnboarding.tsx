import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import { CATEGORIES } from '@/data/demo-data';
import type { StandCategory } from '@/types/domain';
import { useInterestEditor, useVisitorInterests } from '@/state/interests';
import { Modal, categoryMeta } from './components';

export function InterestOnboarding() {
  const preference = useVisitorInterests(),
    editor = useInterestEditor(),
    { pathname } = useLocation();
  if (
    !editor.open &&
    !(preference.autoAsk && !preference.completed && ['/', '/profile'].includes(pathname))
  )
    return null;
  const close = () => editor.close();
  return (
    <Picker
      key={preference.key}
      initial={preference.categories}
      onSave={(selected) => {
        preference.save(selected);
        close();
      }}
    />
  );
}
function Picker({
  initial,
  onSave,
}: {
  initial: StandCategory[];
  onSave: (selected: StandCategory[]) => void;
}) {
  const [selected, setSelected] = useState(initial);
  return (
    <Modal title="¿Qué te interesa descubrir?" onClose={() => onSave(initial)}>
      <p>Elige tus intereses para encontrar ofertas de la feria. Puedes cambiarlos desde Inicio.</p>
      <div className="interest-options">
        {CATEGORIES.map((c) => {
          const Icon = categoryMeta[c.id].icon,
            active = selected.includes(c.id);
          return (
            <button
              key={c.id}
              className={active ? 'interest-option selected' : 'interest-option'}
              aria-pressed={active}
              onClick={() =>
                setSelected((items) =>
                  active ? items.filter((id) => id !== c.id) : [...items, c.id],
                )
              }
            >
              <Icon size={22} />
              <span>{c.label}</span>
              {active && <Check size={15} />}
            </button>
          );
        })}
      </div>
      <button className="button" onClick={() => onSave(selected)}>
        {selected.length ? 'Guardar intereses' : 'Mostrar todas las ofertas'}
      </button>
      {!!selected.length && (
        <button className="button secondary" onClick={() => onSave([])}>
          Ver todas las categorías
        </button>
      )}
      <p className="footnote">Preferencias guardadas en este dispositivo para tu cuenta.</p>
    </Modal>
  );
}
