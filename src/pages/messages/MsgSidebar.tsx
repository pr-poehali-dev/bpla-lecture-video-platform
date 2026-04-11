import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Contact, FoundUser, getChatTitle } from "./MsgTypes";

interface Props {
  chats: Chat[];
  contacts: Contact[];
  activeChat: Chat | null;
  loading: boolean;
  userId: number;
  onOpenChat: (chat: Chat) => void;
  onOpenDirect: (contactUserId: number) => void;
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
  onOpenChat, onOpenDirect, onShowCreateGroup,
  searchQ, searchResults, searching, onSearch, onSendContactRequest, onRespondContact,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);

  const pendingIncoming = contacts.filter(c => c.status === "pending" && c.target_id === userId);
  const acceptedContacts = contacts.filter(c => c.status === "accepted");
  const pendingOutgoing = contacts.filter(c => c.status === "pending" && c.requester_id === userId);

  // Find direct chat with contact
  const getChatForContact = (contactUserId: number) =>
    chats.find(ch => ch.type === "direct" && ch.partner?.id === contactUserId);

  return (
    <div className="flex flex-shrink-0" style={{ height: "100%" }}>

      {/* ── Contacts icon column ── */}
      <div
        className="flex flex-col items-center py-3 gap-1.5 overflow-y-auto"
        style={{
          width: 64,
          background: "rgba(3,5,11,0.98)",
          borderRight: "1px solid rgba(0,245,255,0.1)",
        }}
      >
        {/* Add contact / search */}
        <button
          onClick={() => setShowSearch(s => !s)}
          title="Найти пользователя"
          className="flex items-center justify-center w-10 h-10 mb-1 transition-all flex-shrink-0"
          style={{
            border: showSearch ? "1px solid rgba(0,245,255,0.4)" : "1px solid rgba(0,245,255,0.15)",
            color: showSearch ? "#00f5ff" : "#3a5570",
            background: showSearch ? "rgba(0,245,255,0.08)" : "transparent",
          }}
        >
          <Icon name="UserPlus" size={15} />
        </button>

        {/* Create group */}
        <button
          onClick={onShowCreateGroup}
          title="Создать групповой чат"
          className="flex items-center justify-center w-10 h-10 mb-2 transition-all flex-shrink-0"
          style={{
            border: "1px solid rgba(0,255,136,0.2)",
            color: "#00ff88",
            background: "transparent",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Icon name="Users" size={14} />
        </button>

        <div className="w-8 h-px mb-1 flex-shrink-0" style={{ background: "rgba(0,245,255,0.08)" }} />

        {/* Pending incoming requests */}
        {pendingIncoming.map(c => (
          <div key={c.id} className="flex flex-col items-center gap-0.5 w-full px-1.5 flex-shrink-0" title={`${c.callsign} — заявка`}>
            <div className="relative w-10 h-10 flex items-center justify-center"
              style={{ border: "1px solid rgba(255,107,0,0.5)", background: "rgba(255,107,0,0.08)" }}>
              <Icon name="User" size={16} className="text-[#ff6b00]" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#ff6b00] animate-pulse"
                style={{ border: "1.5px solid rgba(3,5,11,1)" }} />
            </div>
            <div className="flex gap-1 mt-0.5">
              <button onClick={() => onRespondContact(c.id, "accept")}
                className="flex items-center justify-center w-4 h-4 text-[#00ff88] hover:bg-[rgba(0,255,136,0.1)] transition-colors">
                <Icon name="Check" size={10} />
              </button>
              <button onClick={() => onRespondContact(c.id, "reject")}
                className="flex items-center justify-center w-4 h-4 text-[#5a7a95] hover:text-[#ff2244] transition-colors">
                <Icon name="X" size={10} />
              </button>
            </div>
          </div>
        ))}

        {/* Accepted contacts */}
        {loading ? (
          <div className="font-mono text-[9px] text-[#2a4060] text-center px-1">...</div>
        ) : acceptedContacts.length === 0 ? (
          <div className="flex flex-col items-center gap-1 mt-2 px-1">
            <Icon name="Users" size={16} className="text-[#1a2a3a]" />
            <span className="font-mono text-[8px] text-[#1a2a3a] text-center leading-tight">нет контактов</span>
          </div>
        ) : acceptedContacts.map(c => {
          const chat = getChatForContact(c.contact_user_id);
          const isActive = chat && activeChat?.id === chat.id;
          const unread = chat?.unread_count || 0;
          return (
            <button
              key={c.id}
              onClick={() => onOpenDirect(c.contact_user_id)}
              title={c.callsign + (c.rank ? ` · ${c.rank}` : "")}
              className="flex flex-col items-center gap-0.5 w-full px-1.5 transition-all flex-shrink-0"
              style={{ cursor: "pointer", opacity: 1 }}
            >
              <div className="relative w-10 h-10 flex items-center justify-center"
                style={{
                  border: isActive ? "1px solid rgba(0,245,255,0.6)" : "1px solid rgba(0,245,255,0.18)",
                  background: isActive ? "rgba(0,245,255,0.1)" : "rgba(0,245,255,0.04)",
                  boxShadow: isActive ? "0 0 8px rgba(0,245,255,0.2)" : "none",
                }}>
                <Icon name="User" size={16} className={isActive ? "text-[#00f5ff]" : "text-[#3a5570]"} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ff88]"
                  style={{ border: "1.5px solid rgba(3,5,11,1)" }} />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#00f5ff] flex items-center justify-center font-mono text-[7px] font-bold text-black"
                    style={{ border: "1.5px solid rgba(3,5,11,1)" }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </div>
              <span className="font-mono text-[8px] truncate w-full text-center leading-tight"
                style={{ color: isActive ? "#00f5ff" : "#3a5570" }}>
                {c.callsign}
              </span>
            </button>
          );
        })}

        {/* Pending outgoing */}
        {pendingOutgoing.map(c => (
          <button key={c.id} className="flex flex-col items-center gap-0.5 w-full px-1.5 flex-shrink-0"
            title={`${c.callsign} · ожидает ответа`} style={{ cursor: "default" }}>
            <div className="relative w-10 h-10 flex items-center justify-center"
              style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.04)" }}>
              <Icon name="User" size={16} className="text-[#5a7a95]" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff6b00] animate-pulse"
                style={{ border: "1.5px solid rgba(3,5,11,1)" }} />
            </div>
            <span className="font-mono text-[8px] text-[#3a5570] truncate w-full text-center leading-tight">{c.callsign}</span>
          </button>
        ))}

        {/* Group chats */}
        {chats.filter(ch => ch.type === "group").length > 0 && (
          <>
            <div className="w-8 h-px my-1 flex-shrink-0" style={{ background: "rgba(0,245,255,0.08)" }} />
            {chats.filter(ch => ch.type === "group").map(chat => {
              const isActive = activeChat?.id === chat.id;
              const unread = chat.unread_count || 0;
              return (
                <button key={chat.id} onClick={() => onOpenChat(chat)}
                  title={getChatTitle(chat)}
                  className="flex flex-col items-center gap-0.5 w-full px-1.5 flex-shrink-0">
                  <div className="relative w-10 h-10 flex items-center justify-center"
                    style={{
                      border: isActive ? "1px solid rgba(0,255,136,0.5)" : "1px solid rgba(0,255,136,0.15)",
                      background: isActive ? "rgba(0,255,136,0.08)" : "rgba(0,255,136,0.03)",
                      boxShadow: isActive ? "0 0 8px rgba(0,255,136,0.15)" : "none",
                    }}>
                    <Icon name="Users" size={14} className={isActive ? "text-[#00ff88]" : "text-[#2a5a40]"} />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#00f5ff] flex items-center justify-center font-mono text-[7px] font-bold text-black"
                        style={{ border: "1.5px solid rgba(3,5,11,1)" }}>
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[8px] truncate w-full text-center leading-tight"
                    style={{ color: isActive ? "#00ff88" : "#2a5a40" }}>
                    {getChatTitle(chat)}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── Search panel (slide-in) ── */}
      {showSearch && (
        <div className="flex flex-col flex-shrink-0 overflow-hidden"
          style={{ width: 220, borderRight: "1px solid rgba(0,245,255,0.1)", background: "rgba(4,7,14,0.97)" }}>
          <div className="px-3 py-2.5 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(0,245,255,0.08)" }}>
            <span className="font-mono text-[10px] text-[#3a5570] tracking-widest">НАЙТИ</span>
            <button onClick={() => { setShowSearch(false); onSearch(""); }}
              className="text-[#3a5570] hover:text-white transition-colors">
              <Icon name="X" size={13} />
            </button>
          </div>
          <div className="p-2.5">
            <div className="relative">
              <Icon name="Search" size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5570]" />
              <input
                autoFocus
                className="w-full bg-transparent border font-mono text-[11px] text-white pl-6 pr-2 py-1.5 outline-none focus:border-[#00f5ff] transition-colors"
                style={{ borderColor: "rgba(0,245,255,0.18)" }}
                placeholder="Позывной..."
                value={searchQ}
                onChange={e => onSearch(e.target.value)}
              />
            </div>
            {searching && <div className="font-mono text-[9px] text-[#3a5570] mt-1.5">поиск...</div>}
            <div className="mt-2 flex flex-col gap-1">
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center gap-2 px-2 py-1.5"
                  style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0"
                    style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
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
          </div>
        </div>
      )}
    </div>
  );
}