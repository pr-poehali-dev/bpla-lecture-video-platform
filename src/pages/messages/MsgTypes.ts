export interface Contact {
  id: number; status: string; requester_id: number; target_id: number;
  contact_user_id: number; name: string; callsign: string; rank?: string; created_at: string;
}

export interface Chat {
  id: number; type: "direct" | "group"; name?: string;
  last_message?: string; last_message_at?: string; unread_count: number;
  partner?: { id: number; name: string; callsign: string; rank?: string; last_seen?: string; avatar_url?: string };
  members_count?: number;
}

export interface Message {
  id: number; chat_id: number; sender_id: number;
  sender_name: string; sender_callsign: string; content: string; created_at: string;
  image_url?: string | null; message_type?: string; hidden?: boolean;
  reply_to_id?: number | null; reply_content?: string | null; reply_callsign?: string | null;
  reactions?: Record<string, string[]>;
}

export interface FoundUser { id: number; name: string; callsign: string; rank?: string; }

export type Tab = "chats" | "contacts";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "👎", "🔥"];

export function formatTime(dt?: string): string {
  if (!dt) return "";
  const d = new Date(dt);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });
}

export function getChatTitle(chat: Chat): string {
  return chat.type === "direct" ? (chat.partner?.callsign || chat.partner?.name || "Чат") : (chat.name || "Группа");
}

export function getChatIcon(chat: Chat): "User" | "Users" {
  return chat.type === "direct" ? "User" : "Users";
}
