interface AvatarProps {
  callsign?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

function getColor(str: string): string {
  const colors = [
    "#00f5ff", "#00ff88", "#ff6b00", "#a855f7", "#f59e0b",
    "#ef4444", "#3b82f6", "#10b981", "#f97316", "#8b5cf6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(callsign: string): string {
  const parts = callsign.trim().split(/[-\s]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return callsign.slice(0, 2).toUpperCase();
}

export default function Avatar({ callsign, avatarUrl, size = 40, className = "" }: AvatarProps) {
  const label = callsign || "?";
  const color = getColor(label);
  const initials = getInitials(label);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center flex-shrink-0 font-orbitron font-bold select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `rgba(${hexToRgb(color)}, 0.12)`,
        border: `1px solid ${color}`,
        color,
        fontSize: size * 0.32,
        letterSpacing: "0.05em",
      }}
    >
      {initials}
    </div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
