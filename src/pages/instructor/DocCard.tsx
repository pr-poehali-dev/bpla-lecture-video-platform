import Icon from "@/components/ui/icon";
import { Doc, fmtDate } from "./DocTypes";

interface Props {
  doc: Doc;
  idx: number;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (doc: Doc) => void;
  isOwn: boolean;
}

export default function DocCard({ doc, idx, onOpen, onDelete, onShare, isOwn }: Props) {
  return (
    <div className="flex items-center gap-3 p-4 cursor-pointer group transition-all animate-fade-in"
      style={{ animationDelay: `${idx * 0.04}s`, background: "rgba(13,27,46,0.5)", border: `1px solid ${doc.is_shared ? "rgba(168,85,247,0.2)" : "rgba(0,255,136,0.1)"}` }}
      onClick={() => onOpen(doc.id)}>
      <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
        <Icon name="FileText" size={16} className="text-[#00ff88]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-plex text-sm text-white group-hover:text-[#00ff88] transition-colors">{doc.title}</span>
          {doc.is_shared && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 flex items-center gap-1"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7" }}>
              <Icon name="Share2" size={8} /> ОБЩИЙ
            </span>
          )}
        </div>
        <div className="font-mono text-[10px] text-[#3a5570] flex flex-wrap gap-x-3 mt-0.5">
          {doc.category && <span>{doc.category}</span>}
          {doc.subject && <span>{doc.subject}</span>}
          {doc.group_name && <span className="text-[#00f5ff]">{doc.group_name}</span>}
          <span>{fmtDate(doc.updated_at)}</span>
          {!isOwn && <span className="text-[#a855f7]">{doc.instructor_callsign || doc.instructor_name}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {isOwn && (
          <button onClick={() => onShare(doc)} title={doc.is_shared ? "Закрыть доступ" : "Поделиться"}
            className="w-8 h-8 flex items-center justify-center transition-colors"
            style={{ color: doc.is_shared ? "#a855f7" : "#3a5570" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#a855f7")}
            onMouseLeave={e => (e.currentTarget.style.color = doc.is_shared ? "#a855f7" : "#3a5570")}>
            <Icon name="Share2" size={14} />
          </button>
        )}
        <button onClick={() => onOpen(doc.id)} title="Открыть"
          className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00ff88] transition-colors">
          <Icon name="ExternalLink" size={14} />
        </button>
        {isOwn && (
          <button onClick={() => onDelete(doc.id)} title="Удалить"
            className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
            <Icon name="Trash2" size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
