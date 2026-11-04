import { useEffect, useState } from 'react';
import type { PhotoCompany } from './model';
import './exhibitors.css';

export function CompanyLogo({
  company,
  className = '',
}: {
  company: Pick<PhotoCompany, 'id' | 'name' | 'logo'>;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = company.logo?.src;
  useEffect(() => setFailed(false), [src]);
  const initials = company.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className={`exhibitor-logo ${company.logo?.background === 'dark' && !failed ? 'logo-on-dark' : ''} ${className}`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`Logo de ${company.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="exhibitor-initials" aria-label={`Iniciales de ${company.name}`}>
          {initials}
        </span>
      )}
    </span>
  );
}
