import Icon from "@/components/ui/icon";

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
  contacts: Contact[];
  contactsLoaded: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  onSearch: (q: string) => void;
  onAddContact: (id: number) => void;
  onOpenContactChat: (contact: Contact) => void;
}

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 1 * 60 * 1000;
}

export default function ChatContactsTab({
  contacts, contactsLoaded, searchQuery, searchResults, searching,
  onSearch, onAddContact, onOpenContactChat,
}: Props) {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Search */}
      <div className="p-3 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
        <div className="relative">
          <Icon name="Search" size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            className="w-full bg-[#0a1520] font-mono text-xs text-white pl-7 pr-3 py-2 outline-none"
            style={{ border: "1px solid #1a2a3a" }}
            placeholder="Найти бойца по позывному..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
          {searching ? (
            <div className="px-4 py-3 font-mono text-[10px] text-[#3a5570] animate-pulse">Поиск...</div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-3 font-mono text-[10px] text-[#3a5570]">Не найдено</div>
          ) : searchResults.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,245,255,0.05)" }}>
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 font-orbitron text-[10px] text-[#00f5ff]"
                style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                {(u.callsign || u.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-white truncate">{u.callsign || u.name}</div>
                {u.rank && <div className="font-mono text-[10px] text-[#3a5570] truncate">{u.rank}</div>}
              </div>
              <button
                onClick={() => onAddContact(u.id)}
                className="font-mono text-[10px] px-2 py-1 flex-shrink-0 transition-all"
                style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", background: "rgba(0,255,136,0.05)" }}
              >
                + ДОБАВИТЬ
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {!contactsLoaded ? (
          <div className="flex items-center justify-center h-24 font-mono text-[10px] text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <Icon name="Users" size={24} className="text-[#2a4060]" />
            <div className="font-mono text-xs text-[#3a5570]">Контактов нет</div>
            <div className="font-mono text-[10px] text-[#2a4060]">Найдите бойцов через поиск</div>
          </div>
        ) : contacts.map((c) => (
          <button
            key={c.id}
            onClick={() => onOpenContactChat(c)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(0,245,255,0.04)] transition-colors border-b"
            style={{ borderColor: "rgba(0,245,255,0.06)" }}
          >
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="w-8 h-8 flex items-center justify-center font-orbitron text-xs text-[#00f5ff]"
                style={{ border: "1px solid rgba(0,245,255,0.2)", background: "rgba(0,245,255,0.06)" }}>
                {(c.callsign || c.name || "?")[0].toUpperCase()}
              </div>
              {isOnline(c.last_seen) && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#050810]"
                  style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-white truncate">{c.callsign || c.name}</div>
              <div className="font-mono text-[10px]" style={{ color: isOnline(c.last_seen) ? "#00ff88" : "#3a5570" }}>
                {isOnline(c.last_seen) ? "онлайн" : "не в сети"}
              </div>
            </div>
            <Icon name="MessageSquare" size={12} className="text-[#3a5570] flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
