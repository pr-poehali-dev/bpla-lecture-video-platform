import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import ConfirmModal from "@/components/admin/ConfirmModal";

interface Doc {
  id: number;
  title: string;
  category: string;
  group_name: string;
  subject: string;
  is_shared: boolean;
  content_html: string;
  created_at: string;
  updated_at: string;
  instructor_name: string;
  instructor_callsign: string;
  content_len?: number;
}

const CATEGORIES = ["Конспект", "Методичка", "Программа", "Нормативный документ", "Прочее"];
const MINE_OWNS = (user: User, doc: Doc) => doc.instructor_callsign === (user.callsign || "") || doc.instructor_name === user.name;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ── Редактор ──────────────────────────────────────────────────────────────────
interface EditorProps {
  doc: Doc;
  onSave: (html: string, meta: Partial<Doc>) => Promise<void>;
  onClose: () => void;
  onExport: () => void;
  onPrint: () => void;
  saving: boolean;
  readOnly: boolean;
}

function DocEditor({ doc, onSave, onClose, onExport, onPrint, saving, readOnly }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(doc.title);
  const [subject, setSubject] = useState(doc.subject);
  const [groupName, setGroupName] = useState(doc.group_name);
  const [category, setCategory] = useState(doc.category);
  const [dirty, setDirty] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content_html || "<p>Начните вводить текст...</p>";
    }
  }, [doc.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); triggerSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); onPrint(); }
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [title, subject, groupName, category]);

  const triggerSave = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onSave(html, { title, subject, group_name: groupName, category });
    setDirty(false);
  }, [title, subject, groupName, category, onSave]);

  const handleInput = () => {
    setDirty(true);
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(triggerSave, 3000);
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    setDirty(true);
  };

  const insertTable = () => {
    const rows = prompt("Строк:", "3");
    const cols = prompt("Колонок:", "4");
    if (!rows || !cols) return;
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0">';
    for (let r = 0; r < +rows; r++) {
      html += "<tr>";
      for (let c = 0; c < +cols; c++) {
        const style = 'style="border:1px solid #3a5570;padding:4px 8px;min-width:60px"';
        html += r === 0 ? `<th ${style}>&nbsp;</th>` : `<td ${style}>&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p></p>";
    document.execCommand("insertHTML", false, html);
    setDirty(true);
  };

  const toolbarButtons = [
    { cmd: "bold",          icon: "Bold",          title: "Жирный (Ctrl+B)" },
    { cmd: "italic",        icon: "Italic",        title: "Курсив (Ctrl+I)" },
    { cmd: "underline",     icon: "Underline",     title: "Подчёркнутый (Ctrl+U)" },
    { cmd: "strikeThrough", icon: "Strikethrough", title: "Зачёркнутый" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#050810" }}>
      {/* Topbar */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,255,136,0.15)", background: "#0a1520" }}>
        <button onClick={onClose} className="flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00ff88] transition-colors flex-shrink-0">
          <Icon name="ChevronLeft" size={14} /> Назад
        </button>
        <div className="w-px h-4 bg-[rgba(0,245,255,0.15)] mx-1" />
        <input value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }}
          readOnly={readOnly}
          className="flex-1 min-w-0 bg-transparent font-orbitron text-sm font-bold text-white outline-none"
          style={{ border: "none" }} placeholder="Название документа" />
        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          {dirty && !readOnly && <span className="font-mono text-[10px] text-[#ff6b00]">● не сохранено</span>}
          {!readOnly && (
            <button onClick={triggerSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs disabled:opacity-50 transition-all"
              style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
              <Icon name={saving ? "Loader" : "Save"} size={12} className={saving ? "animate-spin" : ""} />
              {saving ? "..." : "Сохранить"}
            </button>
          )}
          <button onClick={onPrint} title="Печать (Ctrl+P)"
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
            style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#00f5ff", background: "rgba(0,245,255,0.04)" }}>
            <Icon name="Printer" size={12} /> Печать
          </button>
          <button onClick={onExport} title="Скачать DOCX"
            className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-all"
            style={{ border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", background: "rgba(168,85,247,0.04)" }}>
            <Icon name="FileDown" size={12} /> DOCX
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)", background: "#070d18" }}>
        <select value={category} onChange={e => { setCategory(e.target.value); setDirty(true); }}
          disabled={readOnly}
          className="bg-transparent font-mono text-xs text-[#5a7a95] outline-none"
          style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#050810" }}>{c}</option>)}
        </select>
        <input value={subject} onChange={e => { setSubject(e.target.value); setDirty(true); }} readOnly={readOnly}
          placeholder="Предмет" className="bg-transparent font-mono text-xs text-[#5a7a95] outline-none px-2 py-1"
          style={{ border: "1px solid rgba(0,245,255,0.1)", width: 130 }} />
        <input value={groupName} onChange={e => { setGroupName(e.target.value); setDirty(true); }} readOnly={readOnly}
          placeholder="Группа" className="bg-transparent font-mono text-xs text-[#5a7a95] outline-none px-2 py-1"
          style={{ border: "1px solid rgba(0,245,255,0.1)", width: 100 }} />
      </div>

      {/* Formatting toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.06)", background: "#070d18" }}>
          {toolbarButtons.map(b => (
            <button key={b.cmd} onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }} title={b.title}
              className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
              <Icon name={b.icon as "Bold"} size={13} />
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(0,245,255,0.15)" }} />
          {[
            { label: "H1", cmd: () => execCmd("formatBlock", "<h2>"), title: "Заголовок 1" },
            { label: "H2", cmd: () => execCmd("formatBlock", "<h3>"), title: "Заголовок 2" },
            { label: "P",  cmd: () => execCmd("formatBlock", "<p>"),  title: "Параграф" },
          ].map(b => (
            <button key={b.label} onMouseDown={e => { e.preventDefault(); b.cmd(); }} title={b.title}
              className="px-2 h-7 flex items-center justify-center font-mono text-[10px] text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
              {b.label}
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(0,245,255,0.15)" }} />
          <button onMouseDown={e => { e.preventDefault(); execCmd("insertUnorderedList"); }} title="Список"
            className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
            <Icon name="List" size={13} />
          </button>
          <button onMouseDown={e => { e.preventDefault(); execCmd("insertOrderedList"); }} title="Нумерованный список"
            className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
            <Icon name="ListOrdered" size={13} />
          </button>
          <button onMouseDown={e => { e.preventDefault(); insertTable(); }} title="Таблица"
            className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
            <Icon name="Table" size={13} />
          </button>
          <div className="w-px h-5 mx-1" style={{ background: "rgba(0,245,255,0.15)" }} />
          {[
            { cmd: "justifyLeft",   icon: "AlignLeft",    title: "По левому краю" },
            { cmd: "justifyCenter", icon: "AlignCenter",  title: "По центру" },
            { cmd: "justifyRight",  icon: "AlignRight",   title: "По правому краю" },
          ].map(b => (
            <button key={b.cmd} onMouseDown={e => { e.preventDefault(); execCmd(b.cmd); }} title={b.title}
              className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
              <Icon name={b.icon as "AlignLeft"} size={13} />
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ background: "rgba(0,245,255,0.15)" }} />
          <button onMouseDown={e => { e.preventDefault(); execCmd("undo"); }} title="Отменить (Ctrl+Z)"
            className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
            <Icon name="Undo" size={13} />
          </button>
          <button onMouseDown={e => { e.preventDefault(); execCmd("redo"); }} title="Повторить (Ctrl+Y)"
            className="w-7 h-7 flex items-center justify-center text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.1)] transition-colors rounded">
            <Icon name="Redo" size={13} />
          </button>
          {readOnly && (
            <span className="ml-auto font-mono text-[10px] text-[#ff6b00] flex items-center gap-1">
              <Icon name="EyeOff" size={10} /> Только чтение (чужой документ)
            </span>
          )}
        </div>
      )}

      {/* Editor / content */}
      <div className="flex-1 overflow-auto" style={{ background: "#fff" }}>
        <div
          id="doc-print-area"
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          suppressContentEditableWarning
          style={{
            maxWidth: 840,
            margin: "0 auto",
            minHeight: "100%",
            padding: "40px 48px",
            fontFamily: "Times New Roman, serif",
            fontSize: 14,
            lineHeight: 1.8,
            color: "#111",
            outline: "none",
          }}
        />
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body > *:not(#print-root) { display: none !important; }
          #doc-print-area {
            display: block !important;
            max-width: 100% !important;
            padding: 0 !important;
            color: #000 !important;
            background: #fff !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Основной компонент ─────────────────────────────────────────────────────────
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

function DocCard({ doc, idx, onOpen, onDelete, onShare, isOwn }: {
  doc: Doc; idx: number;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onShare: (doc: Doc) => void;
  isOwn: boolean;
}) {
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