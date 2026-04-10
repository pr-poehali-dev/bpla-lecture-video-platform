import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import { User } from "@/App";

interface MessagesPageProps { user: User; }

interface Contact {
  id: number; status: string; requester_id: number; target_id: number;
  contact_user_id: number; name: string; callsign: string; rank?: string; created_at: string;
}
interface Chat {
  id: number; type: "direct" | "group"; name?: string;
  last_message?: string; last_message_at?: string; unread_count: number;
  partner?: { id: number; name: string; callsign: string; rank?: string; last_seen?: string; avatar_url?: string };
  members_count?: number;
}
interface Message {
  id: number; chat_id: number; sender_id: number;
  sender_name: string; sender_callsign: string; content: string; created_at: string;
  image_url?: string | null; message_type?: string; hidden?: boolean;
  reply_to_id?: number | null; reply_content?: string | null; reply_callsign?: string | null;
  reactions?: Record<string, string[]>;
}
interface FoundUser { id: number; name: string; callsign: string; rank?: string; }

type Tab = "chats" | "contacts";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "👎", "🔥"];

export default function MessagesPage({ user }: MessagesPageProps) {
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Reply
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Typing
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search
  const [msgSearch, setMsgSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Chat actions
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newChatName, setNewChatName] = useState("");

  // Hover message for actions
  const [hoveredMsg, setHoveredMsg] = useState<number | null>(null);
  const [showReactPicker, setShowReactPicker] = useState<number | null>(null);

  // Contacts search
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Create group
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<FoundUser[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<FoundUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const typingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAll(); }, []);

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

  const loadAll = async () => {
    setLoading(true);
    const [chatsRes, contactsRes] = await Promise.all([api.msg.chatsList(), api.msg.contactsList()]);
    if (chatsRes.chats) setChats(chatsRes.chats);
    if (contactsRes.contacts) setContacts(contactsRes.contacts);
    setLoading(false);
  };

  const loadMessages = async (chatId: number) => {
    const res = await api.msg.chatMessages(chatId);
    if (res.messages) setMessages(res.messages);
  };

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setMessages([]);
    setReplyTo(null);
    setShowSearch(false);
    setMsgSearch("");
    setShowChatMenu(false);
    await loadMessages(chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
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
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c));
    }
  };

  const sendImage = async (file: File) => {
    if (!activeChat || sending) return;
    setSending(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const res = await api.msg.imageSend(activeChat.id, dataUrl, ext, undefined, replyTo?.id);
      setSending(false);
      if (res.message) {
        setMessages(prev => [...prev, res.message]);
        setReplyTo(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    if (e.key === "Escape" && replyTo) { setReplyTo(null); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!activeChat) return;
    api.msg.typingSet(activeChat.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"))?.getAsFile();
    if (file) { e.preventDefault(); sendImage(file); }
  };

  const handleRemoveMessage = async (msgId: number) => {
    const res = await api.msg.messageRemove(msgId);
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, hidden: true, content: "Сообщение удалено" } : m));
    }
  };

  const handleReact = async (msgId: number, emoji: string) => {
    setShowReactPicker(null);
    const res = await api.msg.messageReact(msgId, emoji);
    if (res.reactions) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: res.reactions } : m));
    }
  };

  const handleLeaveChat = async () => {
    if (!activeChat || !confirm("Выйти из чата?")) return;
    await api.msg.chatLeave(activeChat.id);
    setActiveChat(null);
    setMessages([]);
    setChats(prev => prev.filter(c => c.id !== activeChat.id));
    setShowChatMenu(false);
  };

  const handleClearChat = async () => {
    if (!activeChat || !confirm("Очистить историю?")) return;
    await api.msg.chatClear(activeChat.id);
    setMessages([]);
    setShowChatMenu(false);
  };

  const handleRenameChat = async () => {
    if (!activeChat || !newChatName.trim()) return;
    const res = await api.msg.chatRename(activeChat.id, newChatName.trim());
    if (res.message) {
      setActiveChat(prev => prev ? { ...prev, name: newChatName.trim() } : prev);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, name: newChatName.trim() } : c));
      setRenaming(false);
      setNewChatName("");
      setShowChatMenu(false);
    }
  };

  const doSearch = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const res = await api.msg.searchUsers(q);
    setSearching(false);
    setSearchResults(res.users || []);
  };

  const sendContactRequest = async (targetId: number) => {
    const res = await api.msg.contactRequest(targetId);
    if (!res.error) { setSearchQ(""); setSearchResults([]); await loadAll(); }
    else alert(res.error);
  };

  const respondContact = async (contactId: number, response: "accept" | "reject") => {
    await api.msg.contactRespond(contactId, response);
    await loadAll();
  };

  const doGroupSearch = async (q: string) => {
    setGroupSearch(q);
    if (q.length < 2) { setGroupSearchResults([]); return; }
    const res = await api.msg.searchUsers(q);
    setGroupSearchResults((res.users || []).filter((u: FoundUser) => !groupMembers.find(m => m.id === u.id)));
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupMembers.length === 0) return;
    const res = await api.msg.chatCreate(groupName.trim(), groupMembers.map(m => m.id));
    if (res.error) { alert(res.error); return; }
    setShowCreateGroup(false); setGroupName(""); setGroupMembers([]);
    await loadAll();
  };

  const pendingIncoming = contacts.filter(c => c.status === "pending" && c.target_id === user.id);
  const acceptedContacts = contacts.filter(c => c.status === "accepted");

  const getChatTitle = (chat: Chat) => chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");
  const getChatIcon = (chat: Chat) => chat.type === "direct" ? "User" : "Users";

  const formatTime = (dt?: string) => {
    if (!dt) return "";
    const d = new Date(dt);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
  };

  const visibleMessages = msgSearch
    ? messages.filter(m => m.content.toLowerCase().includes(msgSearch.toLowerCase()))
    : messages;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={() => setLightbox(null)}>
          <img src={lightbox} className="max-w-[90vw] max-h-[90vh] object-contain" />
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><Icon name="X" size={24} /></button>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЗАЩИЩЁННАЯ СВЯЗЬ</span>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.8)" }}>
          <div className="flex border-b" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
            {(["chats", "contacts"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 font-mono text-xs tracking-wider transition-colors ${tab === t ? "text-[#00f5ff] border-b border-[#00f5ff]" : "text-[#5a7a95] hover:text-white"}`}>
                {t === "chats" ? "ЧАТЫ" : `КОНТАКТЫ${pendingIncoming.length > 0 ? ` (${pendingIncoming.length})` : ""}`}
              </button>
            ))}
          </div>

          {tab === "chats" && (
            <>
              <button onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#00ff88] hover:bg-[rgba(0,255,136,0.05)] transition-colors border-b"
                style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                <Icon name="Plus" size={13} />
                СОЗДАТЬ ГРУППОВОЙ ЧАТ
              </button>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 font-mono text-xs text-[#3a5570] text-center">загрузка...</div>
                ) : chats.length === 0 ? (
                  <div className="p-6 text-center">
                    <Icon name="MessageSquare" size={24} className="text-[#2a4060] mx-auto mb-2" />
                    <div className="font-mono text-xs text-[#3a5570]">Нет чатов</div>
                  </div>
                ) : chats.map(chat => (
                  <button key={chat.id} onClick={() => openChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(0,245,255,0.04)] border-b ${activeChat?.id === chat.id ? "bg-[rgba(0,245,255,0.06)]" : ""}`}
                    style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0 relative" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                      {chat.type === "direct" && chat.partner?.avatar_url
                        ? <img src={chat.partner.avatar_url} className="w-full h-full object-cover" />
                        : <Icon name={getChatIcon(chat)} size={14} className="text-[#00f5ff]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-white truncate">{getChatTitle(chat)}</span>
                        <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0 ml-1">{formatTime(chat.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-plex text-xs text-[#5a7a95] truncate">{chat.last_message || "нет сообщений"}</span>
                        {chat.unread_count > 0 && (
                          <span className="ml-1 flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00f5ff] flex items-center justify-center font-mono text-[9px] text-black">{chat.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === "contacts" && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
                  <input
                    className="w-full bg-transparent border font-mono text-xs text-white pl-8 pr-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                    style={{ borderColor: "rgba(0,245,255,0.2)" }}
                    placeholder="Поиск по позывному..."
                    value={searchQ}
                    onChange={e => doSearch(e.target.value)}
                  />
                </div>
                {searching && <div className="font-mono text-[10px] text-[#3a5570] mt-1 px-1">поиск...</div>}
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center gap-2 mt-2 p-2" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
                    <Icon name="User" size={13} className="text-[#5a7a95]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-white">{u.callsign}</div>
                      {u.rank && <div className="font-mono text-[10px] text-[#3a5570]">{u.rank}</div>}
                    </div>
                    <button onClick={() => sendContactRequest(u.id)}
                      className="font-mono text-[10px] px-2 py-1 transition-colors"
                      style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
                      <Icon name="UserPlus" size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {pendingIncoming.length > 0 && (
                <div className="p-3 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                  <div className="font-mono text-[10px] text-[#ff6b00] tracking-wider mb-2">ВХОДЯЩИЕ ЗАЯВКИ</div>
                  {pendingIncoming.map(c => (
                    <div key={c.id} className="flex items-center gap-2 mb-2 p-2" style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.03)" }}>
                      <Icon name="User" size={13} className="text-[#ff6b00]" />
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white">{c.callsign}</div>
                      </div>
                      <button onClick={() => respondContact(c.id, "accept")} className="p-1 hover:text-[#00ff88] text-[#5a7a95] transition-colors">
                        <Icon name="Check" size={13} />
                      </button>
                      <button onClick={() => respondContact(c.id, "reject")} className="p-1 hover:text-[#ff2244] text-[#5a7a95] transition-colors">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3">
                <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2">МОИ КОНТАКТЫ ({acceptedContacts.length})</div>
                {acceptedContacts.length === 0 ? (
                  <div className="font-mono text-xs text-[#2a4060] text-center py-4">Нет контактов</div>
                ) : acceptedContacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2 mb-1.5 p-2 hover:bg-[rgba(0,245,255,0.03)] transition-colors" style={{ border: "1px solid rgba(0,245,255,0.08)" }}>
                    <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-white">{c.callsign}</div>
                      {c.rank && <div className="font-mono text-[10px] text-[#3a5570]">{c.rank}</div>}
                    </div>
                  </div>
                ))}
                {contacts.filter(c => c.status === "pending" && c.requester_id === user.id).length > 0 && (
                  <>
                    <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2 mt-4">ОЖИДАЮТ ОТВЕТА</div>
                    {contacts.filter(c => c.status === "pending" && c.requester_id === user.id).map(c => (
                      <div key={c.id} className="flex items-center gap-2 mb-1.5 p-2" style={{ border: "1px solid rgba(0,245,255,0.06)" }}>
                        <div className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse" />
                        <div className="font-mono text-xs text-[#5a7a95]">{c.callsign}</div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.6)" }}>
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.04)" }}>
                  <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
                </div>
                <div className="font-orbitron text-sm text-[#3a5570] tracking-wider">ВЫБЕРИТЕ ЧАТ</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b relative" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>
                  {activeChat.type === "direct" && activeChat.partner?.avatar_url
                    ? <img src={activeChat.partner.avatar_url} className="w-full h-full object-cover" />
                    : <Icon name={getChatIcon(activeChat)} size={14} className="text-[#00f5ff]" />}
                </div>
                <div className="flex-1">
                  <div className="font-orbitron text-xs text-white tracking-wider">{getChatTitle(activeChat)}</div>
                  {activeChat.type === "group" && (
                    <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.members_count} участников</div>
                  )}
                </div>

                {/* Search toggle */}
                <button onClick={() => { setShowSearch(!showSearch); setMsgSearch(""); }}
                  className={`p-1.5 transition-colors ${showSearch ? "text-[#00f5ff]" : "text-[#3a5570] hover:text-white"}`}
                  title="Поиск по сообщениям">
                  <Icon name="Search" size={15} />
                </button>

                {/* Chat menu */}
                <div className="relative">
                  <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-1.5 text-[#3a5570] hover:text-white transition-colors">
                    <Icon name="MoreVertical" size={15} />
                  </button>
                  {showChatMenu && (
                    <div className="absolute right-0 top-8 z-50 w-48 py-1" style={{ background: "#080d1a", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                      {activeChat.type === "group" && (
                        <button onClick={() => { setRenaming(true); setNewChatName(activeChat.name || ""); setShowChatMenu(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                          <Icon name="Pencil" size={12} />Переименовать
                        </button>
                      )}
                      <button onClick={handleClearChat}
                        className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                        <Icon name="Trash2" size={12} />Очистить историю
                      </button>
                      {activeChat.type === "group" && (
                        <button onClick={handleLeaveChat}
                          className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#ff2244] hover:bg-[rgba(255,34,68,0.05)] transition-colors">
                          <Icon name="LogOut" size={12} />Выйти из чата
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button onClick={() => setActiveChat(null)} className="text-[#3a5570] hover:text-white transition-colors">
                  <Icon name="X" size={15} />
                </button>
              </div>

              {/* Rename input */}
              {renaming && (
                <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
                  <input
                    value={newChatName}
                    onChange={e => setNewChatName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleRenameChat(); if (e.key === "Escape") setRenaming(false); }}
                    className="flex-1 bg-transparent border font-plex text-sm text-white px-2 py-1 outline-none focus:border-[#00f5ff]"
                    style={{ borderColor: "rgba(0,245,255,0.3)" }}
                    autoFocus
                    placeholder="Новое название"
                  />
                  <button onClick={handleRenameChat} className="font-mono text-xs text-[#00f5ff] px-2 py-1" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>ОК</button>
                  <button onClick={() => setRenaming(false)} className="font-mono text-xs text-[#3a5570] px-2 py-1" style={{ border: "1px solid #1a2a3a" }}>✕</button>
                </div>
              )}

              {/* Search bar */}
              {showSearch && (
                <div className="px-4 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
                  <div className="relative">
                    <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
                    <input
                      value={msgSearch}
                      onChange={e => setMsgSearch(e.target.value)}
                      className="w-full bg-transparent border font-mono text-xs text-white pl-8 pr-3 py-1.5 outline-none focus:border-[#00f5ff]"
                      style={{ borderColor: "rgba(0,245,255,0.2)" }}
                      placeholder="Поиск в переписке..."
                      autoFocus
                    />
                  </div>
                  {msgSearch && <div className="font-mono text-[10px] text-[#3a5570] mt-1">Найдено: {visibleMessages.length}</div>}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2" onClick={() => setShowChatMenu(false)}>
                {visibleMessages.length === 0 && (
                  <div className="text-center py-8 font-mono text-xs text-[#2a4060]">
                    {msgSearch ? "Ничего не найдено" : "нет сообщений — начните переписку"}
                  </div>
                )}
                {visibleMessages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  const isHidden = msg.hidden;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} group relative`}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => { setHoveredMsg(null); if (showReactPicker === msg.id) setShowReactPicker(null); }}
                    >
                      {/* Message actions on hover */}
                      {hoveredMsg === msg.id && !isHidden && (
                        <div className={`absolute top-0 flex items-center gap-1 z-10 ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                          <button onClick={() => setReplyTo(msg)} className="p-1 text-[#3a5570] hover:text-[#00f5ff] transition-colors" title="Ответить">
                            <Icon name="Reply" size={13} />
                          </button>
                          <div className="relative">
                            <button onClick={() => setShowReactPicker(showReactPicker === msg.id ? null : msg.id)} className="p-1 text-[#3a5570] hover:text-[#ffbe32] transition-colors" title="Реакция">
                              <Icon name="Smile" size={13} />
                            </button>
                            {showReactPicker === msg.id && (
                              <div className="absolute bottom-8 left-0 flex gap-1 p-1.5 z-20" style={{ background: "#0a1520", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
                                {QUICK_REACTIONS.map(e => (
                                  <button key={e} onClick={() => handleReact(msg.id, e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
                                ))}
                              </div>
                            )}
                          </div>
                          {isMine && (
                            <button onClick={() => handleRemoveMessage(msg.id)} className="p-1 text-[#3a5570] hover:text-[#ff2244] transition-colors" title="Удалить">
                              <Icon name="Trash2" size={13} />
                            </button>
                          )}
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!isMine && (
                          <span className="font-mono text-[10px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                        )}

                        {/* Reply preview */}
                        {msg.reply_to_id && msg.reply_content && (
                          <div className="px-2 py-1 mb-0.5 border-l-2 border-[#00f5ff]" style={{ background: "rgba(0,245,255,0.05)", maxWidth: "100%" }}>
                            <div className="font-mono text-[10px] text-[#00f5ff]">@{msg.reply_callsign}</div>
                            <div className="font-plex text-xs text-[#5a7a95] truncate">{msg.reply_content}</div>
                          </div>
                        )}

                        <div className={`px-3 py-2 font-plex text-sm ${isHidden ? "italic text-[#3a5570]" : "text-white"}`} style={{
                          background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isMine ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                          {msg.image_url && !isHidden ? (
                            <img
                              src={msg.image_url}
                              className="max-w-full max-h-48 object-cover cursor-pointer rounded-sm mb-1"
                              onClick={() => setLightbox(msg.image_url!)}
                            />
                          ) : null}
                          {(msg.content && (!msg.image_url || msg.content !== "📷 Изображение")) && (
                            <span>{msg.content}</span>
                          )}
                        </div>

                        {/* Reactions */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 px-1">
                            {Object.entries(msg.reactions).map(([emoji, uids]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs transition-all"
                                style={{
                                  border: `1px solid ${uids.includes(String(user.id)) ? "rgba(0,245,255,0.4)" : "rgba(255,255,255,0.1)"}`,
                                  background: uids.includes(String(user.id)) ? "rgba(0,245,255,0.08)" : "transparent",
                                }}
                              >
                                <span>{emoji}</span>
                                <span className="font-mono text-[10px] text-[#5a7a95]">{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <span className="font-mono text-[10px] text-[#2a4060] px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="px-5 py-1 font-mono text-[10px] text-[#3a5570] animate-pulse">
                  {typingUsers.join(", ")} печатает...
                </div>
              )}

              {/* Reply preview */}
              {replyTo && (
                <div className="flex items-center gap-2 px-4 py-2 border-t" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
                  <Icon name="Reply" size={13} className="text-[#00f5ff] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-[#00f5ff]">@{replyTo.sender_callsign}</div>
                    <div className="font-plex text-xs text-[#5a7a95] truncate">{replyTo.content}</div>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-[#3a5570] hover:text-white">
                    <Icon name="X" size={13} />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="px-4 py-3 border-t flex gap-2 items-end" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) sendImage(f); e.target.value = ""; }} />
                <button onClick={() => fileInputRef.current?.click()} disabled={sending}
                  className="flex items-center justify-center w-8 h-8 flex-shrink-0 transition-all disabled:opacity-30 mb-1"
                  style={{ border: "1px solid rgba(0,245,255,0.2)", color: "#5a7a95" }}
                  title="Прикрепить изображение">
                  <Icon name="Image" size={14} />
                </button>
                <textarea
                  className="flex-1 bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                  style={{ borderColor: "rgba(0,245,255,0.2)" }}
                  rows={1}
                  placeholder="Сообщение... (Enter — отправить)"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="flex items-center justify-center w-10 h-10 flex-shrink-0 transition-all disabled:opacity-30"
                  style={{ border: "1px solid rgba(0,245,255,0.4)", background: "rgba(0,245,255,0.08)", color: "#00f5ff" }}>
                  <Icon name={sending ? "Loader" : "Send"} size={15} className={sending ? "animate-spin" : ""} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create group modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="w-full max-w-md p-6" style={{ background: "#080d1a", border: "1px solid rgba(0,245,255,0.25)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="font-orbitron text-sm text-white tracking-wider">СОЗДАТЬ ГРУППОВОЙ ЧАТ</div>
              <button onClick={() => setShowCreateGroup(false)} className="text-[#5a7a95] hover:text-white">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="mb-4">
              <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">НАЗВАНИЕ ЧАТА</label>
              <input className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors"
                style={{ borderColor: "rgba(0,245,255,0.25)" }}
                placeholder="Название группы"
                value={groupName} onChange={e => setGroupName(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ДОБАВИТЬ УЧАСТНИКОВ</label>
              <input className="w-full bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors mb-2"
                style={{ borderColor: "rgba(0,245,255,0.25)" }}
                placeholder="Поиск по позывному..."
                value={groupSearch} onChange={e => doGroupSearch(e.target.value)} />
              {groupSearchResults.map(u => (
                <div key={u.id} className="flex items-center gap-2 mb-1 p-2 cursor-pointer hover:bg-[rgba(0,245,255,0.05)]"
                  style={{ border: "1px solid rgba(0,245,255,0.1)" }}
                  onClick={() => { setGroupMembers(prev => [...prev, u]); setGroupSearch(""); setGroupSearchResults([]); }}>
                  <Icon name="UserPlus" size={12} className="text-[#5a7a95]" />
                  <span className="font-mono text-xs text-white">{u.callsign}</span>
                </div>
              ))}
              {groupMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {groupMembers.map(m => (
                    <span key={m.id} className="flex items-center gap-1 font-mono text-xs px-2 py-1"
                      style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
                      {m.callsign}
                      <button onClick={() => setGroupMembers(prev => prev.filter(x => x.id !== m.id))} className="ml-1 opacity-60 hover:opacity-100">
                        <Icon name="X" size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={createGroup} disabled={!groupName.trim() || groupMembers.length === 0}
              className="btn-neon w-full flex items-center justify-center gap-2 disabled:opacity-40">
              <Icon name="Users" size={13} />
              СОЗДАТЬ ЧАТ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
