import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyLogo } from './CompanyLogo';
import { companyProfileUrl, type PhotoCompany } from './model';

export function CompanyRows({ companies }: { companies: readonly PhotoCompany[] }) {
  return (
    <div className="exhibitor-rows">
      {companies.map((company) => (
        <Link key={company.id} to={companyProfileUrl(company.id)}>
          <CompanyLogo company={company} />
          <span className="grow">
            <strong>{company.name}</strong>
            <small>{company.kind === 'service' ? 'Servicio de la feria' : 'Ver perfil'}</small>
          </span>
          <ChevronRight size={17} />
        </Link>
      ))}
    </div>
  );
}
