import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { Doc, CATEGORIES } from "./DocTypes";
import DocEditor from "./DocEditor";
import DocCard from "./DocCard";

interface Props { user: User; }

export default function InstructorDocsTab({ user }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Все");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const load = () => {
    setLoading(true);
    api.instructor.docsList(showAll)
      .then(res => { setDocs(res.docs || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [showAll]);

  const createNew = async () => {
    const res = await api.instructor.docCreate({ title: "Новый документ", category: "Конспект", content_html: "" });
    if (res.error) { showMsg(res.error, false); return; }
    // Открываем сразу на редактирование
    const newDoc = await api.instructor.docGet(res.id);
    if (newDoc.doc) { setEditingDoc(newDoc.doc); load(); }
  };

  const openDoc = async (id: number) => {
    const res = await api.instructor.docGet(id);
    if (res.doc) setEditingDoc(res.doc);
    else showMsg(res.error || "Ошибка загрузки", false);
  };

  const handleSave = async (html: string, meta: Partial<Doc>) => {
    if (!editingDoc) return;
    setSaving(true);
    const res = await api.instructor.docUpdate({ id: editingDoc.id, content_html: html, ...meta });
    setSaving(false);
    if (!res.error) {
      setEditingDoc(prev => prev ? { ...prev, ...meta, content_html: html } : prev);
      // Обновляем список в фоне
      api.instructor.docsList(showAll).then(r => setDocs(r.docs || []));
    }
  };

  const handleExport = async () => {
    if (!editingDoc) return;
    setExporting(true);
    const res = await api.instructor.docExportDocx(editingDoc.id);
    setExporting(false);
    if (res.error) { showMsg(res.error, false); return; }
    // Скачиваем файл
    const bytes = Uint8Array.from(atob(res.docx_b64), c => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = res.filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleShare = async (doc: Doc) => {
    const res = await api.instructor.docUpdate({ id: doc.id, is_shared: !doc.is_shared });
    if (!res.error) {
      showMsg(doc.is_shared ? "Доступ закрыт" : "Документ доступен всем инструкторам");
      load();
    }
  };

  const doDelete = async (id: number) => {
    const res = await api.instructor.docDelete(id);
    setConfirmDeleteId(null);
    if (res.error) showMsg(res.error, false);
    else { showMsg("Удалён"); load(); }
  };

  const filtered = docs.filter(d => {
    const matchCat = filterCat === "Все" || d.category === filterCat;
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Разделяем мои и расшаренные
  const myDocs = filtered.filter(d => d.instructor_name === user.name || d.instructor_callsign === user.callsign);
  const sharedDocs = filtered.filter(d => d.is_shared && d.instructor_name !== user.name && d.instructor_callsign !== user.callsign);

  if (editingDoc) {
    const canEdit = user.is_admin || editingDoc.instructor_name === user.name || editingDoc.instructor_callsign === user.callsign;
    return (
      <DocEditor
        doc={editingDoc}
        onSave={handleSave}
        onClose={() => { setEditingDoc(null); load(); }}
        onExport={handleExport}
        onPrint={handlePrint}
        saving={saving || exporting}
        readOnly={!canEdit}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[160px]">
          <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск документов..."
            className="w-full bg-transparent pl-8 pr-3 py-1.5 font-mono text-xs text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>
        <button onClick={() => setShowAll(v => !v)}
          className="font-mono text-xs px-3 py-1.5 transition-all"
          style={{ border: `1px solid ${showAll ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)"}`, color: showAll ? "#00ff88" : "#5a7a95" }}>
          {showAll ? "Все + расшаренные" : "Только мои"}
        </button>
        <button onClick={createNew}
          className="flex items-center gap-2 px-4 py-1.5 font-mono text-xs transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          <Icon name="Plus" size={13} /> НОВЫЙ ДОКУМЕНТ
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {["Все", ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="font-mono text-xs px-3 py-1 transition-all"
            style={{ border: `1px solid ${filterCat === cat ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.1)"}`, color: filterCat === cat ? "#00ff88" : "#5a7a95", background: filterCat === cat ? "rgba(0,255,136,0.05)" : "transparent" }}>
            {cat}
          </button>
        ))}
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : (
        <>
          {/* Мои документы */}
          {myDocs.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-[#3a5570] tracking-widest">МОИ ДОКУМЕНТЫ</div>
              {myDocs.map((doc, i) => <DocCard key={doc.id} doc={doc} idx={i} onOpen={openDoc} onDelete={(id) => setConfirmDeleteId(id)} onShare={toggleShare} isOwn />)}
            </div>
          )}

          {myDocs.length === 0 && !showAll && (
            <div className="text-center py-16" style={{ border: "1px solid rgba(0,255,136,0.08)" }}>
              <Icon name="FileText" size={36} className="text-[#1a3050] mx-auto mb-3" />
              <div className="font-mono text-xs text-[#3a5570]">Документов нет</div>
              <div className="font-mono text-[10px] text-[#1a2840] mt-1">Нажмите «Новый документ» чтобы начать</div>
            </div>
          )}

          {/* Расшаренные */}
          {sharedDocs.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-[10px] text-[#a855f7] tracking-widest flex items-center gap-2">
                <Icon name="Share2" size={10} /> РАСШАРЕННЫЕ ДРУГИМИ ИНСТРУКТОРАМИ
              </div>
              {sharedDocs.map((doc, i) => <DocCard key={doc.id} doc={doc} idx={i} onOpen={openDoc} onDelete={() => {}} onShare={() => {}} isOwn={false} />)}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="Удалить документ"
        message="Вы уверены, что хотите удалить этот документ? Действие необратимо."
        confirmLabel="Удалить"
        danger
        onConfirm={() => confirmDeleteId !== null && doDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
