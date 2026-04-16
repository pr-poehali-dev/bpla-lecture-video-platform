import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";
import ChatCombinedList from "@/components/chat/ChatCombinedList";
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
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem("chat_muted") === "1");
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

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("chat_muted", next ? "1" : "0");
  };
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
    if (open && !contactsLoaded) loadContacts();
  }, [open]);

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
      if (chat) { openChat(chat); return; }
    }
    const res = await api.msg.directOpen(contact.contact_user_id);
    if (res.chat_id) {
      await loadChats();
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
      if (newTotal > prevUnreadRef.current && !muted) playNotify();
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
          className="flex flex-col overflow-hidden"
          style={{
            animation: "slideUpIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            width: expanded ? 420 : 340,
            height: expanded ? 640 : 480,
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
              {/* Mute */}
              <button
                onClick={toggleMute}
                title={muted ? "Включить звук" : "Выключить звук"}
                className="text-[#3a5570] hover:text-[#ffbe32] transition-colors"
              >
                <Icon name={muted ? "VolumeX" : "Volume2"} size={13} />
              </button>
              {/* Expand */}
              <button
                onClick={() => setExpanded(e => !e)}
                title={expanded ? "Уменьшить" : "Развернуть"}
                className="text-[#3a5570] hover:text-[#00f5ff] transition-colors"
              >
                <Icon name={expanded ? "Minimize2" : "Maximize2"} size={13} />
              </button>
              <button onClick={() => setOpen(false)} className="text-[#3a5570] hover:text-white transition-colors">
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>

          {/* Combined list */}
          {!activeChat && (
            <ChatCombinedList
              chats={chats}
              contacts={contacts}
              contactsLoaded={contactsLoaded}
              searchQuery={searchQuery}
              searchResults={searchResults}
              searching={searching}
              totalUnread={totalUnread}
              onOpenChat={openChat}
              getChatTitle={getChatTitle}
              onSearch={handleSearch}
              onAddContact={handleAddContact}
              onOpenContactChat={openContactChat}
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
        className="relative flex items-center transition-all hover:scale-105 active:scale-95"
        style={{
          borderRadius: open ? "50%" : totalUnread > 0 ? "28px" : "50%",
          width: open ? 48 : totalUnread > 0 ? "auto" : 48,
          height: 48,
          paddingLeft: open ? 0 : totalUnread > 0 ? 10 : 0,
          paddingRight: open ? 0 : totalUnread > 0 ? 14 : 0,
          gap: totalUnread > 0 && !open ? 8 : 0,
          justifyContent: "center",
          background: open ? "rgba(0,245,255,0.15)" : "rgba(5,8,16,0.95)",
          border: `1px solid ${open ? "rgba(0,245,255,0.6)" : "rgba(0,245,255,0.3)"}`,
          boxShadow: open
            ? "0 0 20px rgba(0,245,255,0.35)"
            : totalUnread > 0
              ? "0 0 14px rgba(0,245,255,0.25)"
              : "0 0 8px rgba(0,245,255,0.1)",
        }}
      >
        {/* Pulse ring при непрочитанных */}
        {!open && totalUnread > 0 && (
          <span className="absolute inset-0 animate-ping opacity-20"
            style={{ borderRadius: "inherit", background: "rgba(0,245,255,0.4)" }} />
        )}

        {open ? (
          <Icon name="X" size={20} className="text-[#00f5ff]" />
        ) : (
          <>
            {/* Аватар последнего чата или иконка */}
            {chats.length > 0 && chats[0].partner?.avatar_url ? (
              <img src={chats[0].partner.avatar_url}
                className="w-7 h-7 object-cover flex-shrink-0"
                style={{ borderRadius: "50%", border: "1px solid rgba(0,245,255,0.4)" }} />
            ) : (
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0"
                style={{ borderRadius: "50%", background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.3)" }}>
                <Icon name="MessageSquare" size={14} className={totalUnread > 0 ? "text-[#00f5ff]" : "text-[#5a9ab5]"} />
              </div>
            )}
            {/* Превью + счётчик */}
            {totalUnread > 0 && (
              <div className="flex flex-col items-start leading-tight">
                <span className="font-mono text-[10px] text-[#00f5ff] font-bold">{totalUnread} новых</span>
                {chats[0]?.last_message && (
                  <span className="font-mono text-[9px] text-[#3a5570] max-w-[100px] truncate">{chats[0].last_message}</span>
                )}
              </div>
            )}
          </>
        )}

        {/* Бейдж непрочитанных (когда свёрнут без текста) */}
        {!open && totalUnread === 0 && chats.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00ff88]"
            style={{ border: "1.5px solid rgba(5,8,16,1)" }} />
        )}
      </button>
    </div>
  );
}