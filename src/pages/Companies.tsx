import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, MapPin, Search } from 'lucide-react';
import { Empty } from '@/ui/components';
import { CompanyLogo } from '@/features/exhibitors/CompanyLogo';
import { CompanyRows } from '@/features/exhibitors/CompanyRows';
import {
  PHOTO_COMPANIES,
  companyKey,
  photoCompany,
  placementMapUrl,
  planLocation,
  type Placement,
} from '@/features/exhibitors/model';
import { GAMLP } from '@/features/sectors/gamlp';

export function PhotoCompaniesPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const term = companyKey(query);
  const items = PHOTO_COMPANIES.filter(
    (company) =>
      !term ||
      companyKey(company.name).includes(term) ||
      company.placements.some((p) => companyKey(p.printedCode).includes(term)),
  );
  return (
    <section className="photo-company-directory">
      <label className="search-field">
        <Search size={18} />
        <input
          type="search"
          placeholder="Empresa o número de espacio"
          aria-label="Buscar en el directorio de la feria"
          value={query}
          onChange={(event) =>
            setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
          }
        />
      </label>
      <div className="exhibitor-count">
        <span>Guía de expositores</span>
        <small>{items.length} resultados</small>
      </div>
      <CompanyRows companies={items} />
      {!items.length && (
        <Empty title="No encontramos esa empresa">Busca por su nombre o el código impreso.</Empty>
      )}
      <p className="footnote">
        Guía fotografiada el 4 de noviembre de 2026. Las iniciales identifican las empresas cuyo
        logo aún no está verificado.
      </p>
    </section>
  );
}

function Location({ placement }: { placement: Placement }) {
  const url = placementMapUrl(placement);
  const content = (
    <>
      <MapPin size={18} />
      <span className="grow">
        <strong>{placement.printedCode}</strong>
        <small>{planLocation(placement.planId)}</small>
        {placement.match === 'shared' && <small>Comparte el espacio {placement.lotCode}</small>}
        {!url && <small>Ubicación por confirmar</small>}
      </span>
      {url && <ArrowUpRight size={17} />}
    </>
  );
  return url ? (
    <Link className="exhibitor-location" to={url}>
      {content}
    </Link>
  ) : (
    <div className="exhibitor-location">{content}</div>
  );
}
export function PhotoCompanyPage() {
  const { id = '' } = useParams();
  const company = photoCompany(id);
  const [showSource, setShowSource] = useState(false);
  if (!company)
    return (
      <Empty title="Empresa no encontrada">
        <Link to="/companies">Ver directorio</Link>
      </Empty>
    );
  return (
    <article className="photo-company-profile">
      <header className="exhibitor-identity">
        <CompanyLogo company={company} />
        <div>
          <h1>{company.name}</h1>
          <small>{company.kind === 'service' ? 'Servicio de la feria' : 'Expositor FIPAZ'}</small>
        </div>
      </header>
      <div className="exhibitor-locations" aria-label="Espacios de la empresa">
        {company.placements.map((p) => (
          <Location placement={p} key={p.id} />
        ))}
      </div>
      {company.id === 'gamlp' && (
        <Link className="button secondary" to={GAMLP.profileUrl}>
          Emprendedores del sector GAMLP
          <ArrowUpRight size={17} />
        </Link>
      )}
      <div className="exhibitor-profile-source">
        <button
          className="button ghost"
          onClick={() => setShowSource((value) => !value)}
          aria-expanded={showSource}
        >
          Guía de expositores · 04 nov 2026
        </button>
        {showSource && (
          <div>
            <p>
              Nombre y códigos transcritos de la guía fotografiada. La ubicación que figura por
              confirmar conserva un código sin correspondencia segura en el dibujo.
            </p>
            {company.logo && (
              <a href={company.logo.sourcePage} target="_blank" rel="noopener noreferrer">
                Fuente del logo
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
