import { useState, useEffect, useRef } from "react";
import { type User, type Page } from "@/App";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

interface ChatNotif {
  id: string;
  chatId: number;
  chatTitle: string;
  senderCallsign: string;
  text: string;
  isImage: boolean;
}

interface Props {
  user: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const POLL_MS = 8000;
const TOAST_TTL = 5000;

export default function ChatToast({ user, currentPage, onNavigate }: Props) {
  const [toasts, setToasts] = useState<ChatNotif[]>([]);
  const prevUnreadRef = useRef<Record<number, number>>({});
  const prevMessagesRef = useRef<Record<number, number>>({});

  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      // Не показываем тосты если пользователь уже на странице сообщений
      if (currentPage === "messages") {
        prevUnreadRef.current = {};
        prevMessagesRef.current = {};
        return;
      }

      const res = await api.msg.chatsList().catch(() => null);
      if (!res?.chats) return;

      const chats: Array<{
        id: number;
        type: string;
        name?: string;
        unread_count: number;
        last_message?: string;
        last_message_at?: string;
        partner?: { id: number; callsign?: string; name?: string };
        members_count?: number;
      }> = res.chats;

      const newToasts: ChatNotif[] = [];

      for (const chat of chats) {
        const prevUnread = prevUnreadRef.current[chat.id] ?? chat.unread_count;
        const hasNewUnread = chat.unread_count > 0 && chat.unread_count > (prevUnreadRef.current[chat.id] ?? 0);
        const isFirstPoll = !(chat.id in prevUnreadRef.current);

        if (!isFirstPoll && hasNewUnread && chat.last_message) {
          const chatTitle = chat.type === "direct"
            ? (chat.partner?.callsign || chat.partner?.name || "Собеседник")
            : (chat.name || "Групповой чат");

          const senderCallsign = chat.type === "direct"
            ? (chat.partner?.callsign || chat.partner?.name || "")
            : chatTitle;

          const isImage = chat.last_message.startsWith("[изображение]") || chat.last_message === "";

          newToasts.push({
            id: `${chat.id}-${Date.now()}`,
            chatId: chat.id,
            chatTitle,
            senderCallsign,
            text: isImage ? "📎 Изображение" : chat.last_message,
            isImage,
          });
        }

        prevUnreadRef.current[chat.id] = chat.unread_count;
      }

      if (newToasts.length > 0) {
        setToasts(prev => [...prev, ...newToasts].slice(-3)); // максимум 3 тоста
      }
    };

    poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [user, currentPage]);

  // Автоудаление тостов
  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, TOAST_TTL);
    return () => clearTimeout(id);
  }, [toasts]);

  const dismiss = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  const handleClick = (toast: ChatNotif) => {
    onNavigate("messages");
    dismiss(toast.id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-7 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, i) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
          style={{
            width: 300,
            background: "rgba(4,7,14,0.97)",
            border: "1px solid rgba(0,245,255,0.25)",
            boxShadow: "0 0 24px rgba(0,245,255,0.08), 0 8px 32px rgba(0,0,0,0.6)",
            animation: "toast-in 0.25s ease-out",
            opacity: 1 - i * 0.08,
            transform: `translateY(${-i * 4}px) scale(${1 - i * 0.02})`,
          }}
          onClick={() => handleClick(toast)}
        >
          {/* Avatar */}
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 font-orbitron text-xs text-[#00f5ff]"
            style={{ background: "rgba(0,245,255,0.08)", border: "1px solid rgba(0,245,255,0.2)" }}>
            {(toast.senderCallsign || "?")[0].toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-mono text-[11px] text-[#00f5ff] truncate">{toast.chatTitle}</span>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
                className="text-[#3a5570] hover:text-white transition-colors flex-shrink-0"
              >
                <Icon name="X" size={11} />
              </button>
            </div>
            <p className="font-plex text-xs text-[#8ab0cc] truncate leading-tight">{toast.text}</p>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-[2px] rounded-b"
            style={{
              background: "rgba(0,245,255,0.4)",
              animation: `toast-progress ${TOAST_TTL}ms linear forwards`,
              width: "100%",
            }}
          />
        </div>
      ))}
    </div>
  );
}