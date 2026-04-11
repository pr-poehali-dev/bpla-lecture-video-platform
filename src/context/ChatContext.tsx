import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { api } from "@/api";
import { type User } from "@/App";

interface ChatContextValue {
  totalUnread: number;
  resetUnread: () => void;
}

const ChatContext = createContext<ChatContextValue>({ totalUnread: 0, resetUnread: () => {} });

export function ChatProvider({ user, children }: { user?: User; children: ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    if (!user) return;
    const poll = () => {
      api.msg.chatsList().then(res => {
        const total = (res.chats || []).reduce((s: number, c: { unread_count?: number }) => s + (c.unread_count || 0), 0);
        prevRef.current = total;
        setTotalUnread(total);
      }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [user]);

  const resetUnread = () => setTotalUnread(0);

  return <ChatContext.Provider value={{ totalUnread, resetUnread }}>{children}</ChatContext.Provider>;
}

export const useChatContext = () => useContext(ChatContext);
