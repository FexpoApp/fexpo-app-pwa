import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, Handshake } from 'lucide-react';
import { useLive, message } from '@/state/live';
import { LIVE } from '@/services/config';
import { request } from '@/services/api';
import type { Stand } from '@/types/domain';
import { Modal } from './components';

// Session-only acknowledgment: no contact data is persisted in the browser.
const sent = new Set<string>();
export function BusinessConnection({ stand }: { stand: Stand }) {
  const user = useLive((s) => s.user);
  return (
    <ConnectionForm
      key={`${user?.id ?? 'guest'}:${stand.id}`}
      stand={stand}
      userId={user?.id ?? null}
      name={user?.displayName ?? ''}
    />
  );
}
function ConnectionForm({
  stand,
  userId,
  name,
}: {
  stand: Stand;
  userId: string | null;
  name: string;
}) {
  const key = `${userId}:${stand.id}`;
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(sent.has(key));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [contactName, setName] = useState(name);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const alive = useRef(true);
  const flight = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      flight.current ||
      !consent ||
      !LIVE ||
      !userId ||
      useLive.getState().user?.id !== userId ||
      useLive.getState().status !== 'signedIn'
    )
      return;
    flight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await request<{ id: string }>(`/stands/${stand.id}/leads`, {
        method: 'POST',
        auth: true,
        body: {
          contact_name: contactName.trim(),
          contact_email: email.trim(),
          ...(phone.trim() ? { contact_phone: phone.trim() } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          consent_given: true,
        },
      });
      if (!result.data?.id) throw new Error('El servidor no confirmó el registro.');
      sent.add(key);
      if (alive.current && useLive.getState().user?.id === userId) {
        setDone(true);
        setOpen(false);
        setEmail('');
        setPhone('');
        setNotes('');
      }
    } catch (e) {
      if (alive.current) setError(message(e));
    } finally {
      flight.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <>
      <button
        className={`button connect-button ${done ? 'connected' : ''}`}
        disabled={done}
        onClick={() => setOpen(true)}
      >
        {done ? <Check size={19} /> : <Handshake size={19} />}
        {done ? 'Interés comercial enviado' : 'Conectar con la empresa'}
      </button>
      {open && (
        <Modal
          title="Conexión comercial"
          onClose={() => {
            if (!busy) setOpen(false);
          }}
        >
          <p>
            Comparte tus datos con <strong>{stand.name}</strong> para solicitar información
            comercial o coordinar una reunión. La empresa podrá contactarte; esto no confirma una
            cita.
          </p>
          {!LIVE ? (
            <>
              <p className="card">Vista de demostración. No se envían datos a ninguna empresa.</p>
              <button className="button secondary" onClick={() => setOpen(false)}>
                Entendido
              </button>
            </>
          ) : !userId ? (
            <>
              <p>Accede a tu cuenta para enviar tu interés comercial.</p>
              <Link className="button" to="/profile" onClick={() => setOpen(false)}>
                Continuar desde Perfil
              </Link>
            </>
          ) : (
            <form className="stack connection-form" onSubmit={(e) => void submit(e)}>
              <label>
                Nombre completo
                <input
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={contactName}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Correo de contacto
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Celular <small>(opcional, con código de país)</small>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+591…"
                  pattern="\+[1-9][0-9]{6,14}"
                  title="Usa el formato internacional, por ejemplo +59160558680"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={busy}
                />
              </label>
              <label>
                Me interesa <small>(opcional)</small>
                <textarea
                  rows={2}
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={busy}
                  placeholder="Información, distribución, una reunión…"
                />
              </label>
              <label className="consent-row">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  Autorizo compartir estos datos con {stand.name} para que me contacte sobre esta
                  solicitud.
                </span>
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error} Si el envío se interrumpió, consulta al expositor antes de reenviar.
                </p>
              )}
              <button className="button" type="submit" disabled={busy || !consent}>
                {busy ? 'Enviando…' : 'Enviar interés comercial'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
