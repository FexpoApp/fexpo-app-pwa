import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAIR } from './programme';

export function FairIdentity() {
  return (
    <div className="fair-identity-row">
      <Link
        className="fair-identity"
        to={FAIR.route}
        aria-label="FIPAZ 2026: ver agenda e información de la feria"
      >
        <img src={FAIR.logo} alt="FIPAZ" width="80" height="27" fetchPriority="high" />
        <span>
          <small>Agenda</small>
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}
