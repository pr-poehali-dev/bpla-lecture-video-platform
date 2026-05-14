import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/App";
import Icon from "@/components/ui/icon";

interface SheetRow {
  user_id?: number;
  name: string;
  callsign?: string;
  grades: Record<string, string>;
  attendance: Record<string, string>;
  comment?: string;
}

interface Sheet {
  id: number;
  title: string;
  group_name: string;
  subject: string;
  notes: string;
  sheet_data: SheetRow[];
  created_at: string;
  updated_at: string;
  instructor_name: string;
  instructor_callsign: string;
  rows_count?: number;
}

const GRADE_OPTIONS = ["", "5", "4", "3", "2", "н/а", "зачёт", "незачёт"];
const ATTENDANCE_OPTIONS = ["", "П", "О", "Б"];
const ATTENDANCE_COLORS: Record<string, string> = { "П": "#00ff88", "О": "#ff2244", "Б": "#ff6b00" };
const GRADE_COLORS: Record<string, string> = { "5": "#00ff88", "4": "#00f5ff", "3": "#ff6b00", "2": "#ff2244", "зачёт": "#00ff88", "незачёт": "#ff2244" };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface Props { user: User; }

export default function InstructorSheetsTab({ user }: Props) {
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<Sheet | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", group_name: "", subject: "", notes: "" });
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [columns, setColumns] = useState<string[]>(["Тема 1"]);
  const [newColName, setNewColName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: number; name: string; callsign: string; rank: string }[]>([]);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const load = () => {
    setLoading(true);
    api.instructor.sheetsList(showAll)
      .then(res => { setSheets(res.sheets || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [showAll]);

  const openCreate = () => {
    setForm({ title: "", group_name: "", subject: "", notes: "" });
    setSheetRows([]);
    setColumns(["Тема 1"]);
    setEditing(null);
    setShowCreate(true);
  };

  const openEdit = async (sheet: Sheet) => {
    const res = await api.instructor.sheetGet(sheet.id);
    if (res.error) { showMsg(res.error, false); return; }
    const s: Sheet = res.sheet;
    setForm({ title: s.title, group_name: s.group_name, subject: s.subject, notes: s.notes });
    const data: SheetRow[] = s.sheet_data || [];
    setSheetRows(data);
    const allGradeKeys = new Set<string>();
    data.forEach(r => { Object.keys(r.grades || {}).forEach(k => allGradeKeys.add(k)); });
    setColumns(allGradeKeys.size > 0 ? Array.from(allGradeKeys) : ["Тема 1"]);
    setEditing(s);
    setShowCreate(true);
  };

  const addRow = () => {
    setSheetRows(p => [...p, { name: "", callsign: "", grades: {}, attendance: {}, comment: "" }]);
  };

  const addRowFromSearch = (u: { id: number; name: string; callsign: string; rank: string }) => {
    if (sheetRows.find(r => r.user_id === u.id)) return;
    setSheetRows(p => [...p, { user_id: u.id, name: u.name, callsign: u.callsign, grades: {}, attendance: {} }]);
    setUserSearch(""); setUserResults([]);
  };

  const searchUsers = async (q: string) => {
    setUserSearch(q);
    if (q.length < 2) { setUserResults([]); return; }
    const res = await api.instructor.searchUsers(q);
    setUserResults(res.users || []);
  };

  const addColumn = () => {
    const name = newColName.trim();
    if (!name || columns.includes(name)) return;
    setColumns(p => [...p, name]);
    setNewColName("");
  };

  const removeColumn = (col: string) => {
    setColumns(p => p.filter(c => c !== col));
    setSheetRows(p => p.map(r => {
      const g = { ...r.grades }; delete g[col];
      const a = { ...r.attendance }; delete a[col];
      return { ...r, grades: g, attendance: a };
    }));
  };

  const setGrade = (rowIdx: number, col: string, val: string) => {
    setSheetRows(p => p.map((r, i) => i === rowIdx ? { ...r, grades: { ...r.grades, [col]: val } } : r));
  };

  const setAttendance = (rowIdx: number, col: string, val: string) => {
    setSheetRows(p => p.map((r, i) => i === rowIdx ? { ...r, attendance: { ...r.attendance, [col]: val } } : r));
  };

  const removeRow = (idx: number) => {
    setSheetRows(p => p.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!form.title.trim()) { showMsg("Укажите название", false); return; }
    setSaving(true);
    const data = { ...form, sheet_data: sheetRows };
    const res = editing
      ? await api.instructor.sheetUpdate({ id: editing.id, ...data })
      : await api.instructor.sheetCreate(data);
    setSaving(false);
    if (res.error) { showMsg(res.error, false); return; }
    showMsg(res.message || "Сохранено");
    setShowCreate(false); setEditing(null);
    load();
  };

  const del = async (id: number) => {
    if (!confirm("Удалить ведомость?")) return;
    const res = await api.instructor.sheetDelete(id);
    if (res.error) showMsg(res.error, false);
    else { showMsg("Удалена"); load(); }
  };

  const toggleShare = async (sheet: Sheet) => {
    const res = await api.instructor.sheetShare(sheet.id, !sheet.is_shared);
    if (!res.error) { showMsg(sheet.is_shared ? "Доступ закрыт" : "Ведомость доступна всем инструкторам"); load(); }
    else showMsg(res.error, false);
  };

  const printSheet = async (sheet: Sheet) => {
    const res = await api.instructor.sheetGet(sheet.id);
    if (!res.sheet) return;
    const s: Sheet = res.sheet;
    const cols = s.sheet_data?.[0] ? Object.keys(s.sheet_data[0].grades || {}) : [];
    const rows = s.sheet_data || [];
    const html = `
      <html><head><meta charset="utf-8"><title>${s.title}</title>
      <style>
        body{font-family:Times New Roman,serif;font-size:12pt;color:#000;margin:20mm}
        h2{text-align:center;margin-bottom:4px}
        .meta{text-align:center;color:#555;font-size:10pt;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th,td{border:1px solid #333;padding:4px 8px;text-align:center;font-size:11pt}
        th{background:#f0f0f0;font-weight:bold}
        td:nth-child(2){text-align:left}
        .sign{margin-top:40px;display:flex;justify-content:space-between}
        @media print{body{margin:10mm}}
      </style></head><body>
      <h2>${s.title}</h2>
      <div class="meta">${[s.subject, s.group_name].filter(Boolean).join(" · ")}</div>
      <table>
        <tr><th>#</th><th>Позывной / Имя</th>
        ${cols.map(c => `<th>${c}<br/><small>Оц / Пос</small></th>`).join("")}
        <th>Комм.</th></tr>
        ${rows.map((r, i) => `<tr>
          <td>${i+1}</td>
          <td>${r.callsign ? `<b>${r.callsign}</b> ` : ""}${r.name}</td>
          ${cols.map(c => `<td>${r.grades?.[c] || ""}${r.attendance?.[c] ? ` / ${r.attendance[c]}` : ""}</td>`).join("")}
          <td>${r.comment || ""}</td>
        </tr>`).join("")}
      </table>
      <div class="sign">
        <div>Инструктор: ________________</div>
        <div>Дата: ________________</div>
      </div>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  const exportCSV = (sheet: Sheet) => {
    if (!sheet.sheet_data?.length) return;
    const cols = Object.keys(sheet.sheet_data[0]?.grades || {});
    const header = ["Позывной", "Имя", ...cols.map(c => `Оценка: ${c}`), ...cols.map(c => `Посещ: ${c}`), "Комментарий"];
    const rows = sheet.sheet_data.map(r => [
      r.callsign || "", r.name,
      ...cols.map(c => r.grades[c] || ""),
      ...cols.map(c => r.attendance[c] || ""),
      r.comment || "",
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${sheet.title}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {user.is_admin && (
          <button onClick={() => setShowAll(v => !v)}
            className="font-mono text-xs px-3 py-1.5 transition-all"
            style={{ border: `1px solid ${showAll ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.15)"}`, color: showAll ? "#00ff88" : "#5a7a95" }}>
            {showAll ? "Все инструкторы" : "Мои"}
          </button>
        )}
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-1.5 font-mono text-xs ml-auto"
          style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          <Icon name="Plus" size={13} /> СОЗДАТЬ ВЕДОМОСТЬ
        </button>
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      {/* Editor */}
      {showCreate && (
        <div className="space-y-4 animate-fade-in" style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.01)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,255,136,0.1)" }}>
            <span className="font-orbitron text-sm font-bold text-[#00ff88]">{editing ? "РЕДАКТИРОВАТЬ ВЕДОМОСТЬ" : "НОВАЯ ВЕДОМОСТЬ"}</span>
            <button onClick={() => setShowCreate(false)} className="text-[#3a5570] hover:text-white transition-colors"><Icon name="X" size={16} /></button>
          </div>

          <div className="px-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">НАЗВАНИЕ *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ведомость по теме..."
                  className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ГРУППА</label>
                <input value={form.group_name} onChange={e => setForm(p => ({ ...p, group_name: e.target.value }))} placeholder="Группа А-1"
                  className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ПРЕДМЕТ</label>
                <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Тактика"
                  className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1">ЗАМЕТКА</label>
                <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Примечание"
                  className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
                  style={{ border: "1px solid rgba(0,255,136,0.2)" }} />
              </div>
            </div>

            {/* Columns */}
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-2">КОЛОНКИ (ТЕМЫ/ЗАНЯТИЯ)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {columns.map(col => (
                  <div key={col} className="flex items-center gap-1 px-2 py-1 font-mono text-xs"
                    style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88" }}>
                    {col}
                    <button onClick={() => removeColumn(col)} className="ml-1 text-[#3a5570] hover:text-[#ff2244]"><Icon name="X" size={9} /></button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <input value={newColName} onChange={e => setNewColName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addColumn()}
                    placeholder="+ Добавить тему"
                    className="bg-transparent px-2 py-1 font-mono text-xs text-white outline-none"
                    style={{ border: "1px solid rgba(0,245,255,0.15)", minWidth: 120 }} />
                  <button onClick={addColumn} className="px-2 py-1 font-mono text-xs text-[#00f5ff]"
                    style={{ border: "1px solid rgba(0,245,255,0.2)" }}>
                    <Icon name="Plus" size={11} />
                  </button>
                </div>
              </div>
            </div>

            {/* Add student */}
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-2">ДОБАВИТЬ КУРСАНТА</label>
              <div className="relative">
                <input value={userSearch} onChange={e => searchUsers(e.target.value)}
                  placeholder="Поиск по позывному или имени..."
                  className="w-full bg-transparent px-3 py-2 font-mono text-xs text-white outline-none"
                  style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
                {userResults.length > 0 && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 overflow-hidden"
                    style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)", maxHeight: 200, overflowY: "auto" }}>
                    {userResults.map(u => (
                      <button key={u.id} onClick={() => addRowFromSearch(u)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                        <span className="font-mono text-xs text-[#00f5ff]">{u.callsign || u.name}</span>
                        {u.callsign && <span className="font-plex text-xs text-[#5a7a95]">{u.name}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={addRow} className="mt-2 flex items-center gap-1.5 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                <Icon name="Plus" size={11} /> Добавить строку вручную
              </button>
            </div>

            {/* Table */}
            {sheetRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(0,255,136,0.15)" }}>
                      <th className="font-mono text-[9px] text-[#3a5570] tracking-wider px-2 py-2 whitespace-nowrap">ПОЗЫВНОЙ</th>
                      <th className="font-mono text-[9px] text-[#3a5570] tracking-wider px-2 py-2 whitespace-nowrap">ИМЯ</th>
                      {columns.map(col => (
                        <th key={col} className="font-mono text-[9px] text-[#3a5570] tracking-wider px-2 py-2 whitespace-nowrap text-center" style={{ minWidth: 80 }}>
                          <div>{col}</div>
                          <div className="font-mono text-[8px] text-[#2a4060] mt-0.5">Оц / Пос</div>
                        </th>
                      ))}
                      <th className="font-mono text-[9px] text-[#3a5570] px-2 py-2 whitespace-nowrap">КОММЕНТ</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "1px solid rgba(0,245,255,0.04)" }}>
                        <td className="px-2 py-1.5">
                          <input value={row.callsign || ""} onChange={e => setSheetRows(p => p.map((r,i)=>i===ri?{...r,callsign:e.target.value}:r))}
                            className="w-20 bg-transparent font-mono text-xs text-[#00f5ff] outline-none"
                            style={{ border: "none", borderBottom: "1px solid rgba(0,245,255,0.15)" }} placeholder="Позывной" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={row.name} onChange={e => setSheetRows(p => p.map((r,i)=>i===ri?{...r,name:e.target.value}:r))}
                            className="w-28 bg-transparent font-plex text-xs text-white outline-none"
                            style={{ border: "none", borderBottom: "1px solid rgba(0,245,255,0.15)" }} placeholder="Имя" />
                        </td>
                        {columns.map(col => (
                          <td key={col} className="px-2 py-1.5 text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <select value={row.grades[col] || ""} onChange={e => setGrade(ri, col, e.target.value)}
                                className="bg-transparent font-mono text-xs outline-none text-center"
                                style={{ border: "1px solid rgba(0,245,255,0.15)", color: GRADE_COLORS[row.grades[col]] || "#5a7a95", minWidth: 52, background: "#0a1520" }}>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g} style={{ background: "#050810" }}>{g || "—"}</option>)}
                              </select>
                              <select value={row.attendance[col] || ""} onChange={e => setAttendance(ri, col, e.target.value)}
                                className="bg-transparent font-mono text-xs outline-none text-center"
                                style={{ border: "1px solid rgba(0,245,255,0.1)", color: ATTENDANCE_COLORS[row.attendance[col]] || "#3a5570", minWidth: 52, background: "#0a1520" }}>
                                {ATTENDANCE_OPTIONS.map(a => <option key={a} value={a} style={{ background: "#050810" }}>{a || "—"}</option>)}
                              </select>
                            </div>
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <input value={row.comment || ""} onChange={e => setSheetRows(p => p.map((r,i)=>i===ri?{...r,comment:e.target.value}:r))}
                            className="w-28 bg-transparent font-mono text-xs text-[#5a7a95] outline-none"
                            style={{ border: "none", borderBottom: "1px solid rgba(0,245,255,0.1)" }} placeholder="—" />
                        </td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeRow(ri)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                            <Icon name="X" size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 font-mono text-xs disabled:opacity-50 transition-all"
              style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
              <Icon name={saving ? "Loader" : "Save"} size={12} className={saving ? "animate-spin" : ""} />
              {saving ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ"}
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 font-mono text-xs text-[#5a7a95] hover:text-white transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>ОТМЕНА</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
      ) : sheets.length === 0 ? (
        <div className="text-center py-16" style={{ border: "1px solid rgba(0,255,136,0.08)" }}>
          <Icon name="ClipboardList" size={36} className="text-[#1a3050] mx-auto mb-3" />
          <div className="font-mono text-xs text-[#3a5570]">Ведомостей нет</div>
        </div>
      ) : (
        <div className="space-y-2">
          {sheets.map((sheet, i) => (
            <div key={sheet.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 transition-all animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s`, background: "rgba(13,27,46,0.5)", border: "1px solid rgba(0,255,136,0.1)" }}>
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" }}>
                <Icon name="ClipboardList" size={16} className="text-[#00ff88]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-plex text-sm text-white">{sheet.title}</div>
                <div className="font-mono text-[10px] text-[#3a5570] flex flex-wrap gap-x-3">
                  {sheet.subject && <span>{sheet.subject}</span>}
                  {sheet.group_name && <span className="text-[#00f5ff]">{sheet.group_name}</span>}
                  <span>{sheet.rows_count ?? 0} курсантов</span>
                  <span>{fmtDate(sheet.updated_at)}</span>
                  {(showAll || user.is_admin) && <span className="text-[#a855f7]">{sheet.instructor_callsign || sheet.instructor_name}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => toggleShare(sheet)} title={sheet.is_shared ? "Закрыть доступ" : "Поделиться"}
                  className="w-8 h-8 flex items-center justify-center transition-colors"
                  style={{ color: sheet.is_shared ? "#a855f7" : "#3a5570" }}>
                  <Icon name="Share2" size={14} />
                </button>
                <button onClick={() => printSheet(sheet)} title="Печать ведомости"
                  className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                  <Icon name="Printer" size={14} />
                </button>
                <button onClick={() => exportCSV(sheet)} title="Экспорт CSV"
                  className="flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] text-[#00ff88] hover:text-white transition-colors"
                  style={{ border: "1px solid rgba(0,255,136,0.2)" }}>
                  <Icon name="Download" size={11} /> CSV
                </button>
                <button onClick={() => openEdit(sheet)}
                  className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                  <Icon name="Pencil" size={14} />
                </button>
                <button onClick={() => del(sheet.id)}
                  className="w-8 h-8 flex items-center justify-center text-[#3a5570] hover:text-[#ff2244] transition-colors">
                  <Icon name="Trash2" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}