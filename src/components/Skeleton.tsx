interface Props {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = "", style }: Props) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ background: "rgba(0,245,255,0.06)", ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="p-4" style={{ border: "1px solid rgba(0,245,255,0.08)" }}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-2 w-full mb-2" style={{ width: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
