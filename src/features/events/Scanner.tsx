import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, ScanLine, ArrowRight, ImagePlus } from 'lucide-react';
import { PUC_BASE, resolvePucQr } from './catalog';
import { markPucScanned } from './progress';
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorConstructor = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};
export function PucScannerPage() {
  const navigate = useNavigate();
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  function stop() {
    generation.current++;
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setRunning(false);
    setBusy(false);
  }
  useEffect(() => {
    const hide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      generation.current++;
      if (timer.current) clearTimeout(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  function open(raw: string, scanned = false) {
    const path = resolvePucQr(raw, window.location.origin);
    if (!path) {
      setError(
        'Ese enlace no corresponde a un QR de Ciudad Productiva. Revisa el código o consulta el recorrido.',
      );
      return false;
    }
    if (scanned) {
      const slug = path.split('/calificar/')[1];
      if (slug) markPucScanned(slug);
    }
    stop();
    navigate(path);
    return true;
  }
  async function start() {
    stop();
    const request = ++generation.current;
    setError('');
    setBusy(true);
    try {
      const NativeDetector = (window as Window & { BarcodeDetector?: DetectorConstructor })
        .BarcodeDetector;
      let detector: Detector | null = null;
      try {
        if (NativeDetector && (await NativeDetector.getSupportedFormats()).includes('qr_code'))
          detector = new NativeDetector({ formats: ['qr_code'] });
      } catch {
        /* Use the software decoder if native detection is unavailable. */
      }
      let decoder = detector ? null : (await import('jsqr')).default;
      if (generation.current !== request) return;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('No se pudo acceder a la cámara. Puedes pegar el enlace del QR.');
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      if (generation.current !== request) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = media;
      video.current!.srcObject = media;
      await video.current!.play();
      if (generation.current !== request) return;
      setRunning(true);
      setBusy(false);
      const scan = async () => {
        if (generation.current !== request) return;
        try {
          let raw: string | undefined;
          if (detector) {
            try {
              raw = (await detector.detect(video.current!))[0]?.rawValue;
            } catch {
              detector = null;
              decoder = (await import('jsqr')).default;
            }
          }
          if (!detector && decoder && context && video.current?.videoWidth) {
            const source = video.current;
            const scale = Math.min(1, 960 / Math.max(source.videoWidth, source.videoHeight));
            canvas.width = Math.max(1, Math.round(source.videoWidth * scale));
            canvas.height = Math.max(1, Math.round(source.videoHeight * scale));
            context.drawImage(source, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            raw = decoder(frame.data, frame.width, frame.height, {
              inversionAttempts: 'attemptBoth',
            })?.data;
          }
          if (generation.current !== request) return;
          if (raw && open(raw, true)) return;
        } catch {
          if (generation.current === request) {
            stop();
            setError('No pudimos procesar esta cámara. Reintenta o selecciona una foto del QR.');
          }
          return;
        }
        if (generation.current === request) timer.current = setTimeout(() => void scan(), 250);
      };
      void scan();
    } catch (e) {
      if (generation.current !== request) return;
      stop();
      setError(
        e instanceof DOMException && e.name === 'NotAllowedError'
          ? 'Permite el acceso a la cámara o pega el enlace del QR.'
          : e instanceof Error && e.name === 'Error'
            ? e.message
            : 'No se pudo abrir la cámara. Usa la cámara del teléfono o pega el enlace del QR.',
      );
    }
  }
  async function readImage(file: File) {
    stop();
    const request = ++generation.current;
    setBusy(true);
    setError('');
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const { default: decode } = await import('jsqr');
      if (generation.current !== request) return;
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Canvas unavailable');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const frame = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = decode(frame.data, frame.width, frame.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (!result)
        setError('No encontramos un QR legible en la imagen. Acércate y evita reflejos.');
      else open(result.data, true);
    } catch {
      if (generation.current === request)
        setError('No pudimos leer esa imagen. Prueba con una foto más nítida.');
    } finally {
      URL.revokeObjectURL(url);
      if (generation.current === request) setBusy(false);
    }
  }
  return (
    <section className="puc-scanner-page">
      <h1>Escanea un QR</h1>
      <p>Abre la experiencia que visitaste y comparte tu opinión.</p>
      <div className={`puc-camera ${running ? 'running' : ''}`}>
        <video ref={video} playsInline muted aria-label="Vista de la cámara para leer QR" />
        {!running && (
          <div className="puc-camera-empty">
            <ScanLine size={58} />
            <strong>QR de Ciudad Productiva</strong>
            <small>Sección municipal · GAMLP</small>
          </div>
        )}
        <span className="puc-camera-corners" aria-hidden="true" />
      </div>
      <button
        className="button puc-primary"
        disabled={busy}
        onClick={() => (running ? stop() : void start())}
      >
        <Camera size={18} />
        {busy ? 'Abriendo cámara…' : running ? 'Detener cámara' : 'Activar cámara'}
      </button>
      <p className="puc-camera-hint" role="status">
        {running
          ? 'Apunta al código completo y mantén el teléfono quieto.'
          : 'Permite la cámara y encuadra el QR de la experiencia.'}
      </p>
      <label className={`button secondary puc-image-upload ${busy ? 'disabled' : ''}`}>
        <ImagePlus size={18} /> Leer QR de una imagen
        <input
          type="file"
          accept="image/*"
          aria-label="Seleccionar imagen de un QR"
          disabled={busy}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void readImage(file);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {error && (
        <p className="puc-form-error" role="alert">
          {error}
        </p>
      )}
      <form
        className="puc-qr-link"
        onSubmit={(event) => {
          event.preventDefault();
          open(value);
        }}
      >
        <label>
          También puedes pegar el enlace del QR
          <input
            type="text"
            inputMode="url"
            placeholder="https://app.fexpo.lat/…"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
        </label>
        <button className="button secondary" type="submit">
          Abrir experiencia
          <ArrowRight size={17} />
        </button>
      </form>
      <Link className="button ghost" to={PUC_BASE + '/recorrido'}>
        Ver los cinco puntos del recorrido
      </Link>
    </section>
  );
}
