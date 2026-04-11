import { useState, useEffect, useRef } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import { type Page, type User } from "@/App";

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link_page: string | null;
  is_read: boolean;
  created_at: string;
}

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
}

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  new_content: { icon: "FileText", color: "#00f5ff" },
  support:     { icon: "Headphones", color: "#00ff88" },
  info:        { icon: "Info", color: "#00f5ff" },
  quiz:        { icon: "ClipboardCheck", color: "#ffbe32" },
};

function timeAgo(s: string) {
  const diff = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} д`;
}

export default function NotificationBell({ user, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const load = async () => {
    const res = await api.notif.list().catch(() => null);
    if (res?.notifications) {
      setNotifications(res.notifications);
      setUnread(res.unread || 0);
    }
  };

  const handleOpen = async () => {
    setOpen(o => !o);
  };

  const markAll = async () => {
    await api.notif.readAll();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const clickNotif = async (n: Notification) => {
    if (!n.is_read) {
      await api.notif.readOne(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (n.link_page) onNavigate(n.link_page as Page);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className={`relative flex items-center justify-center w-7 h-7 transition-all ${open ? "text-[#ffbe32]" : "text-[#5a7a95] hover:text-[#ffbe32]"}`}
        style={{ border: `1px solid ${open ? "rgba(255,190,50,0.5)" : "rgba(255,190,50,0.15)"}` }}
        title="Уведомления"
      >
        <Icon name="Bell" size={13} />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center font-mono text-[8px] font-bold rounded-full px-0.5"
            style={{ background: "#ffbe32", color: "#000" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 z-50 shadow-2xl"
          style={{ border: "1px solid rgba(255,190,50,0.25)", background: "rgba(4,7,14,0.98)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,190,50,0.12)" }}>
            <span className="font-mono text-[10px] text-[#ffbe32] tracking-widest">УВЕДОМЛЕНИЯ</span>
            {unread > 0 && (
              <button onClick={markAll} className="font-mono text-[9px] text-[#3a5570] hover:text-white transition-colors">
                прочитать все
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Icon name="BellOff" size={20} className="text-[#1a2a3a] mx-auto mb-2" />
                <div className="font-mono text-xs text-[#2a4060]">Нет уведомлений</div>
              </div>
            ) : notifications.map(n => {
              const ti = TYPE_ICON[n.type] || TYPE_ICON.info;
              return (
                <button key={n.id} onClick={() => clickNotif(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-colors"
                  style={{
                    borderColor: "rgba(255,190,50,0.06)",
                    background: n.is_read ? "transparent" : "rgba(255,190,50,0.04)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,190,50,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.is_read ? "transparent" : "rgba(255,190,50,0.04)"; }}
                >
                  <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ border: `1px solid ${ti.color}30`, background: `${ti.color}10` }}>
                    <Icon name={ti.icon as "Bell"} size={12} style={{ color: ti.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-mono text-[11px] leading-tight ${n.is_read ? "text-[#5a7a95]" : "text-white"}`}>{n.title}</div>
                    {n.body && <div className="font-plex text-[10px] text-[#3a5570] mt-0.5 truncate">{n.body}</div>}
                    <div className="font-mono text-[9px] text-[#2a4060] mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#ffbe32" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
