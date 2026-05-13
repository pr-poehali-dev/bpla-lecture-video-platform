import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import ConfirmModal from "./ConfirmModal";

const REPLY_TEMPLATES = [
  { label: "Принято в работу", text: "Ваш запрос принят в работу. Мы рассмотрим его в ближайшее время." },
  { label: "Нужна информация", text: "Для решения вашего вопроса нам нужна дополнительная информация. Пожалуйста, уточните детали." },
  { label: "Проблема решена", text: "Ваш вопрос решён. Если проблема повторится — создайте новый тикет." },
  { label: "Свяжитесь позже", text: "Сейчас мы временно недоступны. Ответим в течение 24 часов." },
];

interface Ticket {
  id: number;
  subject: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  updated_at: string;
  user_callsign: string;
  user_name: string;
  message_count: number;
  last_message: string;
  last_message_at: string;
}

interface SupportMessage {
  id: number;
  sender_id: number;
  is_admin: boolean;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  sender_callsign: string;
  sender_name: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open:     { label: "Открыт",  color: "#00f5ff" },
  answered: { label: "Ответ",   color: "#00ff88" },
  closed:   { label: "Закрыт",  color: "#3a5570" },
};

function formatDt(s: string) {
  const d = new Date(s);
  return d.toLocaleString("ru", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function FileAttachment({ url, name, type }: { url: string; name: string | null; type: string | null }) {
  const isImage = ["jpg","jpeg","png","gif","webp"].includes((type || "").toLowerCase());
  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block mt-2">
        <img src={url} alt={name || "файл"} className="max-w-[260px] max-h-[180px] object-contain border border-[rgba(0,245,255,0.2)]" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 mt-2 px-3 py-2 transition-colors"
      style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)", color: "#00f5ff" }}>
      <Icon name="Paperclip" size={13} />
      <span className="font-mono text-[11px] truncate">{name || "файл"}</span>
      <Icon name="Download" size={12} className="ml-auto flex-shrink-0" />
    </a>
  );
}

export default function AdminSupportTab() {
  const [subTab, setSubTab] = useState<"tickets" | "broadcast">("tickets");
  const [statusFilter, setStatusFilter] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState<SupportMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<{ data: string; name: string; ext: string } | null>(null);

  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastFile, setBroadcastFile] = useState<{ data: string; name: string; ext: string } | null>(null);
  const [broadcastSent, setBroadcastSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const broadcastFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTickets(); }, [statusFilter]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    const res = await api.support.adminTickets(statusFilter);
    if (res.tickets) setTickets(res.tickets);
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setReplyText(""); setReplyFile(null);
    const res = await api.support.adminTicketMessages(ticket.id);
    if (res.messages) setMessages(res.messages);
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: { data: string; name: string; ext: string } | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const reader = new FileReader();
    reader.onload = ev => {
      setter({ data: ev.target?.result as string, name: file.name, ext });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const sendReply = async () => {
    if ((!replyText.trim() && !replyFile) || !activeTicket || sending) return;
    setSending(true);
    const res = await api.support.adminReply(activeTicket.id, replyText.trim(), replyFile?.data, replyFile?.name, replyFile?.ext);
    setSending(false);
    if (res.error) { alert(res.error); return; }
    setReplyText(""); setReplyFile(null);
    const mRes = await api.support.adminTicketMessages(activeTicket.id);
    if (mRes.messages) setMessages(mRes.messages);
    setActiveTicket(prev => prev ? { ...prev, status: "answered" } : prev);
    await loadTickets();
  };

  const closeTicket = async () => {
    if (!activeTicket) return;
    await api.support.adminClose(activeTicket.id);
    setActiveTicket(prev => prev ? { ...prev, status: "closed" } : prev);
    setShowCloseConfirm(false);
    await loadTickets();
  };

  const sendBroadcast = async () => {
    if ((!broadcastText.trim() && !broadcastFile) || sending) return;
    setSending(true);
    const res = await api.support.adminBroadcast(broadcastText.trim(), broadcastFile?.data, broadcastFile?.name, broadcastFile?.ext);
    setSending(false);
    setShowBroadcastConfirm(false);
    if (res.error) { return; }
    setBroadcastText(""); setBroadcastFile(null); setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 4000);
    loadBroadcastHistory();
  };

  const loadBroadcastHistory = async () => {
    setHistoryLoading(true);
    const res = await api.support.broadcastList();
    setBroadcastHistory(res.messages || []);
    setHistoryLoading(false);
  };

  return (
    <div className="flex flex-col gap-0" style={{ minHeight: 500 }}>
      {/* Sub-tabs */}
      <div className="flex border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
        {(["tickets", "broadcast"] as const).map(st => (
          <button key={st} onClick={() => { setSubTab(st); if (st === "broadcast") loadBroadcastHistory(); }}
            className={`px-5 py-3 font-mono text-xs tracking-wider transition-colors ${subTab === st ? "text-[#00f5ff] border-b border-[#00f5ff]" : "text-[#3a5570] hover:text-white"}`}>
            {st === "tickets" ? `ТИКЕТЫ${tickets.filter(t => t.status === "open").length > 0 ? ` (${tickets.filter(t => t.status === "open").length})` : ""}` : "РАССЫЛКА"}
          </button>
        ))}
      </div>

      {/* ── ТИКЕТЫ ── */}
      {subTab === "tickets" && (
        <div className="flex" style={{ height: 600 }}>
          {/* List */}
          <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 340, borderRight: "1px solid rgba(0,245,255,0.1)" }}>
            <div className="flex gap-1 p-2 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
              {["", "open", "answered", "closed"].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setActiveTicket(null); }}
                  className="flex-1 py-1 font-mono text-[9px] tracking-wider transition-colors"
                  style={{
                    border: statusFilter === s ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(0,245,255,0.1)",
                    color: statusFilter === s ? "#00f5ff" : "#3a5570",
                    background: statusFilter === s ? "rgba(0,245,255,0.06)" : "transparent",
                  }}>
                  {s === "" ? "ВСЕ" : s === "open" ? "ОТКР" : s === "answered" ? "ОТВЕЧ" : "ЗАКР"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 font-mono text-xs text-[#3a5570] text-center">загрузка...</div>
              ) : tickets.length === 0 ? (
                <div className="p-6 font-mono text-xs text-[#2a4060] text-center">Тикетов нет</div>
              ) : tickets.map(ticket => {
                const st = STATUS_LABEL[ticket.status] || STATUS_LABEL.open;
                const isActive = activeTicket?.id === ticket.id;
                return (
                  <button key={ticket.id} onClick={() => openTicket(ticket)}
                    className="w-full text-left px-3 py-2.5 border-b transition-colors"
                    style={{
                      borderColor: "rgba(0,245,255,0.06)",
                      background: isActive ? "rgba(0,245,255,0.07)" : "transparent",
                      borderLeft: isActive ? "2px solid #00f5ff" : "2px solid transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.03)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-mono text-[11px] text-[#00f5ff] truncate">{ticket.user_callsign || ticket.user_name}</span>
                      <span className="font-mono text-[9px] flex-shrink-0 px-1.5 py-0.5" style={{ border: `1px solid ${st.color}40`, color: st.color }}>{st.label}</span>
                    </div>
                    <div className="font-mono text-[11px] text-white truncate">{ticket.subject}</div>
                    <div className="font-plex text-[10px] text-[#5a7a95] truncate mt-0.5">{ticket.last_message || "нет сообщений"}</div>
                    <div className="font-mono text-[9px] text-[#2a4060] mt-0.5">{formatDt(ticket.updated_at)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeTicket ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Icon name="MessageCircle" size={28} className="text-[#1a2a3a] mx-auto mb-2" />
                  <div className="font-mono text-xs text-[#2a4060]">Выберите тикет</div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-white truncate">{activeTicket.subject}</div>
                    <div className="font-mono text-[10px] text-[#00f5ff]">{activeTicket.user_callsign || activeTicket.user_name}</div>
                  </div>
                  {activeTicket.status !== "closed" && (
                    <button onClick={() => setShowCloseConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] transition-colors flex-shrink-0"
                      style={{ border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>
                      <Icon name="X" size={11} />ЗАКРЫТЬ
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {messages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.is_admin ? "items-end" : "items-start"}`}>
                      <div className="font-mono text-[9px] mb-1" style={{ color: m.is_admin ? "#00ff88" : "#00f5ff" }}>
                        {m.is_admin ? `⚡ ${m.sender_callsign}` : m.sender_callsign}
                        {" · "}{formatDt(m.created_at)}
                      </div>
                      <div className="max-w-[80%] px-3 py-2"
                        style={{
                          background: m.is_admin ? "rgba(0,255,136,0.06)" : "rgba(0,245,255,0.06)",
                          border: `1px solid ${m.is_admin ? "rgba(0,255,136,0.2)" : "rgba(0,245,255,0.18)"}`,
                        }}>
                        {m.content && <p className="font-plex text-sm text-[#d0e8f5] leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                        {m.file_url && <FileAttachment url={m.file_url} name={m.file_name} type={m.file_type} />}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {activeTicket.status !== "closed" && (
                  <div className="border-t flex-shrink-0" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                    {/* Templates */}
                    <div className="px-3 pt-2 pb-1 flex items-center gap-2 flex-wrap">
                      <button onClick={() => setShowTemplates(v => !v)}
                        className="flex items-center gap-1 font-mono text-[9px] text-[#3a5570] hover:text-[#00f5ff] transition-colors">
                        <Icon name="Sparkles" size={10} />ШАБЛОНЫ
                      </button>
                      {showTemplates && REPLY_TEMPLATES.map(t => (
                        <button key={t.label} onClick={() => { setReplyText(t.text); setShowTemplates(false); }}
                          className="font-mono text-[9px] px-2 py-0.5 transition-colors"
                          style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#5a7a95" }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-3">
                      {replyFile && (
                        <div className="flex items-center gap-2 mb-2 px-2 py-1.5"
                          style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)" }}>
                          <Icon name="Paperclip" size={12} className="text-[#00f5ff]" />
                          <span className="font-mono text-[10px] text-white flex-1 truncate">{replyFile.name}</span>
                          <button onClick={() => setReplyFile(null)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                            <Icon name="X" size={12} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <textarea
                          className="flex-1 bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                          style={{ borderColor: "rgba(0,245,255,0.2)" }}
                          placeholder="Ответ пользователю..."
                          rows={2}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                        />
                        <div className="flex flex-col gap-1.5">
                          <input ref={replyFileRef} type="file" className="hidden" onChange={e => pickFile(e, setReplyFile)} />
                          <button onClick={() => replyFileRef.current?.click()}
                            className="flex items-center justify-center w-9 h-9 transition-colors"
                            style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#3a5570" }}
                            title="Прикрепить файл">
                            <Icon name="Paperclip" size={14} />
                          </button>
                          <button onClick={sendReply} disabled={sending || (!replyText.trim() && !replyFile)}
                            className="flex items-center justify-center w-9 h-9 transition-colors disabled:opacity-40"
                            style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                            <Icon name="Send" size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── РАССЫЛКА ── */}
      {subTab === "broadcast" && (
        <div className="p-6 space-y-6 max-w-2xl">
          <div className="space-y-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520", padding: 20 }}>
            <div className="font-mono text-xs text-[#00f5ff] tracking-widest">НОВАЯ РАССЫЛКА</div>
            <textarea
              className="w-full bg-transparent border font-mono text-sm text-white px-4 py-3 outline-none focus:border-[#00f5ff] transition-colors resize-none"
              style={{ borderColor: "rgba(0,245,255,0.2)" }}
              placeholder="Текст объявления для всех пользователей..."
              rows={4}
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
            />
            <div>
              <input ref={broadcastFileRef} type="file" className="hidden" onChange={e => pickFile(e, setBroadcastFile)} />
              {broadcastFile ? (
                <div className="flex items-center gap-3 px-3 py-2.5"
                  style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)" }}>
                  <Icon name="Paperclip" size={14} className="text-[#00f5ff]" />
                  <span className="font-mono text-xs text-white flex-1 truncate">{broadcastFile.name}</span>
                  <button onClick={() => setBroadcastFile(null)} className="text-[#3a5570] hover:text-[#ff2244] transition-colors">
                    <Icon name="X" size={14} />
                  </button>
                </div>
              ) : (
                <button onClick={() => broadcastFileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors"
                  style={{ border: "1px solid rgba(0,245,255,0.15)" }}>
                  <Icon name="Paperclip" size={13} />ПРИКРЕПИТЬ ФАЙЛ
                </button>
              )}
            </div>
            {broadcastSent && (
              <div className="flex items-center gap-2 p-3 font-mono text-xs text-[#00ff88]"
                style={{ border: "1px solid rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.05)" }}>
                <Icon name="CheckCircle" size={14} />Рассылка отправлена всем пользователям
              </div>
            )}
            <button onClick={() => setShowBroadcastConfirm(true)} disabled={sending || (!broadcastText.trim() && !broadcastFile)}
              className="flex items-center gap-2 px-6 py-3 font-mono text-sm transition-colors disabled:opacity-40"
              style={{ border: "1px solid rgba(0,255,136,0.4)", color: "#00ff88", background: "rgba(0,255,136,0.04)" }}>
              <Icon name="Send" size={15} />РАЗОСЛАТЬ ВСЕМ
            </button>
          </div>

          {/* Broadcast history */}
          <div>
            <div className="font-mono text-xs text-[#5a7a95] tracking-widest mb-3">ИСТОРИЯ РАССЫЛОК</div>
            {historyLoading ? (
              <div className="font-mono text-xs text-[#3a5570] py-4">Загрузка...</div>
            ) : broadcastHistory.length === 0 ? (
              <div className="font-mono text-xs text-[#2a4060] py-4">Рассылок ещё не было</div>
            ) : (
              <div className="space-y-2">
                {broadcastHistory.map(m => (
                  <div key={m.id} className="p-3" style={{ border: "1px solid rgba(0,245,255,0.08)", background: "rgba(4,7,14,0.6)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-[#00ff88]">⚡ {m.sender_callsign || m.sender_name}</span>
                      <span className="font-mono text-[9px] text-[#3a5570]">{formatDt(m.created_at)}</span>
                    </div>
                    {m.content && <p className="font-plex text-sm text-[#9ab5cc]">{m.content}</p>}
                    {m.file_url && <FileAttachment url={m.file_url} name={m.file_name} type={m.file_type} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal open={showCloseConfirm} title="Закрыть тикет"
        message={`Закрыть тикет «${activeTicket?.subject}»? Пользователь не сможет отправлять новые сообщения.`}
        confirmLabel="Закрыть тикет" danger onConfirm={closeTicket} onCancel={() => setShowCloseConfirm(false)} />

      <ConfirmModal open={showBroadcastConfirm} title="Отправить рассылку"
        message="Сообщение будет доставлено всем пользователям платформы. Продолжить?"
        confirmLabel="Разослать" onConfirm={sendBroadcast} onCancel={() => setShowBroadcastConfirm(false)} />
    </div>
  );
}