import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Contact, FoundUser, getChatTitle, formatTime } from "./MsgTypes";

interface Props {
  chats: Chat[];
  contacts: Contact[];
  activeChat: Chat | null;
  loading: boolean;
  userId: number;
  showSupport: boolean;
  unreadSupport: number;
  onOpenChat: (chat: Chat) => void;
  onOpenDirect: (contactUserId: number) => void;
  onShowCreateGroup: () => void;
  onToggleSupport: () => void;
  searchQ: string;
  searchResults: FoundUser[];
  searching: boolean;
  onSearch: (q: string) => void;
  onSendContactRequest: (id: number) => void;
  onRespondContact: (id: number, response: "accept" | "reject") => void;
}

export default function MsgSidebar({
  chats, contacts, activeChat, loading, userId,
  showSupport, unreadSupport,
  onOpenChat, onOpenDirect, onShowCreateGroup, onToggleSupport,
  searchQ, searchResults, searching, onSearch, onSendContactRequest, onRespondContact,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);

  const pendingIncoming = contacts.filter(c => c.status === "pending" && c.target_id === userId);
  const acceptedContacts = contacts.filter(c => c.status === "accepted");
  const pendingOutgoing = contacts.filter(c => c.status === "pending" && c.requester_id === userId);

  // Find direct chat with contact
  const getChatForContact = (contactUserId: number) =>
    chats.find(ch => ch.type === "direct" && ch.partner?.id === contactUserId);

  const allChats = [
    ...acceptedContacts.map(c => {
      const chat = getChatForContact(c.contact_user_id);
      return { key: `c-${c.id}`, type: "direct" as const, contact: c, chat };
    }),
    ...chats.filter(ch => ch.type === "group").map(chat => ({
      key: `g-${chat.id}`, type: "group" as const, contact: null, chat,
    })),
  ];

  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden" style={{ width: 260, height: "100%", background: "rgba(3,5,11,0.98)", borderRight: "1px solid rgba(0,245,255,0.1)" }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.1)" }}>
        <span className="font-orbitron text-xs text-[#00f5ff] tracking-wider flex-1">КОНТАКТЫ</span>
        <button onClick={() => setShowSearch(s => !s)} title="Найти"
          className="flex items-center justify-center w-7 h-7 transition-all"
          style={{ border: showSearch ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(0,245,255,0.15)", color: showSearch ? "#00f5ff" : "#3a5570", background: showSearch ? "rgba(0,245,255,0.06)" : "transparent" }}>
          <Icon name="UserPlus" size={13} />
        </button>
        <button onClick={onShowCreateGroup} title="Группа"
          className="flex items-center justify-center w-7 h-7 transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", background: "transparent" }}>
          <Icon name="Users" size={12} />
        </button>
      </div>

      {/* ── Поиск ── */}
      {showSearch && (
        <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)", background: "rgba(0,245,255,0.02)" }}>
          <div className="relative">
            <Icon name="Search" size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input autoFocus
              className="w-full bg-transparent border font-mono text-[11px] text-white pl-6 pr-2 py-1.5 outline-none focus:border-[#00f5ff] transition-colors"
              style={{ borderColor: "rgba(0,245,255,0.18)" }}
              placeholder="Позывной..."
              value={searchQ}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
          {searching && <div className="font-mono text-[9px] text-[#3a5570] mt-1">поиск...</div>}
          {searchResults.map(u => (
            <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 mt-1" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
                <Icon name="User" size={11} className="text-[#5a7a95]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-white truncate">{u.callsign}</div>
                {u.rank && <div className="font-mono text-[9px] text-[#3a5570]">{u.rank}</div>}
              </div>
              <button onClick={() => onSendContactRequest(u.id)}
                className="flex items-center justify-center w-6 h-6 flex-shrink-0 transition-colors"
                style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
                <Icon name="UserPlus" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Поддержка ── */}
      <button onClick={onToggleSupport}
        className="relative flex items-center gap-3 px-3 py-2.5 transition-all flex-shrink-0"
        style={{
          borderBottom: "1px solid rgba(0,245,255,0.08)",
          background: showSupport ? "rgba(0,255,136,0.07)" : "transparent",
          color: showSupport ? "#00ff88" : "#3a5570",
        }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ border: showSupport ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(0,255,136,0.18)", background: showSupport ? "rgba(0,255,136,0.1)" : "transparent" }}>
          <Icon name="Headphones" size={14} />
        </div>
        <span className="font-mono text-xs">Поддержка</span>
        {unreadSupport > 0 && (
          <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-black"
            style={{ background: "#00ff88" }}>
            {unreadSupport > 9 ? "9+" : unreadSupport}
          </span>
        )}
      </button>

      {/* ── Входящие заявки ── */}
      {pendingIncoming.map(c => (
        <div key={c.id} className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,107,0,0.12)", background: "rgba(255,107,0,0.04)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: "1px solid rgba(255,107,0,0.5)", background: "rgba(255,107,0,0.08)" }}>
            <Icon name="User" size={13} className="text-[#ff6b00]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] text-[#ff6b00] truncate">{c.callsign}</div>
            <div className="font-mono text-[9px] text-[#5a4030]">заявка в контакты</div>
          </div>
          <button onClick={() => onRespondContact(c.id, "accept")}
            className="w-6 h-6 flex items-center justify-center text-[#00ff88] hover:bg-[rgba(0,255,136,0.1)] transition-colors">
            <Icon name="Check" size={12} />
          </button>
          <button onClick={() => onRespondContact(c.id, "reject")}
            className="w-6 h-6 flex items-center justify-center text-[#5a7a95] hover:text-[#ff2244] transition-colors">
            <Icon name="X" size={12} />
          </button>
        </div>
      ))}

      {/* ── Список чатов ── */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="font-mono text-[10px] text-[#2a4060] text-center py-6">ЗАГРУЗКА...</div>
        ) : allChats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Icon name="Users" size={20} className="text-[#1a2a3a]" />
            <span className="font-mono text-[10px] text-[#1a2a3a] leading-tight">Нет контактов.<br/>Найдите пользователя выше.</span>
          </div>
        ) : allChats.map(({ key, type, contact, chat }) => {
          const isActive = chat && activeChat?.id === chat.id;
          const unread = chat?.unread_count || 0;
          const title = type === "direct" ? contact!.callsign : getChatTitle(chat!);
          const sub = type === "direct"
            ? (chat?.last_message ? chat.last_message.slice(0, 28) + (chat.last_message.length > 28 ? "…" : "") : contact!.rank || "")
            : (chat?.last_message ? chat.last_message.slice(0, 28) + (chat.last_message.length > 28 ? "…" : "") : "Группа");
          const avatarUrl = type === "direct" ? contact!.avatar_url : null;
          const accentColor = type === "group" ? "#00ff88" : "#00f5ff";

          return (
            <button key={key}
              onClick={() => type === "direct" ? onOpenDirect(contact!.contact_user_id) : onOpenChat(chat!)}
              className="flex items-center gap-3 w-full px-3 py-2.5 transition-all text-left"
              style={{
                background: isActive ? `rgba(${type === "group" ? "0,255,136" : "0,245,255"},0.07)` : "transparent",
                borderLeft: isActive ? `2px solid ${accentColor}` : "2px solid transparent",
                borderBottom: "1px solid rgba(0,245,255,0.05)",
              }}>
              {/* Аватар */}
              <div className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden font-orbitron text-sm font-bold"
                style={{
                  border: `1px solid ${isActive ? accentColor + "80" : "rgba(0,245,255,0.15)"}`,
                  background: avatarUrl ? "transparent" : `${accentColor}12`,
                  color: accentColor,
                }}>
                {avatarUrl
                  ? <img src={avatarUrl} className="w-full h-full object-cover" />
                  : type === "group"
                    ? <Icon name="Users" size={14} />
                    : (contact!.callsign[0] || "?").toUpperCase()
                }
                {type === "direct" && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00ff88]"
                    style={{ border: "1.5px solid rgba(3,5,11,1)" }} />
                )}
              </div>
              {/* Текст */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-mono text-xs truncate" style={{ color: isActive ? accentColor : "#c0d4e4" }}>{title}</div>
                  {chat?.last_message_at && (
                    <span className="font-mono text-[9px] flex-shrink-0" style={{ color: "#2a4060" }}>{formatTime(chat.last_message_at)}</span>
                  )}
                </div>
                <div className="font-mono text-[10px] truncate" style={{ color: "#3a5570" }}>{sub}</div>
              </div>
              {/* Бейдж */}
              {unread > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-black flex-shrink-0"
                  style={{ background: accentColor }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
              {/* Исходящая заявка */}
              {type === "direct" && pendingOutgoing.find(p => p.contact_user_id === contact!.contact_user_id) && (
                <span className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}