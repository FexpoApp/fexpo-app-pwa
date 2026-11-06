import { isPucExternalQr, pucExperience, PUC_SLUG } from './catalog';
import { markPucScanned } from './progress';

type ScanSource = 'camera' | 'image' | 'external-qr';
export type PucScan = {
  source: ScanSource;
  at: number;
  requestKey: string;
  /** Código del QR impreso que se leyó. El servidor lo exige al registrarla. */
  qrCode: string;
};
const key = (slug: string, owner: string) =>
  `fexpo-rating-access-v1:${PUC_SLUG}:${encodeURIComponent(owner)}:${slug}`;
const MAX_AGE = 6 * 60 * 60 * 1000;

// A local UX gate, not a substitute for a backend-issued scan receipt.
export function hasPucRatingAccess(slug: string, owner: string | undefined, now = Date.now()) {
  if (!owner || !pucExperience(slug)) return false;
  try {
    const data = JSON.parse(sessionStorage.getItem(key(slug, owner)) || 'null');
    return (
      !!data &&
      ['camera', 'image', 'external-qr'].includes(data.source) &&
      // Sin el código del QR el servidor rechazaría la lectura, así que un
      // acceso guardado antes de esta versión no vale.
      isPucExternalQr(slug, data.qrCode ?? null) &&
      Number.isFinite(data.at) &&
      now >= data.at &&
      now - data.at < MAX_AGE
    );
  } catch {
    return false;
  }
}
export function grantPucRatingAccess(
  slug: string,
  owner: string | undefined,
  source: ScanSource,
  qrCode: string | null,
) {
  // El código tiene que ser uno de los emitidos para ESTE punto: así un
  // enlace escrito a mano o el QR de otra parada no habilita la calificación.
  if (!owner || !pucExperience(slug) || !isPucExternalQr(slug, qrCode)) return false;
  try {
    sessionStorage.setItem(
      key(slug, owner),
      JSON.stringify({ source, qrCode, at: Date.now(), requestKey: crypto.randomUUID() }),
    );
    markPucScanned(slug);
    return true;
  } catch {
    return false;
  }
}
export function readPucScan(slug: string, owner: string): PucScan | null {
  if (!hasPucRatingAccess(slug, owner)) return null;
  const data = JSON.parse(sessionStorage.getItem(key(slug, owner))!);
  if (!data.requestKey) {
    data.requestKey = crypto.randomUUID();
    sessionStorage.setItem(key(slug, owner), JSON.stringify(data));
  }
  return data;
}
