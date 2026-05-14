import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Doc, CATEGORIES } from "./DocTypes";

interface EditorProps {
  doc: Doc;
  onSave: (html: string, meta: Partial<Doc>) => Promise<void>;
  onClose: () => void;
  onExport: () => void;
  onPrint: () => void;
  saving: boolean;
  readOnly: boolean;
}

export default function DocEditor({ doc, onSave, onClose, onExport, onPrint, saving, readOnly }: EditorProps) {
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
