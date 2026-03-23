import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";

interface ChatWidgetProps { user: User; }

interface Chat {
  id: number; type: "direct" | "group"; name?: string;
  last_message?: string; unread_count: number;
  partner?: { id: number; name: string; callsign: string };
}
interface Message {
  id: number; sender_id: number; sender_name: string;
  sender_callsign: string; content: string; created_at: string;
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playNotify = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) { void e; }
  };

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeChat.id), 4000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [activeChat]);

  const loadChats = async () => {
    const res = await api.msg.chatsList();
    if (res.chats) {
      setChats(res.chats);
      const newTotal = res.chats.reduce((s: number, c: Chat) => s + (c.unread_count || 0), 0);
      if (newTotal > prevUnreadRef.current) playNotify();
      prevUnreadRef.current = newTotal;
      setTotalUnread(newTotal);
    }
  };

  const loadMessages = async (chatId: number) => {
    const res = await api.msg.chatMessages(chatId);
    if (res.messages) setMessages(res.messages);
  };

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setMessages([]);
    await loadMessages(chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
    setTotalUnread(prev => Math.max(0, prev - (chat.unread_count || 0)));
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    const text = input.trim();
    const res = await api.msg.messageSend(activeChat.id, text);
    setSending(false);
    if (res.message) {
      setMessages(prev => [...prev, res.message]);
      setInput("");
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const getChatTitle = (chat: Chat) =>
    chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="flex flex-col overflow-hidden animate-fade-in"
          style={{
            width: 340, height: 480,
            background: "rgba(5,8,16,0.97)",
            border: "1px solid rgba(0,245,255,0.25)",
            boxShadow: "0 0 40px rgba(0,245,255,0.1), 0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: "rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.04)" }}>
            {activeChat ? (
              <>
                <button onClick={() => setActiveChat(null)} className="text-[#5a7a95] hover:text-[#00f5ff] transition-colors mr-1">
                  <Icon name="ChevronLeft" size={15} />
                </button>
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                  style={{ border: "1px solid rgba(0,245,255,0.3)" }}>
                  <Icon name={activeChat.type === "direct" ? "User" : "Users"} size={11} className="text-[#00f5ff]" />
                </div>
                <span className="font-orbitron text-xs text-white tracking-wider truncate flex-1">{getChatTitle(activeChat)}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
                <span className="font-orbitron text-xs text-[#00f5ff] tracking-wider flex-1">СВЯЗЬ</span>
              </>
            )}
            <button onClick={() => setOpen(false)} className="text-[#3a5570] hover:text-white transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>

          {/* Chats list */}
          {!activeChat && (
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
                  <div className="font-mono text-xs text-[#3a5570]">Нет активных чатов</div>
                  <div className="font-mono text-[10px] text-[#2a4060]">Добавьте контакты в разделе «Сообщения»</div>
                </div>
              ) : chats.map(chat => (
                <button key={chat.id} onClick={() => openChat(chat)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(0,245,255,0.04)] transition-colors border-b"
                  style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                    <Icon name={chat.type === "direct" ? "User" : "Users"} size={13} className="text-[#00f5ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-white truncate">{getChatTitle(chat)}</div>
                    <div className="font-plex text-[11px] text-[#5a7a95] truncate mt-0.5">{chat.last_message || "нет сообщений"}</div>
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-black flex-shrink-0"
                      style={{ background: "#00f5ff" }}>{chat.unread_count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          {activeChat && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center py-6 font-mono text-[11px] text-[#2a4060]">начните переписку</div>
                )}
                {messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                        {!isMine && (
                          <span className="font-mono text-[9px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                        )}
                        <div className="px-3 py-1.5 font-plex text-xs text-white" style={{
                          background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${isMine ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                          {msg.content}
                        </div>
                        <span className="font-mono text-[9px] text-[#2a4060] px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 p-3 border-t flex-shrink-0" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                <input
                  className="flex-1 bg-transparent border font-plex text-xs text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                  style={{ borderColor: "rgba(0,245,255,0.2)" }}
                  placeholder="Сообщение..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-8 h-8 flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ border: "1px solid rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.08)", color: "#00f5ff" }}>
                  <Icon name={sending ? "Loader" : "Send"} size={13} className={sending ? "animate-spin" : ""} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-12 h-12 flex items-center justify-center transition-all duration-200"
        style={{
          background: open ? "rgba(0,245,255,0.15)" : "rgba(5,8,16,0.95)",
          border: "1px solid rgba(0,245,255,0.4)",
          boxShadow: "0 0 20px rgba(0,245,255,0.2)",
          color: "#00f5ff",
        }}
      >
        <Icon name={open ? "X" : "MessageSquare"} size={20} />
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-black"
            style={{ background: "#00f5ff" }}>
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}