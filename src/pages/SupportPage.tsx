import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import { User } from "@/App";

interface Ticket {
  id: number;
  subject: string;
  status: "open" | "answered" | "closed";
  created_at: string;
  updated_at: string;
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

interface Broadcast {
  id: number;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  admin_callsign: string;
  admin_name: string;
}

interface Props { user: User; embedded?: boolean; }

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
        <img src={url} alt={name || "файл"} className="max-w-[260px] max-h-[200px] object-contain border border-[rgba(0,245,255,0.2)]" />
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

export default function SupportPage({ user, embedded }: Props) {
  const [view, setView] = useState<"list" | "ticket" | "new">("list");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [newSubject, setNewSubject] = useState("");
  const [newContent, setNewContent] = useState("");

  const [replyText, setReplyText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadAll = async () => {
    setLoading(true);
    const [tRes, bRes] = await Promise.all([api.support.ticketList(), api.support.broadcastList()]);
    if (tRes.tickets) setTickets(tRes.tickets);
    if (bRes.broadcasts) setBroadcasts(bRes.broadcasts);
    setLoading(false);
  };

  const openTicket = async (ticket: Ticket) => {
    setActiveTicket(ticket);
    setView("ticket");
    const res = await api.support.ticketMessages(ticket.id);
    if (res.messages) setMessages(res.messages);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newContent.trim() || sending) return;
    setSending(true);
    const res = await api.support.ticketCreate(newSubject.trim(), newContent.trim());
    setSending(false);
    if (res.error) { alert(res.error); return; }
    setNewSubject(""); setNewContent("");
    await loadAll();
    setView("list");
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeTicket || sending) return;
    setSending(true);
    const res = await api.support.ticketReply(activeTicket.id, replyText.trim());
    setSending(false);
    if (res.error) { alert(res.error); return; }
    setReplyText("");
    const mRes = await api.support.ticketMessages(activeTicket.id);
    if (mRes.messages) setMessages(mRes.messages);
    await loadAll();
  };

  const closeTicket = async () => {
    if (!activeTicket || !confirm("Закрыть обращение?")) return;
    await api.support.ticketClose(activeTicket.id);
    setActiveTicket(prev => prev ? { ...prev, status: "closed" } : prev);
    await loadAll();
  };

  return (
    <div className={embedded ? "px-4 py-4" : "max-w-4xl mx-auto px-4 py-6"}>
      {!embedded && (
        <div className="flex items-center gap-4 mb-6">
          <div className="w-8 h-px bg-[#00f5ff]" />
          <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ПОДДЕРЖКА</span>
        </div>
      )}

      {/* ── НОВОЕ ОБРАЩЕНИЕ ── */}
      {view === "new" && (
        <div style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(4,7,14,0.97)" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
            <span className="font-mono text-xs text-[#00f5ff] tracking-widest">НОВОЕ ОБРАЩЕНИЕ</span>
            <button onClick={() => setView("list")} className="text-[#3a5570] hover:text-white transition-colors">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1.5">ТЕМА</label>
              <input
                className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                style={{ borderColor: "rgba(0,245,255,0.2)" }}
                placeholder="Кратко опишите проблему..."
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                maxLength={255}
              />
            </div>
            <div>
              <label className="font-mono text-[10px] text-[#3a5570] tracking-wider block mb-1.5">ОПИСАНИЕ</label>
              <textarea
                className="w-full bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                style={{ borderColor: "rgba(0,245,255,0.2)" }}
                placeholder="Подробно опишите ситуацию..."
                rows={5}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={createTicket} disabled={sending || !newSubject.trim() || !newContent.trim()}
                className="flex items-center gap-2 px-5 py-2 font-mono text-xs transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                <Icon name="Send" size={13} />
                {sending ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
              </button>
              <button onClick={() => setView("list")}
                className="px-5 py-2 font-mono text-xs text-[#3a5570] hover:text-white transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── СПИСОК ТИКЕТОВ + РАССЫЛКИ ── */}
      {view === "list" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#3a5570]">Ваши обращения</span>
            <button onClick={() => setView("new")}
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-colors"
              style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
              <Icon name="Plus" size={13} />
              НОВОЕ ОБРАЩЕНИЕ
            </button>
          </div>

          {loading ? (
            <div className="font-mono text-xs text-[#3a5570] text-center py-8">загрузка...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              <Icon name="MessageCircleQuestion" size={32} className="text-[#1a2a3a] mx-auto mb-3" />
              <div className="font-mono text-sm text-[#3a5570]">Обращений нет</div>
              <div className="font-mono text-xs text-[#2a4060] mt-1">Если возникли вопросы — напишите нам</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tickets.map(t => {
                const st = STATUS_LABEL[t.status] || STATUS_LABEL.open;
                return (
                  <button key={t.id} onClick={() => openTicket(t)}
                    className="w-full text-left px-4 py-3 transition-colors"
                    style={{ border: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.8)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.04)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(4,7,14,0.8)"; }}>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-sm text-white truncate">{t.subject}</span>
                      <span className="font-mono text-[10px] flex-shrink-0 px-2 py-0.5" style={{ border: `1px solid ${st.color}40`, color: st.color }}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-plex text-xs text-[#5a7a95] truncate flex-1">{t.last_message || "нет сообщений"}</span>
                      <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0">{formatDt(t.updated_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Рассылки от администрации */}
          {broadcasts.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-px bg-[#00ff88]" />
                <span className="font-mono text-[10px] text-[#00ff88] tracking-widest">ОБЪЯВЛЕНИЯ ОТ АДМИНИСТРАЦИИ</span>
              </div>
              <div className="flex flex-col gap-2">
                {broadcasts.map(b => (
                  <div key={b.id} className="px-4 py-3"
                    style={{ border: "1px solid rgba(0,255,136,0.15)", background: "rgba(0,255,136,0.03)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-[#00ff88]">{b.admin_callsign || b.admin_name}</span>
                      <span className="font-mono text-[9px] text-[#3a5570]">{formatDt(b.created_at)}</span>
                    </div>
                    {b.content && <p className="font-plex text-sm text-[#c0d8e8] leading-relaxed whitespace-pre-wrap">{b.content}</p>}
                    {b.file_url && <FileAttachment url={b.file_url} name={b.file_name} type={b.file_type} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ДИАЛОГ ТИКЕТА ── */}
      {view === "ticket" && activeTicket && (
        <div style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(4,7,14,0.97)" }}>
          <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
            <button onClick={() => { setView("list"); setActiveTicket(null); setMessages([]); }}
              className="text-[#3a5570] hover:text-white transition-colors flex-shrink-0">
              <Icon name="ArrowLeft" size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-white truncate">{activeTicket.subject}</div>
              <div className="font-mono text-[10px]" style={{ color: STATUS_LABEL[activeTicket.status]?.color || "#3a5570" }}>
                {STATUS_LABEL[activeTicket.status]?.label}
              </div>
            </div>
            {activeTicket.status !== "closed" && (
              <button onClick={closeTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] transition-colors flex-shrink-0"
                style={{ border: "1px solid rgba(255,107,0,0.3)", color: "#ff6b00" }}>
                <Icon name="X" size={11} />
                ЗАКРЫТЬ
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ maxHeight: embedded ? "35vh" : "calc(100vh - 380px)", minHeight: 160 }}>
            {messages.map(m => {
              const isMe = !m.is_admin;
              return (
                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="font-mono text-[9px] mb-1" style={{ color: m.is_admin ? "#00ff88" : "#3a5570" }}>
                    {m.is_admin ? `⚡ ${m.sender_callsign || m.sender_name}` : (m.sender_callsign || m.sender_name)}
                    {" · "}{formatDt(m.created_at)}
                  </div>
                  <div className="max-w-[80%] px-4 py-2.5"
                    style={{
                      background: m.is_admin ? "rgba(0,255,136,0.06)" : "rgba(0,245,255,0.06)",
                      border: `1px solid ${m.is_admin ? "rgba(0,255,136,0.2)" : "rgba(0,245,255,0.18)"}`,
                    }}>
                    {m.content && <p className="font-plex text-sm text-[#d0e8f5] leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                    {m.file_url && <FileAttachment url={m.file_url} name={m.file_name} type={m.file_type} />}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {activeTicket.status !== "closed" && (
            <div className="border-t p-4 flex gap-3" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
              <textarea
                className="flex-1 bg-transparent border font-mono text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                style={{ borderColor: "rgba(0,245,255,0.2)" }}
                placeholder="Ваш ответ..."
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              />
              <button onClick={sendReply} disabled={sending || !replyText.trim()}
                className="flex items-center justify-center w-10 h-10 flex-shrink-0 self-end transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                <Icon name="Send" size={15} />
              </button>
            </div>
          )}
          {activeTicket.status === "closed" && (
            <div className="px-5 py-3 border-t text-center font-mono text-xs text-[#3a5570]" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
              Обращение закрыто
            </div>
          )}
        </div>
      )}
    </div>
  );
}