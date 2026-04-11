import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Chat {
  id: number;
  type: "direct" | "group";
  name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  partner?: { id: number; name: string; callsign: string };
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

interface SearchResult {
  id: number;
  name: string;
  callsign: string;
  rank?: string;
}

interface Props {
  chats: Chat[];
  contacts: Contact[];
  contactsLoaded: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  totalUnread: number;
  onOpenChat: (chat: Chat) => void;
  getChatTitle: (chat: Chat) => string;
  onSearch: (q: string) => void;
  onAddContact: (id: number) => void;
  onOpenContactChat: (contact: Contact) => void;
}

function isOnline(lastSeen?: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 60 * 1000;
}

function lastSeenShort(lastSeen?: string | null) {
  if (!lastSeen) return "";
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (diff < 60) return "онлайн";
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч`;
  return `${Math.floor(diff / 86400)}д`;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return d.toLocaleDateString("ru", { weekday: "short" });
  return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
}

export default function ChatCombinedList({
  chats, contacts, contactsLoaded,
  searchQuery, searchResults, searching, totalUnread,
  onOpenChat, getChatTitle,
  onSearch, onAddContact, onOpenContactChat,
}: Props) {
  const [chatSearch, setChatSearch] = useState("");

  const filteredChats = chatSearch.trim()
    ? chats.filter(c => getChatTitle(c).toLowerCase().includes(chatSearch.toLowerCase()))
    : chats;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Поиск пользователей ── */}
      <div className="px-3 py-2 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
        <div className="relative">
          <Icon name="UserPlus" size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            className="w-full bg-[#0a1520] font-mono text-xs text-white pl-7 pr-3 py-1.5 outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.1)" }}
            placeholder="Найти бойца и добавить..."
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
        {/* Результаты поиска пользователей */}
        {searchQuery && (
          <div className="mt-1.5 flex flex-col gap-0.5">
            {searching ? (
              <div className="font-mono text-[10px] text-[#3a5570] px-1 animate-pulse">Поиск...</div>
            ) : searchResults.length === 0 ? (
              <div className="font-mono text-[10px] text-[#3a5570] px-1">Не найдено</div>
            ) : searchResults.slice(0, 3).map(u => (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5"
                style={{ border: "1px solid rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.02)" }}>
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 font-orbitron text-[9px] text-[#00f5ff]"
                  style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                  {(u.callsign || u.name || "?")[0].toUpperCase()}
                </div>
                <span className="flex-1 font-mono text-[11px] text-white truncate">{u.callsign || u.name}</span>
                <button onClick={() => onAddContact(u.id)}
                  className="font-mono text-[9px] px-1.5 py-0.5 flex-shrink-0 transition-all"
                  style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88" }}>
                  + ДОБАВИТЬ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Контакты иконками ── */}
      {!searchQuery && contactsLoaded && contacts.length > 0 && (
        <div className="flex-shrink-0 px-3 py-2 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
          <div className="font-mono text-[9px] text-[#3a5570] tracking-wider mb-2">КОНТАКТЫ</div>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {contacts.map(c => {
              const online = isOnline(c.last_seen);
              return (
                <button key={c.id} onClick={() => onOpenContactChat(c)}
                  className="flex flex-col items-center gap-0.5 flex-shrink-0 group"
                  title={c.callsign || c.name}>
                  <div className="relative w-9 h-9 flex items-center justify-center font-orbitron text-xs text-[#00f5ff] transition-all group-hover:scale-105"
                    style={{
                      border: `1px solid ${online ? "rgba(0,255,136,0.4)" : "rgba(0,245,255,0.2)"}`,
                      background: online ? "rgba(0,255,136,0.06)" : "rgba(0,245,255,0.06)",
                    }}>
                    {(c.callsign || c.name || "?")[0].toUpperCase()}
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                        style={{ background: "#00ff88", border: "1.5px solid rgba(5,8,16,1)", boxShadow: "0 0 5px #00ff88" }} />
                    )}
                  </div>
                  <span className="font-mono text-[8px] text-[#3a5570] truncate w-9 text-center leading-tight group-hover:text-[#00f5ff] transition-colors">
                    {online ? "●" : lastSeenShort(c.last_seen) || (c.callsign || c.name).slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Поиск по чатам ── */}
      {!searchQuery && chats.length > 3 && (
        <div className="px-3 py-1.5 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
          <div className="relative">
            <Icon name="Search" size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input
              className="w-full bg-transparent font-mono text-[11px] text-white pl-5 pr-6 py-1 outline-none"
              style={{ border: "1px solid rgba(0,245,255,0.08)" }}
              placeholder="Поиск по чатам..."
              value={chatSearch}
              onChange={e => setChatSearch(e.target.value)}
            />
            {chatSearch && (
              <button onClick={() => setChatSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white">
                <Icon name="X" size={9} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Список чатов ── */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery && (
          <>
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
                <Icon name="MessageSquare" size={24} className="text-[#2a4060]" />
                <div className="font-mono text-xs text-[#3a5570]">
                  {chatSearch ? "Не найдено" : "Нет чатов"}
                </div>
                {!chatSearch && (
                  <div className="font-mono text-[10px] text-[#2a4060]">Нажмите на контакт выше чтобы написать</div>
                )}
              </div>
            ) : (
              <>
                {totalUnread > 0 && !chatSearch && (
                  <div className="px-3 py-1 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <span className="font-mono text-[9px] text-[#3a5570] tracking-wider">ЧАТЫ</span>
                    <span className="ml-2 font-mono text-[9px] px-1 rounded-full text-black"
                      style={{ background: "#ff2244" }}>{totalUnread}</span>
                  </div>
                )}
                {!chatSearch && totalUnread === 0 && (
                  <div className="px-3 py-1 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
                    <span className="font-mono text-[9px] text-[#3a5570] tracking-wider">ЧАТЫ</span>
                  </div>
                )}
                {filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => onOpenChat(chat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b"
                    style={{ borderColor: "rgba(0,245,255,0.06)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.04)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                      <Icon name={chat.type === "direct" ? "User" : "Users"} size={13} className="text-[#00f5ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs text-white truncate">{getChatTitle(chat)}</span>
                        {chat.last_message_at && (
                          <span className="font-mono text-[9px] text-[#3a5570] flex-shrink-0">{formatTime(chat.last_message_at)}</span>
                        )}
                      </div>
                      <div className="font-plex text-[11px] text-[#5a7a95] truncate mt-0.5">
                        {chat.last_message || "нет сообщений"}
                      </div>
                    </div>
                    {chat.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-black flex-shrink-0"
                        style={{ background: "#00f5ff" }}>
                        {chat.unread_count > 9 ? "9+" : chat.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
