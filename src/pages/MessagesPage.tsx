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
  partner?: { id: number; name: string; callsign: string; rank?: string };
  members_count?: number;
}
interface Message {
  id: number; chat_id: number; sender_id: number;
  sender_name: string; sender_callsign: string; content: string; created_at: string;
}
interface FoundUser { id: number; name: string; callsign: string; rank?: string; }

type Tab = "chats" | "contacts";

export default function MessagesPage({ user }: MessagesPageProps) {
  const [tab, setTab] = useState<Tab>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Поиск пользователей
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Создать группу
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<FoundUser[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<FoundUser[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => loadMessages(activeChat.id), 10000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
    await loadMessages(chat.id);
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread_count: 0 } : c));
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    const res = await api.msg.messageSend(activeChat.id, input.trim());
    setSending(false);
    if (res.message) {
      setMessages(prev => [...prev, res.message]);
      setInput("");
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, last_message: input.trim(), last_message_at: new Date().toISOString() } : c));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
    if (!res.error) {
      setSearchQ(""); setSearchResults([]);
      await loadAll();
    } else alert(res.error);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// ЗАЩИЩЁННАЯ СВЯЗЬ</span>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 flex flex-col" style={{ border: "1px solid rgba(0,245,255,0.15)", background: "rgba(5,8,16,0.8)" }}>
          {/* Tabs */}
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
              {/* New group button */}
              <button onClick={() => setShowCreateGroup(true)}
                className="flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#00ff88] hover:bg-[rgba(0,255,136,0.05)] transition-colors border-b"
                style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                <Icon name="Plus" size={13} />
                СОЗДАТЬ ГРУППОВОЙ ЧАТ
              </button>

              {/* Chats list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 font-mono text-xs text-[#3a5570] text-center">загрузка...</div>
                ) : chats.length === 0 ? (
                  <div className="p-6 text-center">
                    <Icon name="MessageSquare" size={24} className="text-[#2a4060] mx-auto mb-2" />
                    <div className="font-mono text-xs text-[#3a5570]">Нет чатов</div>
                    <div className="font-mono text-[10px] text-[#2a4060] mt-1">Добавьте контакты</div>
                  </div>
                ) : chats.map(chat => (
                  <button key={chat.id} onClick={() => openChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(0,245,255,0.04)] border-b ${activeChat?.id === chat.id ? "bg-[rgba(0,245,255,0.06)]" : ""}`}
                    style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                      <Icon name={getChatIcon(chat)} size={15} className="text-[#00f5ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-white truncate">{getChatTitle(chat)}</span>
                        <span className="font-mono text-[10px] text-[#3a5570] flex-shrink-0 ml-1">{formatTime(chat.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-plex text-xs text-[#5a7a95] truncate">{chat.last_message || "нет сообщений"}</span>
                        {chat.unread_count > 0 && (
                          <span className="ml-1 flex-shrink-0 w-4 h-4 rounded-full bg-[#00f5ff] flex items-center justify-center font-mono text-[9px] text-black">{chat.unread_count}</span>
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
              {/* Search */}
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

              {/* Incoming requests */}
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

              {/* Accepted contacts */}
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

                {/* Pending outgoing */}
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
                <div className="font-mono text-xs text-[#2a4060] mt-1">или добавьте контакт для начала переписки</div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
                <div className="w-8 h-8 flex items-center justify-center" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>
                  <Icon name={getChatIcon(activeChat)} size={14} className="text-[#00f5ff]" />
                </div>
                <div>
                  <div className="font-orbitron text-xs text-white tracking-wider">{getChatTitle(activeChat)}</div>
                  {activeChat.type === "direct" && activeChat.partner?.rank && (
                    <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.partner.rank}</div>
                  )}
                  {activeChat.type === "group" && (
                    <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.members_count} участников</div>
                  )}
                </div>
                <button onClick={() => setActiveChat(null)} className="ml-auto text-[#3a5570] hover:text-white transition-colors">
                  <Icon name="X" size={15} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 font-mono text-xs text-[#2a4060]">нет сообщений — начните переписку</div>
                )}
                {messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isMine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        {!isMine && (
                          <span className="font-mono text-[10px] text-[#00f5ff] px-1">{msg.sender_callsign || msg.sender_name}</span>
                        )}
                        <div className="px-3 py-2 font-plex text-sm text-white" style={{
                          background: isMine ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isMine ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.08)"}`,
                        }}>
                          {msg.content}
                        </div>
                        <span className="font-mono text-[10px] text-[#2a4060] px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: "rgba(0,245,255,0.1)" }}>
                <textarea
                  className="flex-1 bg-transparent border font-plex text-sm text-white px-3 py-2 outline-none focus:border-[#00f5ff] transition-colors resize-none"
                  style={{ borderColor: "rgba(0,245,255,0.2)" }}
                  rows={1}
                  placeholder="Сообщение... (Enter — отправить)"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
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
              <label className="font-mono text-xs text-[#5a7a95] tracking-wider block mb-1.5">ДОБАВИТЬ УЧАСТНИКОВ (только контакты)</label>
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