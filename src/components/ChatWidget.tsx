import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";
import ChatContactsTab from "@/components/chat/ChatContactsTab";
import ChatChatsTab from "@/components/chat/ChatChatsTab";
import ChatMessages from "@/components/chat/ChatMessages";

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
  sender_avatar_url?: string | null; hidden?: boolean;
  reply_to_id?: number | null; reply_content?: string | null; reply_callsign?: string | null;
  reactions?: Record<string, string[]>;
}

interface Contact {
  id: number;
  contact_id: number;
  contact_user_id: number;
  name: string;
  callsign: string;
  avatar_url?: string | null;
  status: string;
  chat_id?: number | null;
  last_seen?: string | null;
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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
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
    const interval = setInterval(loadChats, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeChat.id), 8000);

      if (typingPollRef.current) clearInterval(typingPollRef.current);
      typingPollRef.current = setInterval(() => {
        api.msg.typingGet(activeChat.id).then(r => setTypingUsers(r.typing || []));
      }, 3000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (typingPollRef.current) clearInterval(typingPollRef.current);
      };
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
    const res = await api.msg.messageSend(activeChat.id, text, replyTo?.id);
    setSending(false);
    if (res.message) {
      setMessages(prev => [...prev, res.message]);
      setInput("");
      setReplyTo(null);
    }
  };

  const handleRemoveMessage = async (msgId: number) => {
    const res = await api.msg.messageRemove(msgId);
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, hidden: true, content: "Сообщение удалено" } : m));
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    const res = await api.msg.messageReact(msgId, emoji);
    if (res.reactions) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: res.reactions } : m));
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
    if (e.key === "Escape" && replyTo) { setReplyTo(null); }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!activeChat) return;
    api.msg.typingSet(activeChat.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"))?.getAsFile();
    if (file) { e.preventDefault(); sendImage(file); }
  };

  const getChatTitle = (chat: Chat) =>
    chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");

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
            <ChatContactsTab
              contacts={contacts}
              contactsLoaded={contactsLoaded}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searching={searching}
              onSearch={handleSearch}
              onAddContact={handleAddContact}
              onOpenContactChat={openContactChat}
            />
          )}

          {/* Chats tab */}
          {!activeChat && tab === "chats" && (
            <ChatChatsTab
              chats={chats}
              onOpenChat={openChat}
              getChatTitle={getChatTitle}
            />
          )}

          {/* Messages */}
          {activeChat && (
            <ChatMessages
              messages={messages}
              userId={user.id}
              input={input}
              sending={sending}
              typingUsers={typingUsers}
              replyTo={replyTo}
              onInputChange={handleInputChange}
              onSend={sendMessage}
              onKey={handleKey}
              onPaste={handlePaste}
              onFileChange={handleFileChange}
              onLightbox={setLightbox}
              onRemove={handleRemoveMessage}
              onReact={handleReact}
              onReply={setReplyTo}
              onCancelReply={() => setReplyTo(null)}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center gap-2.5 px-4 h-11 transition-all hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: open ? "rgba(0,245,255,0.12)" : "rgba(5,8,16,0.97)",
          border: `1px solid ${open ? "rgba(0,245,255,0.55)" : "rgba(0,245,255,0.28)"}`,
          boxShadow: open
            ? "0 0 24px rgba(0,245,255,0.25), 0 4px 16px rgba(0,0,0,0.5)"
            : totalUnread > 0
              ? "0 0 16px rgba(0,245,255,0.2), 0 4px 16px rgba(0,0,0,0.5)"
              : "0 0 8px rgba(0,245,255,0.08), 0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        {/* Icon with optional pulse ring */}
        <div className="relative flex-shrink-0">
          {!open && totalUnread > 0 && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-40"
              style={{ background: "rgba(0,245,255,0.5)" }} />
          )}
          <Icon
            name={open ? "X" : "MessageSquare"}
            size={16}
            className={open ? "text-[#00f5ff]" : totalUnread > 0 ? "text-[#00f5ff]" : "text-[#5a9ab5]"}
          />
        </div>

        {/* Label */}
        {!open && (
          <span className="font-mono text-[11px] tracking-wider"
            style={{ color: totalUnread > 0 ? "#00f5ff" : "#5a9ab5" }}>
            {totalUnread > 0 ? "СООБЩЕНИЯ" : "ЧАТ"}
          </span>
        )}

        {/* Unread badge */}
        {!open && totalUnread > 0 && (
          <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-mono text-[9px] font-bold text-black"
            style={{ background: "#00f5ff", boxShadow: "0 0 6px rgba(0,245,255,0.7)" }}>
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}

        {open && (
          <span className="font-mono text-[11px] text-[#3a5570] tracking-wider">ЗАКРЫТЬ</span>
        )}
      </button>
    </div>
  );
}