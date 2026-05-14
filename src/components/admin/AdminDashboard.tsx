import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "@/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

type Tab = "dashboard" | "users" | "roles" | "content" | "removals" | "discussions" | "lectures" | "videos" | "files" | "settings" | "pages" | "support" | "quizzes" | "audit" | "drones";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  admins: number;
  by_role: Record<string, number>;
  files?: number;
  topics?: number;
  replies?: number;
  messages?: number;
  chats?: number;
  removal_pending?: number;
}

interface ChartRow { month: string; new_total: number; approved_total: number; }
interface TopItem { id: number; title: string; file_type: string; category: string; views: number; }

const PIE_COLORS = ["#00f5ff", "#00ff88", "#ff6b00", "#a855f7"];

function StatCard({ label, value, icon, color, change }: { label: string; value: string | number; icon: string; color: string; change?: string }) {
  return (
    <div className="flex flex-col gap-3 p-5" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 8 }}>
      <div className="flex items-center justify-between">
        <div className="font-orbitron text-2xl font-black text-white">{value}</div>
        <div className="w-9 h-9 flex items-center justify-center" style={{ background: `${color}18`, borderRadius: 6 }}>
          <Icon name={icon as "Users"} size={18} style={{ color }} />
        </div>
      </div>
      <div className="w-full h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-[#7a9bb5]">{label}</span>
        {change && <span className="font-mono text-[10px] text-[#00ff88]">{change}</span>}
      </div>
    </div>
  );
}

function CircleProgress({ pct, color, label, sub }: { pct: number; color: string; label: string; sub: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="flex items-center gap-4 p-4 flex-1" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 8 }}>
      <div className="relative flex-shrink-0">
        <svg width="68" height="68" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="34" cy="34" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            transform="rotate(-90 34 34)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-orbitron text-sm font-bold" style={{ color }}>{pct}%</div>
      </div>
      <div>
        <div className="font-plex text-sm text-white mb-0.5">{label}</div>
        <div className="font-mono text-[10px] text-[#5a7a95]">{sub}</div>
      </div>
    </div>
  );
}

interface Props {
  stats: Stats | null;
  pendingCount: number;
  chartData: ChartRow[];
  topContent: TopItem[];
  onNavigate: (tab: Tab) => void;
  onGoToUsers: () => void;
}

export default function AdminDashboard({ stats, pendingCount, chartData, topContent, onNavigate, onGoToUsers }: Props) {
  const total = stats?.total || 1;

  const pieChartData = stats?.by_role && Object.keys(stats.by_role).length > 0
    ? Object.entries(stats.by_role).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i] || "#00f5ff" }))
    : [{ name: "Нет данных", value: 1, color: "#1a2a3a" }];

  const [notifTitle, setNotifTitle] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifSent, setNotifSent] = useState(false);

  const sendNotif = async () => {
    if (!notifTitle.trim()) return;
    setNotifSending(true);
    await api.notif.adminSend({ title: notifTitle.trim(), type: "admin_message" });
    setNotifSending(false);
    setNotifSent(true);
    setNotifTitle("");
    setTimeout(() => setNotifSent(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Stat cards — users */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Всего бойцов" value={stats?.total ?? "—"} icon="Users" color="#00f5ff" />
        <StatCard label="Ожидают допуска" value={stats?.pending ?? "—"} icon="Clock" color="#ff6b00" change={pendingCount > 0 ? "Нужно внимание" : undefined} />
        <StatCard label="Допущено" value={stats?.approved ?? "—"} icon="UserCheck" color="#00ff88" />
        <StatCard label="Администраторы" value={stats?.admins ?? "—"} icon="Shield" color="#a855f7" />
      </div>

      {/* Stat cards — content */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Файлов загружено" value={stats?.files ?? "—"} icon="FileVideo" color="#00f5ff" />
        <StatCard label="Тем обсуждений" value={stats?.topics ?? "—"} icon="MessageSquare" color="#00ff88" />
        <StatCard label="Сообщений в чатах" value={stats?.messages ?? "—"} icon="MessageCircle" color="#a855f7" />
        <StatCard label="Заявок на удаление" value={stats?.removal_pending ?? "—"} icon="Trash2" color="#ff6b00" change={stats?.removal_pending ? "Ожидают" : undefined} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 p-5" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 8 }}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-orbitron text-sm font-bold text-white">Активность состава</div>
            <Icon name="MoreHorizontal" size={16} className="text-[#3a5570]" />
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00f5ff]" /><span className="font-mono text-[10px] text-[#5a7a95]">Новые заявки</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00ff88]" /><span className="font-mono text-[10px] text-[#5a7a95]">Одобренные</span></div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData.length > 0 ? chartData.map(r => ({ month: r.month, new: r.new_total, approved: r.approved_total })) : [{ month: "—", new: 0, approved: 0 }]}>
              <defs>
                <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} /><stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOld" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} /><stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#3a5570", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#3a5570", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1b2e", border: "1px solid rgba(0,245,255,0.2)", borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: "#fff" }} />
              <Area type="monotone" dataKey="new" stroke="#00f5ff" strokeWidth={2} fill="url(#gradNew)" name="Заявки" />
              <Area type="monotone" dataKey="approved" stroke="#00ff88" strokeWidth={2} fill="url(#gradOld)" name="Одобрено" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            {[
              { label: "Всего", value: stats?.total ?? 0 },
              { label: "Одобрено", value: stats?.approved ?? 0 },
              { label: "Ожидают", value: stats?.pending ?? 0 },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-orbitron text-lg font-black text-white">{s.value}</div>
                <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <div className="p-5" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 8 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-orbitron text-sm font-bold text-white">По ролям</div>
            <Icon name="MoreHorizontal" size={16} className="text-[#3a5570]" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <PieChart width={140} height={140}>
                <Pie data={pieChartData} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                  {pieChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i] || "#1a2a3a"} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-orbitron text-lg font-black text-white">{stats?.total ?? "—"}</div>
                <div className="font-mono text-[9px] text-[#3a5570]">ВСЕГО</div>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            {pieChartData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] || "#1a2a3a" }} />
                  <span className="font-plex text-xs text-[#7a9bb5] capitalize">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((item.value / (stats?.total || 1)) * 100)}%`, background: PIE_COLORS[i] || "#1a2a3a" }} />
                  </div>
                  <span className="font-mono text-[10px] text-[#5a7a95] w-6 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Circle progress */}
      <div className="flex flex-col md:flex-row gap-4">
        <CircleProgress pct={Math.round(((stats?.approved ?? 0) / total) * 100)} color="#00f5ff" label="Одобрено" sub="от общего состава" />
        <CircleProgress pct={Math.round(((stats?.pending ?? 0) / total) * 100)} color="#ff6b00" label="Ожидают допуска" sub="на рассмотрении" />
        <CircleProgress pct={Math.round(((stats?.admins ?? 0) / total) * 100)} color="#a855f7" label="Администраторы" sub="от общего состава" />
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-4 p-4" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.2)", borderRadius: 8 }}>
          <Icon name="AlertCircle" size={18} className="text-[#ff6b00] flex-shrink-0" />
          <div className="flex-1 font-plex text-sm text-[#8aacbf]">
            <span className="font-bold text-white">{pendingCount}</span> {pendingCount === 1 ? "заявка ожидает" : "заявок ожидают"} рассмотрения
          </div>
          <button
            onClick={onGoToUsers}
            className="flex items-center gap-2 font-mono text-xs px-4 py-2 transition-all flex-shrink-0"
            style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.08)", borderRadius: 4 }}
          >
            <Icon name="ArrowRight" size={12} />РАССМОТРЕТЬ
          </button>
        </div>
      )}

      {/* Top content */}
      {topContent.length > 0 && (
        <div className="p-5" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(0,245,255,0.1)", borderRadius: 8 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-orbitron text-sm font-bold text-white">Топ материалов</div>
            <button onClick={() => onNavigate("content")} className="font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors">все →</button>
          </div>
          <div className="space-y-2">
            {topContent.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-[#2a4060] w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-plex text-xs text-white truncate">{item.title}</div>
                  <div className="font-mono text-[9px] text-[#3a5570]">{item.category || item.file_type}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.views / (topContent[0]?.views || 1)) * 100)}%`, background: "#00f5ff" }} />
                  </div>
                  <span className="font-mono text-[9px] text-[#3a5570] w-6 text-right">{item.views}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick notification */}
      <div className="p-4 space-y-3" style={{ background: "rgba(13,27,46,0.8)", border: "1px solid rgba(168,85,247,0.15)" }}>
        <div className="flex items-center gap-2">
          <Icon name="Bell" size={14} className="text-[#a855f7]" />
          <span className="font-mono text-xs text-[#a855f7] tracking-wider">БЫСТРОЕ УВЕДОМЛЕНИЕ</span>
        </div>
        <div className="flex gap-2">
          <input
            value={notifTitle}
            onChange={e => setNotifTitle(e.target.value)}
            placeholder="Текст уведомления всем пользователям..."
            className="flex-1 bg-transparent px-3 py-2 font-plex text-sm text-white outline-none"
            style={{ border: "1px solid rgba(168,85,247,0.2)" }}
            onKeyDown={e => e.key === "Enter" && sendNotif()}
          />
          <button
            onClick={sendNotif}
            disabled={notifSending || !notifTitle.trim()}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs transition-all disabled:opacity-40"
            style={{ border: "1px solid rgba(168,85,247,0.4)", color: notifSent ? "#00ff88" : "#a855f7", background: "rgba(168,85,247,0.06)" }}
          >
            <Icon name={notifSent ? "Check" : "Send"} size={13} />
            {notifSent ? "ОТПРАВЛЕНО" : notifSending ? "..." : "ОТПРАВИТЬ"}
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { tab: "content" as Tab, icon: "Layers", label: "Все материалы", color: "#00f5ff", desc: `${stats?.files ?? 0} файлов` },
          { tab: "discussions" as Tab, icon: "MessageSquare", label: "Обсуждения", color: "#00ff88", desc: `${stats?.topics ?? 0} тем` },
          { tab: "support" as Tab, icon: "Headphones", label: "Поддержка", color: "#a855f7", desc: "Тикеты" },
          { tab: "audit" as Tab, icon: "ClipboardList", label: "Журнал", color: "#ff6b00", desc: "Действия" },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            className="flex flex-col gap-2 p-4 text-left transition-all hover:scale-[1.02]"
            style={{ background: "rgba(13,27,46,0.8)", border: `1px solid ${item.color}20` }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${item.color}40`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = `${item.color}20`)}
          >
            <Icon name={item.icon as "Layers"} size={18} style={{ color: item.color }} />
            <div>
              <div className="font-mono text-xs text-white">{item.label}</div>
              <div className="font-mono text-[10px] text-[#3a5570]">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
