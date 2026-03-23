import Icon from "@/components/ui/icon";

interface Chat {
  id: number;
  type: "direct" | "group";
  name?: string;
  last_message?: string;
  unread_count: number;
  partner?: { id: number; name: string; callsign: string };
}

interface Props {
  chats: Chat[];
  onOpenChat: (chat: Chat) => void;
  getChatTitle: (chat: Chat) => string;
}

export default function ChatChatsTab({ chats, onOpenChat, getChatTitle }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
          <Icon name="MessageSquare" size={28} className="text-[#2a4060]" />
          <div className="font-mono text-xs text-[#3a5570]">Нет активных чатов</div>
          <div className="font-mono text-[10px] text-[#2a4060]">Найдите бойцов во вкладке «Контакты»</div>
        </div>
      ) : chats.map((chat) => (
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
            <div className="font-mono text-xs text-white truncate">{getChatTitle(chat)}</div>
            <div className="font-plex text-[11px] text-[#5a7a95] truncate mt-0.5">{chat.last_message || "нет сообщений"}</div>
          </div>
          {chat.unread_count > 0 && (
            <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] text-black flex-shrink-0"
              style={{ background: "#00f5ff" }}>
              {chat.unread_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
