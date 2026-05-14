import Icon from "@/components/ui/icon";
import { Chat, Message, getChatIcon, getChatTitle, isOnline, lastSeenLabel } from "./MsgTypes";

interface Props {
  activeChat: Chat;
  typingUsers: string[];
  msgSearch: string;
  showSearch: boolean;
  showChatMenu: boolean;
  renaming: boolean;
  newChatName: string;
  onClose: () => void;
  onToggleSearch: () => void;
  onMsgSearchChange: (v: string) => void;
  onToggleChatMenu: () => void;
  onStartRename: () => void;
  onClearChat: () => void;
  onLeaveChat: () => void;
  onNewChatNameChange: (v: string) => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameConfirm: () => void;
  onCancelRename: () => void;
  visibleMessages: Message[];
}

export default function MsgChatHeader({
  activeChat, typingUsers, msgSearch, showSearch, showChatMenu,
  renaming, newChatName,
  onClose, onToggleSearch, onMsgSearchChange, onToggleChatMenu,
  onStartRename, onClearChat, onLeaveChat,
  onNewChatNameChange, onRenameKeyDown, onRenameConfirm, onCancelRename,
  visibleMessages,
}: Props) {
  return (
    <>
      {/* ── Шапка ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b relative"
        style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(3,5,11,0.95)" }}>
        <div className="w-8 h-8 flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ border: "1px solid rgba(0,245,255,0.25)", background: "rgba(0,245,255,0.05)" }}>
          {activeChat.type === "direct" && activeChat.partner?.avatar_url
            ? <img src={activeChat.partner.avatar_url} className="w-full h-full object-cover" />
            : <Icon name={getChatIcon(activeChat)} size={14} className="text-[#00f5ff]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-orbitron text-xs text-white tracking-wider truncate">{getChatTitle(activeChat)}</div>
          {activeChat.type === "group" && (
            <div className="font-mono text-[10px] text-[#3a5570]">{activeChat.members_count} участников</div>
          )}
          {activeChat.type === "direct" && typingUsers.length > 0 ? (
            <div className="font-mono text-[10px] text-[#00ff88] animate-pulse">печатает...</div>
          ) : activeChat.type === "direct" && activeChat.partner?.last_seen ? (
            <div className="font-mono text-[10px] flex items-center gap-1.5"
              style={{ color: isOnline(activeChat.partner.last_seen) ? "#00ff88" : "#3a5570" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: isOnline(activeChat.partner.last_seen) ? "#00ff88" : "#3a5570", boxShadow: isOnline(activeChat.partner.last_seen) ? "0 0 4px #00ff88" : "none" }} />
              {isOnline(activeChat.partner.last_seen) ? "в сети" : `был(а) ${lastSeenLabel(activeChat.partner.last_seen)}`}
            </div>
          ) : null}
        </div>

        <button onClick={onToggleSearch}
          className={`p-1.5 transition-colors ${showSearch ? "text-[#00f5ff]" : "text-[#3a5570] hover:text-white"}`}
          title="Поиск">
          <Icon name="Search" size={15} />
        </button>

        <div className="relative">
          <button onClick={onToggleChatMenu} className="p-1.5 text-[#3a5570] hover:text-white transition-colors">
            <Icon name="MoreVertical" size={15} />
          </button>
          {showChatMenu && (
            <div className="absolute right-0 top-8 z-50 w-48 py-1"
              style={{ background: "#070d18", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
              {activeChat.type === "group" && (
                <button onClick={onStartRename}
                  className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                  <Icon name="Pencil" size={12} />Переименовать
                </button>
              )}
              <button onClick={onClearChat}
                className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#5a7a95] hover:text-white hover:bg-[rgba(0,245,255,0.05)] transition-colors">
                <Icon name="Trash2" size={12} />Очистить историю
              </button>
              {activeChat.type === "group" && (
                <button onClick={onLeaveChat}
                  className="w-full flex items-center gap-2 px-4 py-2.5 font-mono text-xs text-[#ff2244] hover:bg-[rgba(255,34,68,0.05)] transition-colors">
                  <Icon name="LogOut" size={12} />Выйти из чата
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={onClose} className="text-[#3a5570] hover:text-white transition-colors">
          <Icon name="X" size={15} />
        </button>
      </div>

      {/* Переименование */}
      {renaming && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b"
          style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,245,255,0.03)" }}>
          <input value={newChatName} onChange={e => onNewChatNameChange(e.target.value)}
            onKeyDown={onRenameKeyDown} autoFocus placeholder="Новое название"
            className="flex-1 bg-transparent border font-plex text-sm text-white px-2 py-1 outline-none focus:border-[#00f5ff]"
            style={{ borderColor: "rgba(0,245,255,0.3)" }} />
          <button onClick={onRenameConfirm} className="font-mono text-xs text-[#00f5ff] px-2 py-1" style={{ border: "1px solid rgba(0,245,255,0.3)" }}>ОК</button>
          <button onClick={onCancelRename} className="font-mono text-xs text-[#3a5570] px-2 py-1" style={{ border: "1px solid #1a2a3a" }}>✕</button>
        </div>
      )}

      {/* Поиск */}
      {showSearch && (
        <div className="px-4 py-2 flex-shrink-0 border-b" style={{ borderColor: "rgba(0,245,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div className="relative">
            <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3a5570]" />
            <input value={msgSearch} onChange={e => onMsgSearchChange(e.target.value)} autoFocus
              placeholder="Поиск в переписке..."
              className="w-full bg-transparent border font-mono text-xs text-white pl-8 pr-3 py-1.5 outline-none focus:border-[#00f5ff]"
              style={{ borderColor: "rgba(0,245,255,0.2)" }} />
          </div>
          {msgSearch && <div className="font-mono text-[10px] text-[#3a5570] mt-1">Найдено: {visibleMessages.length}</div>}
        </div>
      )}
    </>
  );
}
