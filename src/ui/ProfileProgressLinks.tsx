import { Flag, Gift } from 'lucide-react';
import { MenuLink } from './components';

export function ProfileProgressLinks() {
  return (
    <>
      <MenuLink to="/missions" icon={Flag} title="Misiones y progreso" tone="purple" />
      <MenuLink to="/rewards" icon={Gift} title="Mis premios" />
    </>
  );
}
