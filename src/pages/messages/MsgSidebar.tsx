import Icon from "@/components/ui/icon";
import { Chat, Contact, FoundUser, formatTime, getChatIcon, getChatTitle } from "./MsgTypes";

interface Props {
  chats: Chat[];
  contacts: Contact[];
  activeChat: Chat | null;
  loading: boolean;
  userId: number;
  onOpenChat: (chat: Chat) => void;
  onShowCreateGroup: () => void;
  searchQ: string;
  searchResults: FoundUser[];
  searching: boolean;
  onSearch: (q: string) => void;
  onSendContactRequest: (id: number) => void;
  onRespondContact: (id: number, response: "accept" | "reject") => void;
}

export default function MsgSidebar({
  chats, contacts, activeChat, loading, userId,
  onOpenChat, onShowCreateGroup,
  searchQ, searchResults, searching, onSearch, onSendContactRequest, onRespondContact,
}: Props) {
  const pendingIncoming = contacts.filter(c => c.status === "pending" && c.target_id === userId);
  const acceptedContacts = contacts.filter(c => c.status === "accepted");
  const pendingOutgoing = contacts.filter(c => c.status === "pending" && c.requester_id === userId);

  return (
    <div className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: 280, borderRight: "1px solid rgba(0,245,255,0.12)", background: "rgba(4,7,14,0.97)" }}>

      {/* ── ЧАТЫ ── */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: "rgba(0,245,255,0.08)" }}>
        <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">ЧАТЫ</span>
        <button onClick={onShowCreateGroup} title="Создать групповой чат"
          className="flex items-center justify-center w-6 h-6 transition-colors"
          style={{ border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <Icon name="Plus" size={12} />
        </button>
      </div>

      <div className="overflow-y-auto" style={{ flex: "1 1 0", minHeight: 80 }}>
        {loading ? (
          <div className="p-4 font-mono text-xs text-[#3a5570] text-center">загрузка...</div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center">
            <Icon name="MessageSquare" size={20} className="text-[#2a4060] mx-auto mb-1.5" />
            <div className="font-mono text-[11px] text-[#3a5570]">Нет чатов</div>
          </div>
        ) : chats.map(chat => (
          <button key={chat.id} onClick={() => onOpenChat(chat)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b"
            style={{
              borderColor: "rgba(0,245,255,0.05)",
              background: activeChat?.id === chat.id ? "rgba(0,245,255,0.07)" : "transparent",
              borderLeft: activeChat?.id === chat.id ? "2px solid #00f5ff" : "2px solid transparent",
            }}
            onMouseEnter={e => { if (activeChat?.id !== chat.id) (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.03)"; }}
            onMouseLeave={e => { if (activeChat?.id !== chat.id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ border: "1px solid rgba(0,245,255,0.18)", background: "rgba(0,245,255,0.05)" }}>
              {chat.type === "direct" && chat.partner?.avatar_url
                ? <img src={chat.partner.avatar_url} className="w-full h-full object-cover" />
                : <Icon name={getChatIcon(chat)} size={13} className="text-[#00f5ff]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-[11px] text-white truncate">{getChatTitle(chat)}</span>
                <span className="font-mono text-[9px] text-[#3a5570] flex-shrink-0">{formatTime(chat.last_message_at)}</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-plex text-[11px] text-[#5a7a95] truncate">{chat.last_message || "нет сообщений"}</span>
                {chat.unread_count > 0 && (
                  <span className="flex-shrink-0 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#00f5ff] flex items-center justify-center font-mono text-[8px] text-black">{chat.unread_count}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── КОНТАКТЫ ── */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: "rgba(0,245,255,0.12)", background: "rgba(3,6,12,0.8)" }}>

        {/* Search + incoming requests */}
        <div className="px-3 pt-2.5 pb-2 border-b" style={{ borderColor: "rgba(0,245,255,0.06)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">КОНТАКТЫ</span>
            {pendingIncoming.length > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full text-black font-bold"
                style={{ background: "#ff6b00" }}>{pendingIncoming.length}</span>
            )}
          </div>

          {/* Search input */}
          <div className="relative">
            <Icon name="Search" size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input
              className="w-full bg-transparent border font-mono text-[10px] text-white pl-6 pr-2 py-1 outline-none focus:border-[#00f5ff] transition-colors"
              style={{ borderColor: "rgba(0,245,255,0.15)" }}
              placeholder="Найти пользователя..."
              value={searchQ}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
          {searching && <div className="font-mono text-[9px] text-[#3a5570] mt-1">поиск...</div>}
          {searchResults.map(u => (
            <div key={u.id} className="flex items-center gap-1.5 mt-1.5 px-1.5 py-1"
              style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
                <Icon name="User" size={10} className="text-[#5a7a95]" />
              </div>
              <span className="flex-1 font-mono text-[10px] text-white truncate">{u.callsign}</span>
              <button onClick={() => onSendContactRequest(u.id)}
                className="flex items-center justify-center w-5 h-5 flex-shrink-0 transition-colors"
                style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
                <Icon name="UserPlus" size={9} />
              </button>
            </div>
          ))}

          {/* Incoming requests inline */}
          {pendingIncoming.map(c => (
            <div key={c.id} className="flex items-center gap-1.5 mt-1.5 px-1.5 py-1"
              style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.03)" }}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                style={{ border: "1px solid rgba(255,107,0,0.3)" }}>
                <Icon name="User" size={10} className="text-[#ff6b00]" />
              </div>
              <span className="flex-1 font-mono text-[10px] text-white truncate">{c.callsign}</span>
              <button onClick={() => onRespondContact(c.id, "accept")}
                className="p-0.5 hover:text-[#00ff88] text-[#5a7a95] transition-colors">
                <Icon name="Check" size={12} />
              </button>
              <button onClick={() => onRespondContact(c.id, "reject")}
                className="p-0.5 hover:text-[#ff2244] text-[#5a7a95] transition-colors">
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Contacts icon grid */}
        <div className="p-2.5" style={{ maxHeight: 140, overflowY: "auto" }}>
          {acceptedContacts.length === 0 && pendingOutgoing.length === 0 ? (
            <div className="font-mono text-[10px] text-[#2a4060] text-center py-2">нет контактов</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {acceptedContacts.map(c => (
                <div key={c.id} className="flex flex-col items-center gap-0.5 w-12" title={`${c.callsign}${c.rank ? ` · ${c.rank}` : ""}`}>
                  <div className="relative w-9 h-9 flex items-center justify-center"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
                    <Icon name="User" size={15} className="text-[#5a7a95]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ff88]"
                      style={{ border: "1.5px solid rgba(4,7,14,1)" }} />
                  </div>
                  <span className="font-mono text-[8px] text-[#5a7a95] truncate w-full text-center leading-tight">{c.callsign}</span>
                </div>
              ))}
              {pendingOutgoing.map(c => (
                <div key={c.id} className="flex flex-col items-center gap-0.5 w-12" title={`${c.callsign} · ожидает`}>
                  <div className="relative w-9 h-9 flex items-center justify-center"
                    style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.04)" }}>
                    <Icon name="User" size={15} className="text-[#5a7a95]" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff6b00] animate-pulse"
                      style={{ border: "1.5px solid rgba(4,7,14,1)" }} />
                  </div>
                  <span className="font-mono text-[8px] text-[#5a7a95] truncate w-full text-center leading-tight">{c.callsign}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
