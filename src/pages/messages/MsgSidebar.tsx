import Icon from "@/components/ui/icon";
import { Chat, Contact, FoundUser, Tab, formatTime, getChatIcon, getChatTitle } from "./MsgTypes";

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
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
  tab, setTab, chats, contacts, activeChat, loading, userId,
  onOpenChat, onShowCreateGroup,
  searchQ, searchResults, searching, onSearch, onSendContactRequest, onRespondContact,
}: Props) {
  const pendingIncoming = contacts.filter(c => c.status === "pending" && c.target_id === userId);
  const acceptedContacts = contacts.filter(c => c.status === "accepted");
  const pendingOutgoing = contacts.filter(c => c.status === "pending" && c.requester_id === userId);

  const navItems = [
    { key: "chats" as Tab, icon: "MessageSquare", badge: chats.reduce((s, c) => s + (c.unread_count || 0), 0) },
    { key: "contacts" as Tab, icon: "Users", badge: pendingIncoming.length },
  ];

  return (
    <div className="flex flex-shrink-0" style={{ height: "100%" }}>
      {/* Icon nav column */}
      <div className="flex flex-col items-center pt-3 pb-3 gap-1" style={{
        width: 52,
        background: "rgba(3,6,12,0.95)",
        borderRight: "1px solid rgba(0,245,255,0.1)",
      }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            title={item.key === "chats" ? "Чаты" : "Контакты"}
            className="relative flex items-center justify-center w-9 h-9 transition-all"
            style={{
              background: tab === item.key ? "rgba(0,245,255,0.12)" : "transparent",
              border: tab === item.key ? "1px solid rgba(0,245,255,0.35)" : "1px solid transparent",
              color: tab === item.key ? "#00f5ff" : "#3a5570",
            }}
            onMouseEnter={e => { if (tab !== item.key) (e.currentTarget as HTMLElement).style.color = "#8ab8d0"; }}
            onMouseLeave={e => { if (tab !== item.key) (e.currentTarget as HTMLElement).style.color = "#3a5570"; }}
          >
            <Icon name={item.icon as "MessageSquare"} size={16} />
            {item.badge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center font-mono text-[8px] font-bold text-black"
                style={{ background: item.key === "contacts" ? "#ff6b00" : "#00f5ff" }}>
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Add group button at bottom */}
        <button
          onClick={onShowCreateGroup}
          title="Создать групповой чат"
          className="flex items-center justify-center w-9 h-9 transition-all"
          style={{ border: "1px solid rgba(0,255,136,0.25)", color: "#00ff88" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.07)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Icon name="Plus" size={15} />
        </button>
      </div>

      {/* Content panel */}
      <div className="flex flex-col overflow-hidden" style={{ width: 260, borderRight: "1px solid rgba(0,245,255,0.1)", background: "rgba(5,8,16,0.85)" }}>

        {/* Chats tab */}
        {tab === "chats" && (
          <>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
              <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">ЧАТЫ</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 font-mono text-xs text-[#3a5570] text-center">загрузка...</div>
              ) : chats.length === 0 ? (
                <div className="p-6 text-center">
                  <Icon name="MessageSquare" size={22} className="text-[#2a4060] mx-auto mb-2" />
                  <div className="font-mono text-xs text-[#3a5570]">Нет чатов</div>
                </div>
              ) : chats.map(chat => (
                <button key={chat.id} onClick={() => onOpenChat(chat)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors border-b"
                  style={{
                    borderColor: "rgba(0,245,255,0.06)",
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
          </>
        )}

        {/* Contacts tab */}
        {tab === "contacts" && (
          <>
            <div className="px-3 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
              <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.2em]">КОНТАКТЫ</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* Search */}
              <div className="p-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                <div className="relative">
                  <Icon name="Search" size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#3a5570]" />
                  <input
                    className="w-full bg-transparent border font-mono text-[11px] text-white pl-7 pr-2 py-1.5 outline-none focus:border-[#00f5ff] transition-colors"
                    style={{ borderColor: "rgba(0,245,255,0.18)" }}
                    placeholder="Поиск по позывному..."
                    value={searchQ}
                    onChange={e => onSearch(e.target.value)}
                  />
                </div>
                {searching && <div className="font-mono text-[9px] text-[#3a5570] mt-1 px-1">поиск...</div>}
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center gap-2 mt-1.5 px-2 py-1.5" style={{ border: "1px solid rgba(0,245,255,0.1)" }}>
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
                      <Icon name="User" size={11} className="text-[#5a7a95]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-white truncate">{u.callsign}</div>
                      {u.rank && <div className="font-mono text-[9px] text-[#3a5570]">{u.rank}</div>}
                    </div>
                    <button onClick={() => onSendContactRequest(u.id)}
                      className="flex items-center justify-center w-6 h-6 transition-colors"
                      style={{ border: "1px solid rgba(0,245,255,0.3)", color: "#00f5ff" }}>
                      <Icon name="UserPlus" size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Incoming requests */}
              {pendingIncoming.length > 0 && (
                <div className="p-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
                  <div className="font-mono text-[9px] text-[#ff6b00] tracking-wider mb-1.5">ВХОДЯЩИЕ ЗАЯВКИ</div>
                  {pendingIncoming.map(c => (
                    <div key={c.id} className="flex items-center gap-2 mb-1.5 px-2 py-1.5" style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.03)" }}>
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(255,107,0,0.3)" }}>
                        <Icon name="User" size={11} className="text-[#ff6b00]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[11px] text-white truncate">{c.callsign}</div>
                      </div>
                      <button onClick={() => onRespondContact(c.id, "accept")} className="p-0.5 hover:text-[#00ff88] text-[#5a7a95] transition-colors">
                        <Icon name="Check" size={13} />
                      </button>
                      <button onClick={() => onRespondContact(c.id, "reject")} className="p-0.5 hover:text-[#ff2244] text-[#5a7a95] transition-colors">
                        <Icon name="X" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Accepted contacts as icon grid */}
              <div className="p-2.5">
                <div className="font-mono text-[9px] text-[#3a5570] tracking-wider mb-2">МОИ КОНТАКТЫ ({acceptedContacts.length})</div>
                {acceptedContacts.length === 0 ? (
                  <div className="font-mono text-[11px] text-[#2a4060] text-center py-4">Нет контактов</div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {acceptedContacts.map(c => (
                      <div key={c.id} className="flex flex-col items-center gap-1 group" title={c.callsign}>
                        <div className="relative w-10 h-10 flex items-center justify-center"
                          style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.05)" }}>
                          <Icon name="User" size={16} className="text-[#5a7a95]" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#00ff88]"
                            style={{ border: "1px solid rgba(5,8,16,0.9)" }} />
                        </div>
                        <span className="font-mono text-[9px] text-[#5a7a95] truncate w-full text-center">{c.callsign}</span>
                      </div>
                    ))}
                  </div>
                )}

                {pendingOutgoing.length > 0 && (
                  <>
                    <div className="font-mono text-[9px] text-[#3a5570] tracking-wider mb-2 mt-4">ОЖИДАЮТ ОТВЕТА</div>
                    <div className="grid grid-cols-4 gap-2">
                      {pendingOutgoing.map(c => (
                        <div key={c.id} className="flex flex-col items-center gap-1" title={c.callsign}>
                          <div className="relative w-10 h-10 flex items-center justify-center"
                            style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.04)" }}>
                            <Icon name="User" size={16} className="text-[#5a7a95]" />
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff6b00] animate-pulse"
                              style={{ border: "1px solid rgba(5,8,16,0.9)" }} />
                          </div>
                          <span className="font-mono text-[9px] text-[#5a7a95] truncate w-full text-center">{c.callsign}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
