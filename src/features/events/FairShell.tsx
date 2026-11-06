import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Map, Route, ScanLine, UserRound, CalendarDays, Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Brand } from '@/ui/Brand';
import { useTheme } from '@/ui/theme';
import { LIVE } from '@/services/config';
import { bootstrapAccount } from '@/state/live';
import { PUC_BASE } from './catalog';
import './events.css';
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function FairShell() {
  useTheme();
  const { pathname } = useLocation();
  const inFair = pathname.startsWith(PUC_BASE);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    if (LIVE) void bootstrapAccount();
  }, []);
  useEffect(() => {
    const requestInstall = async () => {
      if (install) {
        await install.prompt();
        if ((await install.userChoice).outcome === 'accepted') setInstall(null);
      } else setInstallHelp((v) => !v);
    };
    window.addEventListener('fexpo-request-install', requestInstall);
    return () => window.removeEventListener('fexpo-request-install', requestInstall);
  }, [install]);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${inFair ? 'Ciudad Productiva' : 'Ferias'} · FEXPO`;
  }, [pathname, inFair]);
  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const installed = () => {
      setInstall(null);
      setInstallHelp(false);
    };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  const tabs = inFair
    ? [
        { to: PUC_BASE, label: 'Inicio', icon: Home, end: true },
        { to: PUC_BASE + '/mapa', label: 'Mapa', icon: Map },
        { to: PUC_BASE + '/escanear', label: 'Escanear', icon: ScanLine },
        { to: PUC_BASE + '/recorrido', label: 'Recorrido', icon: Route },
        { to: PUC_BASE + '/perfil', label: 'Perfil', icon: UserRound },
      ]
    : [
        { to: '/', label: 'Ferias', icon: CalendarDays, end: true },
        { to: '/cuenta', label: 'Perfil', icon: UserRound },
      ];
  return (
    <div className={`fair-stage ${inFair ? 'is-municipal' : ''}`}>
      {!inFair && (
        <aside className="fair-rail">
          <Link to="/" aria-label="FEXPO, elegir feria">
            <Brand />
          </Link>
          <div>
            <span className="eyebrow">UNA APP, DISTINTAS FERIAS</span>
            <h1>
              Encuentra.
              <br />
              Explora.
              <br />
              Participa.
            </h1>
            <p>
              {inFair
                ? 'Tu experiencia en Ciudad Productiva, paso a paso.'
                : 'Elige tu feria y descubre lo que tiene para ti.'}
            </p>
          </div>
          <nav aria-label="Ferias">
            <Link to="/">
              <CalendarDays size={19} />
              Todas las ferias
            </Link>
            {inFair && (
              <Link to={PUC_BASE + '/mapa'}>
                <Map size={19} />
                Mapa del recorrido
              </Link>
            )}
          </nav>
        </aside>
      )}
      <div className="fair-shell">
        <a className="skip-link" href="#fair-content">
          Ir al contenido
        </a>
        <header className={`fair-header ${inFair ? 'municipal-header' : ''}`}>
          {inFair ? (
            <Link
              className="municipal-brand"
              to={PUC_BASE}
              aria-label="Secretaría Municipal de Ciudad Productiva, inicio"
            >
              <span className="municipal-crest">
                <img
                  src="/assets/events/ciudad-productiva/secretaria-logo.png"
                  alt="Gobierno Autónomo Municipal de La Paz"
                />
              </span>
              <span className="municipal-wordmark">
                Secretaría Municipal de<strong>CIUDAD PRODUCTIVA</strong>
              </span>
            </Link>
          ) : (
            <>
              <Link to="/" aria-label="FEXPO, elegir feria">
                <Brand />
              </Link>
              <button
                className="icon-button"
                aria-label="Instalar FEXPO"
                onClick={async () => {
                  if (install) {
                    await install.prompt();
                    const choice = await install.userChoice;
                    if (choice.outcome === 'accepted') setInstall(null);
                  } else setInstallHelp((v) => !v);
                }}
              >
                <Download size={20} />
              </button>
              <Link
                className="icon-button"
                to={inFair ? PUC_BASE + '/perfil' : '/cuenta'}
                aria-label="Mi cuenta"
              >
                <UserRound size={21} />
              </Link>
            </>
          )}
        </header>
        {installHelp && (
          <div className="fair-notice" role="status">
            <span>
              Para instalar FEXPO, abre el menú del navegador y elige «Instalar aplicación» o
              «Añadir a pantalla de inicio». También puedes continuar aquí.
            </span>
            <button
              className="icon-button"
              aria-label="Cerrar ayuda de instalación"
              onClick={() => setInstallHelp(false)}
            >
              <X size={17} />
            </button>
          </div>
        )}
        <main id="fair-content" className="fair-content">
          <Outlet />
        </main>
        <nav className={`fair-nav ${inFair ? '' : 'global-nav'}`} aria-label="Navegación principal">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `${isActive ? 'active ' : ''}${tab.label === 'Escanear' ? 'fair-scan-tab' : ''}`
              }
            >
              <span>
                <tab.icon size={22} />
              </span>
              <small>{tab.label}</small>
            </NavLink>
          ))}
        </nav>
        {needRefresh && (
          <div className="install-banner">
            <span>Hay una nueva versión de FEXPO.</span>
            <button onClick={() => void updateServiceWorker(true)}>Actualizar</button>
            <button
              aria-label="Cerrar aviso de actualización"
              onClick={() => setNeedRefresh(false)}
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
