import { afterEach, describe, expect, it, vi } from 'vitest';
import { readRawNfc, stopNfcReading, resolveReading } from '@/services/nfc';
import { EVENT_ID } from '@/services/config';
let reader: EventTarget, scanSignal: AbortSignal;
function setup() {
  vi.useFakeTimers();
  const doc = new EventTarget();
  Object.assign(doc, { hidden: false });
  const win = new EventTarget();
  Object.assign(win, {
    isSecureContext: true,
    NDEFReader: class extends EventTarget {
      async scan({ signal }: { signal: AbortSignal }) {
        reader = this;
        scanSignal = signal;
      }
    },
  });
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
}
function emit() {
  const event = new Event('reading');
  Object.assign(event, {
    serialNumber: '04:a1:b2:c3',
    message: {
      records: [{ recordType: 'text', data: new DataView(new TextEncoder().encode('tag').buffer) }],
    },
  });
  reader.dispatchEvent(event);
}
afterEach(() => {
  stopNfcReading();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('sesión NFC exclusiva', () => {
  it('resuelve una vez y mantiene brevemente el lector antes de liberarlo', async () => {
    setup();
    const result = vi.fn();
    const pending = readRawNfc(new AbortController().signal).then(result);
    emit();
    await pending;
    emit();
    emit();
    expect(result).toHaveBeenCalledTimes(1);
    expect(scanSignal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(2001);
    expect(scanSignal.aborted).toBe(true);
  });
  it('cancela inmediatamente al ocultar la página y no deja un lector activo', async () => {
    setup();
    const pending = readRawNfc(new AbortController().signal);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    Object.assign(document, { hidden: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await rejected;
    expect(scanSignal.aborted).toBe(true);
  });
  it('valida el evento y versión del texto JSON de producción', () => {
    const id = '5a000000-0000-4000-8000-000000000001';
    expect(
      resolveReading('04a1b2c3', [JSON.stringify({ v: 1, eventId: EVENT_ID, standId: id })])
        .standId,
    ).toBe(id);
    expect(() =>
      resolveReading('04a1b2c3', [JSON.stringify({ v: 1, eventId: 'otro', standId: id })]),
    ).toThrow(/otra feria/);
    expect(() =>
      resolveReading('04a1b2c3', [JSON.stringify({ v: 2, eventId: EVENT_ID, standId: id })]),
    ).toThrow(/versión/);
  });
});
