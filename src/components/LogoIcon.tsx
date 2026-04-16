interface Props {
  size?: number;
  className?: string;
}

export default function LogoIcon({ size = 24, className = "" }: Props) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="28" y="28" width="8" height="8" rx="1" fill="currentColor"/>
      <rect x="30" y="12" width="4" height="16" rx="1" fill="currentColor"/>
      <rect x="30" y="36" width="4" height="16" rx="1" fill="currentColor"/>
      <rect x="12" y="30" width="16" height="4" rx="1" fill="currentColor"/>
      <rect x="36" y="30" width="16" height="4" rx="1" fill="currentColor"/>
      <circle cx="14" cy="14" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="50" cy="14" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="50" cy="50" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="14" r="2" fill="currentColor"/>
      <circle cx="50" cy="14" r="2" fill="currentColor"/>
      <circle cx="14" cy="50" r="2" fill="currentColor"/>
      <circle cx="50" cy="50" r="2" fill="currentColor"/>
      <line x1="18" y1="18" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
      <line x1="46" y1="18" x2="36" y2="28" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
      <line x1="18" y1="46" x2="28" y2="36" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
      <line x1="46" y1="46" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6"/>
    </svg>
  );
}
