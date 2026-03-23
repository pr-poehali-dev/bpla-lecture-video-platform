import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import Avatar from "@/components/Avatar";
import { api } from "@/api";
import { User } from "@/App";

interface ChatWidgetProps { user: User; }

interface Chat {
  id: number; type: "direct" | "group"; name?: string;
  last_message?: string; unread_count: number;
  partner?: { id: number; name: string; callsign: string };
}
export interface Message {
  id: number; sender_id: number; sender_name: string;
  sender_callsign: string; content: string; created_at: string;
  image_url?: string | null; message_type?: string;
  sender_avatar_url?: string | null;
}

interface Contact {
  id: number;
  contact_id: number;
  name: string;
  callsign: string;
  avatar_url?: string | null;
  status: string;
  chat_id?: number | null;
}

export default function ChatWidget({ user }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chats" | "contacts">("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{id: number; name: string; callsign: string; rank?: string}[]>([]);
  const [searching, setSearching] = useState(false);

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

  const loadContacts = async () => {
    const res = await api.msg.contactsList();
    if (res.contacts) {
      setContacts(res.contacts.filter((c: Contact) => c.status === "accepted"));
      setContactsLoaded(true);
    }
  };

  useEffect(() => {
    if (tab === "contacts" && !contactsLoaded) loadContacts();
  }, [tab]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await api.msg.searchUsers(q);
    setSearchResults(res.users || []);
    setSearching(false);
  };

  const handleAddContact = async (targetId: number) => {
    await api.msg.contactRequest(targetId);
    setSearchQuery("");
    setSearchResults([]);
    loadContacts();
  };

  const openContactChat = async (contact: Contact) => {
    if (contact.chat_id) {
      const chat = chats.find(c => c.id === contact.chat_id);
      if (chat) { setTab("chats"); openChat(chat); return; }
    }
    const res = await api.msg.chatCreate("", [contact.contact_id]);
    if (res.chat_id) {
      await loadChats();
      setTab("chats");
      const res2 = await api.msg.chatsList();
      const newChat = (res2.chats || []).find((c: Chat) => c.id === res.chat_id);
      if (newChat) openChat(newChat);
    }
  };

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

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"))?.getAsFile();
    if (file) { e.preventDefault(); sendImage(file); }
  };

  const getChatTitle = (chat: Chat) =>
    chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><Icon name="X" size={24} /></button>
        </div>
      )}

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
          <div className="flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.15)", background: "rgba(0,245,255,0.04)" }}>
            <div className="flex items-center gap-2 px-4 py-3">
              {activeChat ? (
                <>
                  <button onClick={() => setActiveChat(null)} className="text-[#5a7a95] hover:text-[#00f5ff] transition-colors mr-1">
                    <Icon name="ChevronLeft" size={15} />
                  </button>
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>
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
            {/* Tabs — только когда нет открытого чата */}
            {!activeChat && (
              <div className="flex border-t" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                {([
                  { key: "chats", label: "ЧАТЫ", icon: "MessageSquare" },
                  { key: "contacts", label: "КОНТАКТЫ", icon: "Users" },
                ] as const).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 font-mono text-[10px] transition-all"
                    style={{
                      color: tab === t.key ? "#00f5ff" : "#3a5570",
                      borderBottom: tab === t.key ? "1px solid #00f5ff" : "1px solid transparent",
                      background: tab === t.key ? "rgba(0,245,255,0.04)" : "transparent",
                    }}
                  >
                    <Icon name={t.icon as "MessageSquare"} size={11} />
                    {t.label}
                    {t.key === "chats" && totalUnread > 0 && (
                      <span className="px-1 rounded-full text-[9px] font-bold" style={{ background: "#ff2244", color: "#fff" }}>{totalUnread}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contacts tab */}
          {!activeChat && tab === "contacts" && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Search */}
              <div className="p-3 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                <div className="relative">
                  <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
                  <input
                    className="w-full bg-[#0a1520] font-mono text-xs text-white pl-7 pr-3 py-2 outline-none"
                    style={{ border: "1px solid #1a2a3a" }}
                    placeholder="Найти бойца по позывному..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Search results */}
              {searchQuery && (
                <div className="border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                  {searching ? (
                    <div className="px-4 py-3 font-mono text-[10px] text-[#3a5570] animate-pulse">Поиск...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-3 font-mono text-[10px] text-[#3a5570]">Не найдено</div>
                  ) : searchResults.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.05)" }}>
                      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-orbitron text-[10px] text-[#00f5ff]" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                        {(u.callsign || u.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white truncate">{u.callsign || u.name}</div>
                        {u.rank && <div className="font-mono text-[10px] text-[#3a5570] truncate">{u.rank}</div>}
                      </div>
                      <button
                        onClick={() => handleAddContact(u.id)}
                        className="font-mono text-[10px] px-2 py-1 flex-shrink-0 transition-all"
                        style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
                      >
                        + ДОБАВИТЬ
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts list - search results отдельно */}
              <div className="flex-1 overflow-y-auto">
                {!contactsLoaded ? (
                  <div className="flex items-center justify-center h-24 font-mono text-[10px] text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
                ) : contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                    <Icon name="Users" size={24} className="text-[#2a4060]" />
                    <div className="font-mono text-xs text-[#3a5570]">Контактов нет</div>
                    <div className="font-mono text-[10px] text-[#2a4060]">Найдите бойцов через поиск</div>
                  </div>
                ) : contacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openContactChat(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(0,245,255,0.04)] transition-colors border-b"
                    style={{ borderColor: "rgba(0,245,255,0.06)" }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-orbitron text-xs text-[#00f5ff]" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                      {(c.callsign || c.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-white truncate">{c.callsign || c.name}</div>
                      <div className="font-mono text-[10px] text-[#3a5570]">нажмите чтобы написать</div>
                    </div>
                    <Icon name="MessageSquare" size={12} className="text-[#3a5570] flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chats list */}
          {!activeChat && tab === "chats" && (
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
                  <div className="font-mono text-xs text-[#3a5570]">Нет активных чатов</div>
                  <div className="font-mono text-[10px] text-[#2a4060]">Найдите бойцов во вкладке «Контакты»</div>
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
                    <div key={msg.id} className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      {!isMine && (
                        <Avatar callsign={msg.sender_callsign || msg.sender_name} avatarUrl={msg.sender_avatar_url} size={24} className="mt-1 flex-shrink-0" />
                      )}
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                        {!isMine && (
                          <span className="font-mono text-[9px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                        )}
                        {msg.message_type === "image" && msg.image_url ? (
                          <div className="cursor-pointer" onClick={() => setLightbox(msg.image_url!)}>
                            <img src={msg.image_url} className="max-w-[200px] max-h-[160px] object-cover rounded-sm border border-[rgba(0,245,255,0.2)]" />
                            {msg.content && msg.content !== "📷 Изображение" && (
                              <div className="font-plex text-[11px] text-[#8aacbf] px-1 mt-0.5">{msg.content}</div>
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-2 font-plex text-[12px] leading-relaxed"
                            style={{
                              background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${isMine ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                              color: isMine ? "#e0f8ff" : "#c0d4e0",
                            }}>
                            {msg.content}
                          </div>
                        )}
                        <span className="font-mono text-[9px] text-[#3a5570] px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex-shrink-0 border-t p-2 flex gap-2 items-end"
                style={{ borderColor: "rgba(0,245,255,0.12)" }}>
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
                  className="text-[#3a5570] hover:text-[#00f5ff] transition-colors flex-shrink-0 disabled:opacity-40"
                  title="Отправить изображение"
                >
                  <Icon name="Image" size={16} />
                </button>
                <input
                  className="flex-1 bg-transparent border-b font-plex text-[12px] text-white placeholder-[#3a5570] outline-none py-1"
                  style={{ borderColor: "rgba(0,245,255,0.2)" }}
                  placeholder="Сообщение..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  onPaste={handlePaste}
                  disabled={sending}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="text-[#00f5ff] hover:text-white disabled:text-[#2a4060] transition-colors flex-shrink-0"
                >
                  <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-12 h-12 flex items-center justify-center transition-all hover:scale-105"
        style={{
          background: open ? "rgba(0,245,255,0.15)" : "rgba(5,8,16,0.95)",
          border: `1px solid ${open ? "rgba(0,245,255,0.6)" : "rgba(0,245,255,0.3)"}`,
          boxShadow: open ? "0 0 20px rgba(0,245,255,0.3)" : "0 0 10px rgba(0,245,255,0.1)",
        }}
      >
        <Icon name={open ? "X" : "MessageSquare"} size={20} className="text-[#00f5ff]" />
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-black"
            style={{ background: "#00f5ff", boxShadow: "0 0 8px rgba(0,245,255,0.6)" }}>
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
}