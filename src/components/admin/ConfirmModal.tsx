import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export default function ConfirmModal({ open, title, message, confirmLabel = "Подтвердить", cancelLabel = "Отмена", danger = false, onConfirm, onCancel, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div ref={ref} className="w-full max-w-md animate-fade-in"
        style={{ background: "#0d1b2e", border: `1px solid ${danger ? "rgba(255,34,68,0.3)" : "rgba(0,245,255,0.2)"}`, boxShadow: `0 0 40px ${danger ? "rgba(255,34,68,0.15)" : "rgba(0,245,255,0.1)"}` }}>
        <div className="flex items-center gap-3 p-5 border-b" style={{ borderColor: danger ? "rgba(255,34,68,0.15)" : "rgba(0,245,255,0.1)" }}>
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
            style={{ background: danger ? "rgba(255,34,68,0.1)" : "rgba(0,245,255,0.08)", border: `1px solid ${danger ? "rgba(255,34,68,0.3)" : "rgba(0,245,255,0.2)"}` }}>
            <Icon name={danger ? "AlertTriangle" : "Info"} size={15} style={{ color: danger ? "#ff2244" : "#00f5ff" }} />
          </div>
          <div className="font-orbitron text-sm font-bold text-white tracking-wider">{title}</div>
          <button onClick={onCancel} className="ml-auto text-[#3a5570] hover:text-white transition-colors">
            <Icon name="X" size={16} />
          </button>
        </div>

        <div className="p-5">
          <p className="font-plex text-sm text-[#a0b8cc] mb-4 leading-relaxed">{message}</p>
          {children && <div className="mb-4">{children}</div>}
          <div className="flex gap-3 justify-end">
            <button onClick={onCancel}
              className="px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.15)" }}>
              {cancelLabel}
            </button>
            <button onClick={onConfirm}
              className="px-5 py-2 font-mono text-xs font-bold transition-all"
              style={danger
                ? { background: "rgba(255,34,68,0.12)", border: "1px solid rgba(255,34,68,0.4)", color: "#ff2244", boxShadow: "0 0 12px rgba(255,34,68,0.15)" }
                : { background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", boxShadow: "0 0 12px rgba(0,245,255,0.1)" }
              }>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
