import { extractStandIds, normalizeUid, validateNfcEvent } from './nfc-payload';
import { UUID, EVENT_ID } from './config';
type NdefRecord = {
  recordType: string;
  encoding?: string;
  data?: DataView;
  toRecords?: () => NdefRecord[];
};
interface Reading extends Event {
  serialNumber: string;
  message: { records: NdefRecord[] };
}
interface Reader extends EventTarget {
  scan(options: { signal: AbortSignal }): Promise<void>;
}
declare global {
  interface Window {
    NDEFReader?: new () => Reader;
  }
}
export const nfcAvailable = () => window.isSecureContext && !!window.NDEFReader;
function decode(records: NdefRecord[]): string[] {
  return records.flatMap((record) => {
    if (record.recordType === 'smart-poster' && record.toRecords) return decode(record.toRecords());
    if (!record.data || !['url', 'text', 'mime', 'absolute-url'].includes(record.recordType))
      return [];
    try {
      return [new TextDecoder(record.encoding || 'utf-8').decode(record.data)];
    } catch {
      return [];
    }
  });
}
export function resolveReading(serialNumber: string, records: string[], context?: string) {
  validateNfcEvent(records, EVENT_ID);
  const ids = extractStandIds(records);
  if (ids.length > 1 || (context && ids.length && context !== ids[0]))
    throw new Error('La tarjeta corresponde a otro stand. Abre su perfil y vuelve a leerla.');
  const standId = ids[0] || context;
  if (!standId || !UUID.test(standId))
    throw new Error('No se identificó el stand. Abre su perfil y pulsa Registrar visita.');
  if (!serialNumber || !/^[0-9a-f:\-\s]+$/i.test(serialNumber))
    throw new Error('No se pudo leer el identificador de esta tarjeta. Usa Mi QR en el stand.');
  const credential = normalizeUid(serialNumber);
  if (!credential)
    throw new Error('Esta tarjeta no entrega un identificador NFC válido. Usa Mi QR.');
  return { standId, credential };
}
export interface RawNfcReading {
  uid: string | null;
  records: string[];
  recordTypes: string[];
  readAt: string;
}
let activeStop: (() => void) | undefined;
export function stopNfcReading() {
  activeStop?.();
}

/**
 * One active reader, one result. After the first reading, keep the foreground
 * reader briefly active while the tag is removed. Repeated native events only
 * extend that quiet window: they never resolve a second check-in.
 * This reduces rapid handoff to Android; it is not an OS-dispatch guarantee.
 */
export function readRawNfc(signal: AbortSignal): Promise<RawNfcReading> {
  if (!nfcAvailable())
    return Promise.reject(
      new Error('Este navegador no admite lectura Web NFC. Usa Chrome en Android con NFC.'),
    );
  if (signal.aborted) return Promise.reject(new DOMException('Lectura cancelada.', 'AbortError'));
  stopNfcReading();
  return new Promise((resolve, reject) => {
    const reader = new window.NDEFReader!(),
      scanController = new AbortController();
    let settled = false,
      closed = false;
    let quiet: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearTimeout(timeout);
      clearTimeout(quiet);
      clearTimeout(deadline);
      reader.removeEventListener('reading', reading);
      reader.removeEventListener('readingerror', failed);
      signal.removeEventListener('abort', abort);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', abort);
      scanController.abort();
      if (activeStop === abort) activeStop = undefined;
    };
    const fail = (error: unknown) => {
      cleanup();
      if (!settled) {
        settled = true;
        reject(error);
      }
    };
    const abort = () => fail(new DOMException('Lectura cancelada.', 'AbortError'));
    const visibility = () => {
      if (document.hidden) abort();
    };
    const failed = () => {
      if (!settled)
        fail(new Error('No se pudo leer la tarjeta. Usa una etiqueta NFC con formato NDEF.'));
    };
    const hold = () => {
      clearTimeout(quiet);
      quiet = setTimeout(cleanup, 2000);
    };
    const reading = (event: Event) => {
      if (closed) return;
      if (settled) {
        hold();
        return;
      }
      try {
        const e = event as Reading;
        const result: RawNfcReading = {
          uid:
            e.serialNumber && /^[0-9a-f:\-\s]+$/i.test(e.serialNumber)
              ? normalizeUid(e.serialNumber)
              : null,
          records: decode(e.message.records),
          recordTypes: e.message.records.map((r) => r.recordType),
          readAt: new Date().toISOString(),
        };
        settled = true;
        clearTimeout(timeout);
        hold();
        deadline = setTimeout(cleanup, 8000);
        resolve(result);
      } catch (error) {
        fail(error);
      }
    };
    const timeout = setTimeout(
      () => fail(new Error('No encontramos una tarjeta. Retírala e inicia otra lectura.')),
      30000,
    );
    activeStop = abort;
    signal.addEventListener('abort', abort, { once: true });
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', abort);
    reader.addEventListener('reading', reading);
    reader.addEventListener('readingerror', failed);
    try {
      void reader.scan({ signal: scanController.signal }).catch(fail);
    } catch (error) {
      fail(error);
    }
  });
}
export function readNfc(
  signal: AbortSignal,
  context?: string,
): Promise<{ standId: string; credential: string }> {
  return readRawNfc(signal).then((result) =>
    resolveReading(result.uid || '', result.records, context),
  );
}
