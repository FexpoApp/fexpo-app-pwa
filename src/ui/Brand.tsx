export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`fexpo-brand ${compact ? 'compact' : ''}`}>
      <span className="fexpo-symbol" aria-hidden="true" />
      {!compact && <span className="fexpo-wordmark">fexpo</span>}
    </span>
  );
}
