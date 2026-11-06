import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, Map } from 'lucide-react';
import { LIVE } from '@/services/config';
import { useLive } from '@/state/live';
import { GoogleLogin } from '@/ui/GoogleLogin';
import { PUC_BASE } from './catalog';

export function PucGoogleGate({
  children,
  purpose,
}: {
  children: ReactNode;
  purpose: 'scanner' | 'rating';
}) {
  const status = useLive((state) => state.status);
  const user = useLive((state) => state.user);
  const ready = useLive((state) => state.ready);
  if (LIVE && status === 'signedIn' && user) return children;
  return (
    <section className="puc-google-gate">
      <span className="puc-gate-symbol">
        <LockKeyhole size={27} />
      </span>
      <h1>
        {purpose === 'scanner' ? 'Inicia sesión para escanear' : 'Inicia sesión para calificar'}
      </h1>
      <p>Usa tu cuenta de Google. Después continuarás aquí, en la experiencia que elegiste.</p>
      {LIVE && status === 'loading' && !ready ? (
        <p role="status">Comprobando tu sesión…</p>
      ) : LIVE ? (
        <GoogleLogin purpose={purpose} compact />
      ) : (
        <>
          <button className="button secondary" disabled>
            Continuar con Google
          </button>
          <p className="puc-small-note">
            El acceso con Google está disponible en la versión conectada. Esta vista local no
            permite leer QR ni calificar sin una sesión real.
          </p>
        </>
      )}
      <Link className="button ghost" to={PUC_BASE + '/mapa'}>
        <Map size={17} />
        Explorar el mapa
      </Link>
    </section>
  );
}
