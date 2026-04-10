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
  // chats tab
  onOpenChat: (chat: Chat) => void;
  onShowCreateGroup: () => void;
  // contacts tab
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

  return (
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
          <button onClick={onShowCreateGroup}
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
              <button key={chat.id} onClick={() => onOpenChat(chat)}
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
                onChange={e => onSearch(e.target.value)}
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
                <button onClick={() => onSendContactRequest(u.id)}
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
                  <button onClick={() => onRespondContact(c.id, "accept")} className="p-1 hover:text-[#00ff88] text-[#5a7a95] transition-colors">
                    <Icon name="Check" size={13} />
                  </button>
                  <button onClick={() => onRespondContact(c.id, "reject")} className="p-1 hover:text-[#ff2244] text-[#5a7a95] transition-colors">
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
            {pendingOutgoing.length > 0 && (
              <>
                <div className="font-mono text-[10px] text-[#3a5570] tracking-wider mb-2 mt-4">ОЖИДАЮТ ОТВЕТА</div>
                {pendingOutgoing.map(c => (
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
  );
}
