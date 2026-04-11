import { User } from "@/App";

interface Props {
  user?: User;
}

export default function Watermark({ user }: Props) {
  if (!user) return null;

  const label = user.callsign || user.name || user.email;
  const text = `${label} · ${user.id}`;

  const items = Array.from({ length: 40 }, (_, i) => i);

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
      style={{ mixBlendMode: "overlay" }}
    >
      {items.map(i => {
        const col = i % 5;
        const row = Math.floor(i / 5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${col * 22 + 4}%`,
              top: `${row * 13 + 5}%`,
              transform: "rotate(-30deg)",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.045)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}
