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

interface Props {
  chats: Chat[];
  onOpenChat: (chat: Chat) => void;
  getChatTitle: (chat: Chat) => string;
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

export default function ChatChatsTab({ chats, onOpenChat, getChatTitle }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? chats.filter(c => getChatTitle(c).toLowerCase().includes(search.toLowerCase()))
    : chats;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
      {/* Search */}
      <div className="px-3 py-2 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,245,255,0.08)" }}>
        <div className="relative">
          <Icon name="Search" size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
          <input
            className="w-full bg-[#0a1520] font-mono text-xs text-white pl-7 pr-7 py-1.5 outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.1)" }}
            placeholder="Поиск по чатам..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3a5570] hover:text-white">
              <Icon name="X" size={10} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
            <div className="font-mono text-xs text-[#3a5570]">Нет активных чатов</div>
            <div className="font-mono text-[10px] text-[#2a4060]">Найдите бойцов во вкладке «Контакты»</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <div className="font-mono text-[10px] text-[#3a5570]">Не найдено</div>
          </div>
        ) : filtered.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onOpenChat(chat)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[rgba(0,245,255,0.04)] transition-colors border-b"
            style={{ borderColor: "rgba(0,245,255,0.06)" }}
          >
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
      </div>
    </div>
  );
}
