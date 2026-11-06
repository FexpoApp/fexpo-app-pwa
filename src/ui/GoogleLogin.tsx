import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from '@/services/config';
import { useLive, message } from '@/state/live';
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback: (error: { type: string }) => void;
          }) => { requestAccessToken: (options?: { prompt: string }) => void };
        };
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select: boolean;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
let loading: Promise<void> | null = null;
export function loadGoogle() {
  if (window.google) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timer = setTimeout(() => {
      loading = null;
      script.remove();
      reject(new Error('Google no respondió. Revisa tu conexión e inténtalo de nuevo.'));
    }, 12000);
    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timer);
      loading = null;
      script.remove();
      reject(new Error('No se pudo abrir Google. Revisa tu conexión.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
export function GoogleLogin({
  purpose = 'passport',
  compact = false,
}: {
  purpose?: 'passport' | 'rating' | 'account' | 'scanner';
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('El acceso con Google todavía no está configurado.');
      return;
    }
    let active = true;
    setError('');
    void loadGoogle()
      .then(() => {
        if (!active || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          callback: (response) => {
            if (!active) return;
            setBusy(true);
            setError('');
            void useLive
              .getState()
              .login(response.credential, purpose !== 'passport')
              .catch((e) => {
                if (active) {
                  setError(message(e));
                  setBusy(false);
                }
              });
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          locale: 'es',
          width: Math.min(320, ref.current.clientWidth),
        });
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [attempt, purpose]);
  return (
    <div className={compact ? 'google-login google-login-compact' : 'card stack google-login'}>
      {!compact && (
        <>
          <h3>
            {purpose === 'scanner'
              ? 'Google es necesario para leer QR'
              : purpose === 'rating'
                ? 'Google es necesario para calificar'
                : purpose === 'account'
                  ? 'Tu cuenta FEXPO'
                  : 'Tu recorrido empieza aquí'}
          </h3>
          <p>
            {purpose === 'scanner'
              ? 'Inicia sesión para activar la cámara y abrir las calificaciones del recorrido.'
              : purpose === 'rating'
                ? 'Inicia sesión una vez y comparte tu opinión en los cinco puntos. Conservaremos esta experiencia y tu borrador.'
                : purpose === 'account'
                  ? 'Una cuenta para explorar tus ferias y participar.'
                  : 'Accede con Google para guardar visitas, puntos y favoritos.'}
          </p>
        </>
      )}
      <div ref={ref} />
      {busy && (
        <p role="status">
          {purpose === 'passport' ? 'Abriendo tu pasaporte…' : 'Conectando tu cuenta…'}
        </p>
      )}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button className="button secondary" onClick={() => setAttempt((v) => v + 1)}>
            Reintentar acceso
          </button>
        </>
      )}
    </div>
  );
}
