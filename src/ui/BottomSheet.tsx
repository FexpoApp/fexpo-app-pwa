import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  const [bounds, setBounds] = useState({ left: 0, width: window.innerWidth });
  useEffect(() => {
    const shell = document.querySelector('.app-shell');
    const measure = () => {
      const r = shell?.getBoundingClientRect();
      setBounds({ left: r?.left ?? 0, width: r?.width ?? innerWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (shell) observer.observe(shell);
    window.addEventListener('resize', measure);
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      document.body.style.overflow = oldOverflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="stand-bottom-sheet"
      style={bounds}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-title-row">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Cerrar ficha"
          onClick={() => ref.current?.close()}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
