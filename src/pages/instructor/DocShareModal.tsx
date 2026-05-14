import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import { Doc } from "./DocTypes";

interface Instructor { id: number; name: string; callsign: string; role: string; }
interface AccessEntry { grantee_id: number; name: string; callsign: string; role: string; }

interface Props {
  doc: Doc;
  onClose: () => void;
}

export default function DocShareModal({ doc, onClose }: Props) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [access, setAccess] = useState<AccessEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [granting, setGranting] = useState<number | null>(null);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const reload = () => {
    Promise.all([
      api.instructor.instructorsList(),
      api.instructor.docAccessList(doc.id),
    ]).then(([instRes, accRes]) => {
      setInstructors(instRes.instructors || []);
      setAccess(accRes.access || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [doc.id]);

  const hasAccess = (id: number) => access.some(a => a.grantee_id === id);

  const grant = async (id: number) => {
    setGranting(id);
    const res = await api.instructor.docShare(doc.id, id);
    setGranting(null);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Доступ выдан");
    reload();
  };

  const revoke = async (id: number) => {
    setRevoking(id);
    const res = await api.instructor.docUnshare(doc.id, id);
    setRevoking(null);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg("Доступ отозван");
    reload();
  };

  const filtered = instructors.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.callsign.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(5,8,16,0.97)" }} onClick={onClose}>
      <div className="w-full sm:max-w-md flex flex-col animate-fade-in"
        style={{ border: "1px solid rgba(168,85,247,0.3)", background: "#070d18", boxShadow: "0 0 40px rgba(168,85,247,0.12)", maxHeight: "80vh" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
          <div>
            <div className="font-mono text-[10px] text-[#a855f7] tracking-[0.3em] mb-0.5">// ДОСТУП</div>
            <div className="font-orbitron text-sm font-bold text-white tracking-wider truncate max-w-[260px]">{doc.title}</div>
          </div>
          <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors ml-3 flex-shrink-0">
            <Icon name="X" size={18} />
          </button>
        </div>

        {msg && (
          <div className="px-5 py-2 font-mono text-xs flex-shrink-0"
            style={{ background: msg.ok ? "rgba(0,255,136,0.06)" : "rgba(255,34,68,0.06)", color: msg.ok ? "#00ff88" : "#ff2244" }}>
            {msg.ok ? "✓" : "✗"} {msg.text}
          </div>
        )}

        {/* Кто уже имеет доступ */}
        {access.length > 0 && (
          <div className="px-5 pt-4 pb-2 flex-shrink-0">
            <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2">ИМЕЮТ ДОСТУП</div>
            <div className="space-y-1">
              {access.map(a => (
                <div key={a.grantee_id} className="flex items-center gap-3 px-3 py-2"
                  style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-plex text-xs text-white truncate">{a.name}</div>
                    <div className="font-mono text-[10px] text-[#a855f7]">{a.callsign}</div>
                  </div>
                  <button onClick={() => revoke(a.grantee_id)} disabled={revoking === a.grantee_id}
                    className="flex items-center gap-1 font-mono text-[10px] px-2 py-1 transition-all disabled:opacity-50"
                    style={{ border: "1px solid rgba(255,34,68,0.3)", color: "#ff2244" }}>
                    {revoking === a.grantee_id ? <Icon name="Loader" size={10} className="animate-spin" /> : <Icon name="UserMinus" size={10} />}
                    Отозвать
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Поиск */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2">ВЫДАТЬ ДОСТУП</div>
          <div className="relative">
            <Icon name="Search" size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по имени или позывному..."
              className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
              style={{ border: "1px solid rgba(168,85,247,0.2)" }} />
          </div>
        </div>

        {/* Список инструкторов */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-1">
          {loading ? (
            <div className="text-center py-8 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-[#3a5570]">Инструкторы не найдены</div>
          ) : filtered.map(inst => {
            const granted = hasAccess(inst.id);
            return (
              <div key={inst.id} className="flex items-center gap-3 px-3 py-2.5 transition-all"
                style={{ background: "rgba(13,27,46,0.5)", border: `1px solid ${granted ? "rgba(168,85,247,0.2)" : "rgba(0,245,255,0.06)"}` }}>
                <div className="flex-1 min-w-0">
                  <div className="font-plex text-xs text-white truncate">{inst.name}</div>
                  <div className="font-mono text-[10px] text-[#3a5570]">{inst.callsign} · {inst.role}</div>
                </div>
                {granted ? (
                  <div className="font-mono text-[10px] text-[#a855f7] flex items-center gap-1">
                    <Icon name="Check" size={10} /> Есть доступ
                  </div>
                ) : (
                  <button onClick={() => grant(inst.id)} disabled={granting === inst.id}
                    className="flex items-center gap-1 font-mono text-[10px] px-2.5 py-1.5 transition-all disabled:opacity-50"
                    style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
                    {granting === inst.id ? <Icon name="Loader" size={10} className="animate-spin" /> : <Icon name="UserPlus" size={10} />}
                    Выдать
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
