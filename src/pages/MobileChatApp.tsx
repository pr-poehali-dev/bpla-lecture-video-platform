import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import LogoIcon from "@/components/LogoIcon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";

interface User {
  id: number; name: string; callsign?: string; email: string;
  rank?: string; is_admin: boolean; status: string; avatar_url?: string | null;
}
interface Chat {
  id: number; type: "direct" | "group"; name?: string;
  last_message?: string; unread_count: number;
  partner?: { id: number; name: string; callsign: string };
}
interface Message {
  id: number; sender_id: number; sender_name: string;
  sender_callsign: string; content: string; created_at: string;
  image_url?: string | null; message_type?: string;
  sender_avatar_url?: string | null;
}

export default function MobileChatApp() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [callsign, setCallsign] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [screen, setScreen] = useState<"chats" | "chat">("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollChatsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUnreadRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("drone_token");
    if (!token) { setChecking(false); return; }
    api.me().then(res => {
      if (res.user) setUser(res.user);
      else localStorage.removeItem("drone_token");
      setChecking(false);
    }).catch(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadChats();
    pollChatsRef.current = setInterval(loadChats, 20000);
    return () => { if (pollChatsRef.current) clearInterval(pollChatsRef.current); };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playNotify = () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { void e; }
  };

  const loadChats = async () => {
    const res = await api.msg.chatsList();
    if (res.chats) {
      setChats(res.chats);
      const total = res.chats.reduce((s: number, c: Chat) => s + (c.unread_count || 0), 0);
      if (total > prevUnreadRef.current) playNotify();
      prevUnreadRef.current = total;
      setTotalUnread(total);
    }
  };

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setScreen("chat");
    setMessages([]);
    const res = await api.msg.chatMessages(chat.id);
    if (res.messages) setMessages(res.messages);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
    setTotalUnread(prev => Math.max(0, prev - (chat.unread_count || 0)));
    if (pollMsgRef.current) clearInterval(pollMsgRef.current);
    pollMsgRef.current = setInterval(async () => {
      const r = await api.msg.chatMessages(chat.id);
      if (r.messages) setMessages(r.messages);
    }, 10000);
  };

  const backToChats = () => {
    setScreen("chats");
    setActiveChat(null);
    if (pollMsgRef.current) clearInterval(pollMsgRef.current);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    const res = await api.msg.messageSend(activeChat.id, text);
    setSending(false);
    if (res.message) setMessages(prev => [...prev, res.message]);
  };

  const sendImage = async (file: File) => {
    if (!activeChat || sending) return;
    setSending(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const res = await api.msg.imageSend(activeChat.id, dataUrl, ext);
      setSending(false);
      if (res.message) setMessages(prev => [...prev, res.message]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) sendImage(file);
    e.target.value = "";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(""); setLoggingIn(true);
    const res = await api.login({ callsign, password });
    setLoggingIn(false);
    if (res.token) {
      localStorage.setItem("drone_token", res.token);
      setUser(res.user);
    } else {
      setLoginError(res.error || "Неверные данные");
    }
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem("drone_token");
    setUser(null);
    setChats([]); setMessages([]);
  };

  const getChatTitle = (chat: Chat) =>
    chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");

  const formatTime = (dt: string) => new Date(dt).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (dt: string) => new Date(dt).toLocaleDateString("ru", { day: "numeric", month: "short" });

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((acc, msg) => {
    const d = formatDate(msg.created_at);
    const last = acc[acc.length - 1];
    if (last?.date === d) last.msgs.push(msg);
    else acc.push({ date: d, msgs: [msg] });
    return acc;
  }, []);

  const BG = "#050810";
  const CYAN = "#00f5ff";
  const BORDER = "rgba(0,245,255,0.18)";

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <div className="flex flex-col items-center gap-3">
          <LogoIcon size={32} className="text-[#00f5ff] animate-pulse" />
          <div className="font-mono text-xs text-[#3a5570] tracking-widest">ИНИЦИАЛИЗАЦИЯ...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: BG }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
              style={{ border: `1px solid ${CYAN}`, boxShadow: `0 0 24px rgba(0,245,255,0.2)` }}>
              <Icon name="Radio" size={28} className="text-[#00f5ff]" />
            </div>
            <div className="font-orbitron text-lg text-white tracking-widest">БПЛА СВЯЗЬ</div>
            <div className="font-mono text-xs text-[#3a5570] mt-1">защищённый мессенджер</div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <div className="font-mono text-[10px] text-[#5a7a95] mb-1 tracking-widest">ПОЗЫВНОЙ</div>
              <input
                className="w-full bg-transparent border font-mono text-sm text-white placeholder-[#3a5570] outline-none px-3 py-3 rounded-none"
                style={{ borderColor: BORDER }}
                placeholder="позывной..."
                value={callsign}
                onChange={e => setCallsign(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div>
              <div className="font-mono text-[10px] text-[#5a7a95] mb-1 tracking-widest">ПАРОЛЬ</div>
              <input
                className="w-full bg-transparent border font-mono text-sm text-white placeholder-[#3a5570] outline-none px-3 py-3 rounded-none"
                style={{ borderColor: BORDER }}
                type="password"
                placeholder="пароль..."
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {loginError && <div className="font-mono text-xs text-red-400">{loginError}</div>}
            <button
              type="submit"
              disabled={loggingIn || !callsign || !password}
              className="py-3 font-orbitron text-sm tracking-widest disabled:opacity-40 transition-all"
              style={{ background: `rgba(0,245,255,0.1)`, border: `1px solid ${CYAN}`, color: CYAN }}
            >
              {loggingIn ? "ВХОД..." : "ВОЙТИ"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="font-mono text-xs text-[#3a5570] hover:text-[#00f5ff] transition-colors">
              ← Вернуться на сайт
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden" style={{ background: BG }}>
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[95vw] max-h-[90vh] object-contain" />
          <button className="absolute top-4 right-4 p-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            <Icon name="X" size={24} />
          </button>
        </div>
      )}

      {/* ===== CHATS SCREEN ===== */}
      {screen === "chats" && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: BORDER, background: "rgba(0,245,255,0.03)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00f5ff] animate-pulse" />
              <span className="font-orbitron text-sm text-[#00f5ff] tracking-widest">СВЯЗЬ</span>
              {totalUnread > 0 && (
                <span className="font-mono text-[10px] text-black px-1.5 py-0.5 rounded-full"
                  style={{ background: CYAN }}>{totalUnread}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[#5a7a95]">{user.callsign || user.name}</span>
              <button onClick={handleLogout} className="text-[#3a5570] hover:text-white transition-colors">
                <Icon name="LogOut" size={16} />
              </button>
            </div>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                <Icon name="MessageSquare" size={40} className="text-[#1a2a40]" />
                <div className="font-mono text-sm text-[#3a5570]">Нет активных чатов</div>
                <div className="font-mono text-xs text-[#2a4060]">Добавьте контакты на сайте в разделе «Сообщения»</div>
                <a href="/" className="font-mono text-xs underline" style={{ color: CYAN }}>Перейти на сайт →</a>
              </div>
            ) : chats.map(chat => (
              <button key={chat.id} onClick={() => openChat(chat)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left border-b active:bg-[rgba(0,245,255,0.06)] transition-colors"
                style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                  style={{ border: `1px solid rgba(0,245,255,0.2)`, background: "rgba(0,245,255,0.05)" }}>
                  <Icon name={chat.type === "direct" ? "User" : "Users"} size={18} className="text-[#00f5ff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white truncate">{getChatTitle(chat)}</div>
                  <div className="font-plex text-xs text-[#5a7a95] truncate mt-0.5">{chat.last_message || "нет сообщений"}</div>
                </div>
                {chat.unread_count > 0 && (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] text-black flex-shrink-0"
                    style={{ background: CYAN }}>{chat.unread_count > 9 ? "9+" : chat.unread_count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="flex-shrink-0 border-t py-2 px-6 flex justify-center" style={{ borderColor: BORDER }}>
            <a href="/" className="font-mono text-[11px] text-[#3a5570] flex items-center gap-1.5">
              <Icon name="Globe" size={13} /> Полная версия сайта
            </a>
          </div>
        </>
      )}

      {/* ===== CHAT SCREEN ===== */}
      {screen === "chat" && activeChat && (
        <>
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: BORDER, background: "rgba(0,245,255,0.03)" }}>
            <button onClick={backToChats} className="text-[#5a7a95] active:text-white transition-colors p-1">
              <Icon name="ChevronLeft" size={22} />
            </button>
            <div className="w-9 h-9 flex items-center justify-center flex-shrink-0"
              style={{ border: `1px solid rgba(0,245,255,0.25)` }}>
              <Icon name={activeChat.type === "direct" ? "User" : "Users"} size={15} className="text-[#00f5ff]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-orbitron text-sm text-white tracking-wider truncate">{getChatTitle(activeChat)}</div>
              {activeChat.type === "direct" && activeChat.partner?.rank && (
                <div className="font-mono text-[10px] text-[#5a7a95] truncate">{activeChat.partner.rank}</div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="font-mono text-xs text-[#2a4060]">начните переписку</div>
              </div>
            )}
            {groupedMessages.map(group => (
              <div key={group.date}>
                <div className="text-center my-3">
                  <span className="font-mono text-[10px] text-[#3a5570] px-3 py-1"
                    style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.1)" }}>
                    {group.date}
                  </span>
                </div>
                {group.msgs.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex mb-2 gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && (
                        <Avatar callsign={msg.sender_callsign || msg.sender_name} avatarUrl={msg.sender_avatar_url} size={30} className="mt-1 flex-shrink-0" />
                      )}
                      <div className={`max-w-[72%] flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                        {!isMine && (
                          <span className="font-mono text-[10px] px-1" style={{ color: CYAN }}>
                            {msg.sender_callsign || msg.sender_name}
                          </span>
                        )}
                        {msg.message_type === "image" && msg.image_url ? (
                          <div onClick={() => setLightbox(msg.image_url!)} className="cursor-pointer">
                            <img
                              src={msg.image_url}
                              className="max-w-full rounded-sm object-cover"
                              style={{
                                maxHeight: 240,
                                border: `1px solid rgba(0,245,255,0.2)`,
                              }}
                            />
                            {msg.content && msg.content !== "📷 Изображение" && (
                              <div className="font-plex text-xs text-[#8aacbf] px-1 mt-1">{msg.content}</div>
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-2 font-plex text-sm leading-relaxed"
                            style={{
                              background: isMine ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.05)",
                              border: `1px solid ${isMine ? "rgba(0,245,255,0.22)" : "rgba(255,255,255,0.07)"}`,
                              color: isMine ? "#e0f8ff" : "#c0d4e0",
                              wordBreak: "break-word",
                            }}>
                            {msg.content}
                          </div>
                        )}
                        <span className="font-mono text-[9px] text-[#3a5570] px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 border-t px-3 py-2 flex items-end gap-2"
            style={{ borderColor: BORDER, background: "rgba(0,0,0,0.4)", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex-shrink-0 p-2 disabled:opacity-40"
              style={{ color: "rgba(0,245,255,0.6)" }}
            >
              <Icon name="Image" size={22} />
            </button>
            <textarea
              className="flex-1 bg-transparent border font-plex text-sm text-white placeholder-[#3a5570] outline-none px-3 py-2 resize-none"
              style={{ borderColor: "rgba(0,245,255,0.2)", minHeight: 40, maxHeight: 120 }}
              placeholder="Сообщение..."
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 768) {
                  e.preventDefault(); sendMessage();
                }
              }}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 p-2 disabled:opacity-30 transition-all"
              style={{ color: CYAN }}
            >
              <Icon name={sending ? "Loader" : "Send"} size={22} className={sending ? "animate-spin" : ""} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}