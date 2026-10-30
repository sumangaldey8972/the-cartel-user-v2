type BrandMarkProps = { compact?: boolean; inverse?: boolean };

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}>
      <span className={`brand-symbol ${inverse ? "brand-symbol--inverse" : ""}`} aria-hidden="true">
        <i /><i /><i />
      </span>
      {!compact && <span className="brand-wordmark">THE CARTEL<span>.AI</span></span>}
    </div>
  );
}
