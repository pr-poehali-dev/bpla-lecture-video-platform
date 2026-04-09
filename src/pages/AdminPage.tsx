import { useState, useEffect } from "react";
import { api } from "@/api";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersTab, { User } from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminRemovalTab from "@/components/admin/AdminRemovalTab";
import AdminDiscussionsTab from "@/components/admin/AdminDiscussionsTab";
import AdminLecturesTab from "@/components/admin/AdminLecturesTab";
import Icon from "@/components/ui/icon";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

type Tab = "dashboard" | "users" | "roles" | "files" | "removals" | "discussions" | "lectures";

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

const tabLabels: Record<Tab, string> = {
  dashboard: "Панель управления",
  users: "Личный состав",
  roles: "Доступы",
  files: "Файлы",
  removals: "Заявки на удаление",
  discussions: "Обсуждения",
  lectures: "Лекции",
};

const sidebarGroups = [
  {
    label: "ОСНОВНОЕ",
    items: [{ key: "dashboard" as Tab, label: "Dashboard", icon: "LayoutDashboard" }],
  },
  {
    label: "УПРАВЛЕНИЕ",
    items: [
      { key: "users" as Tab, label: "Личный состав", icon: "Users" },
      { key: "roles" as Tab, label: "Доступы", icon: "Shield" },
      { key: "removals" as Tab, label: "Заявки", icon: "Trash2" },
    ],
  },
  {
    label: "КОНТЕНТ",
    items: [
      { key: "lectures" as Tab, label: "Лекции", icon: "BookOpen" },
      { key: "files" as Tab, label: "Файлы (видео)", icon: "Upload" },
      { key: "discussions" as Tab, label: "Обсуждения", icon: "MessageSquare" },
    ],
  },
];

const trafficData = [
  { month: "Янв", new: 4, old: 2 }, { month: "Фев", new: 7, old: 3 },
  { month: "Мар", new: 13, old: 5 }, { month: "Апр", new: 9, old: 6 },
  { month: "Май", new: 11, old: 4 }, { month: "Июн", new: 8, old: 7 },
  { month: "Июл", new: 14, old: 5 }, { month: "Авг", new: 10, old: 8 },
  { month: "Сен", new: 6, old: 3 },
];

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

export default function AdminPage({ currentUser, onLogout, onGoToSite }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [removalPendingCount, setRemovalPendingCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadUsers = async () => { setLoading(true); const res = await api.admin.users(); if (res.users) setUsers(res.users); setLoading(false); };
  const loadStats = async () => { const res = await api.admin.stats(); if (res.total !== undefined) setStats(res as Stats); };
  useEffect(() => { loadUsers(); loadStats(); }, []);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };
  const approve = async (id: number) => { const res = await api.admin.approve(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const reject = async (id: number) => { const res = await api.admin.reject(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const makeAdmin = async (id: number) => { const res = await api.admin.makeAdmin(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const removeAdmin = async (id: number) => { const res = await api.admin.removeAdmin(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const setRole = async (id: number, role: string) => { const res = await api.admin.setRole(id, role); if (res.message) { showMsg(res.message); loadUsers(); } };
  const deleteUser = async (id: number) => { const res = await api.admin.deleteUser(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };

  const pendingCount = users.filter(u => u.status === "pending").length;
  const total = stats?.total || 1;

  const pieChartData = stats?.by_role && Object.keys(stats.by_role).length > 0
    ? Object.entries(stats.by_role).map(([name, value], i) => ({ name, value, color: PIE_COLORS[i] || "#00f5ff" }))
    : [{ name: "Нет данных", value: 1, color: "#1a2a3a" }];

  return (
    <div className="min-h-screen flex" style={{ background: "#07111f" }}>

      {/* ===== SIDEBAR ===== */}
      <aside className="flex-shrink-0 flex flex-col transition-all duration-300"
        style={{ width: sidebarCollapsed ? 56 : 220, background: "linear-gradient(180deg, #0d1b2e 0%, #081424 100%)", borderRight: "1px solid rgba(0,245,255,0.08)", minHeight: "100vh" }}>

        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={onGoToSite}>
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid #00f5ff", boxShadow: "0 0 8px rgba(0,245,255,0.3)" }}>
                <Icon name="Crosshair" size={13} className="text-[#00f5ff]" />
              </div>
              <div>
                <div className="font-orbitron text-[10px] font-bold leading-none tracking-[0.15em] text-[#00f5ff]">БПС</div>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-7 h-7 flex items-center justify-center text-[#3a5570] hover:text-[#00f5ff] transition-colors ml-auto flex-shrink-0">
            <Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size={15} />
          </button>
        </div>

        {/* Groups */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-1">
              {!sidebarCollapsed && (
                <div className="px-4 py-1.5 font-mono text-[9px] tracking-[0.3em]" style={{ color: "#2a4060" }}>{group.label}</div>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.key;
                const badge = item.key === "users" ? pendingCount : item.key === "removals" ? removalPendingCount : 0;
                return (
                  <button key={item.key} onClick={() => setActiveTab(item.key)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className="flex items-center gap-3 w-full transition-all"
                    style={{
                      padding: sidebarCollapsed ? "10px 0" : "9px 16px",
                      justifyContent: sidebarCollapsed ? "center" : "flex-start",
                      color: isActive ? "#00f5ff" : "#5a7a95",
                      background: isActive ? "rgba(0,245,255,0.08)" : "transparent",
                      borderLeft: isActive ? "2px solid #00f5ff" : "2px solid transparent",
                    }}>
                    <Icon name={item.icon as "Users"} size={15} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-plex text-sm flex-1 text-left">{item.label}</span>
                        {badge > 0 && (
                          <span className="font-mono text-[9px] px-1.5 py-0.5 font-bold rounded-full flex-shrink-0"
                            style={{ background: item.key === "removals" ? "#ff2244" : "#ff6b00", color: "#fff" }}>
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(0,245,255,0.06)" }}>
            <button onClick={onGoToSite} className="flex items-center gap-2 w-full font-plex text-xs text-[#5a7a95] hover:text-[#00f5ff] transition-colors">
              <Icon name="Globe" size={13} />На сайт
            </button>
          </div>
        )}
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader currentUser={currentUser} onLogout={onLogout} onGoToSite={onGoToSite}
          onNavigate={(t) => setActiveTab(t as Tab)} pendingCount={pendingCount} />

        <main className="flex-1 overflow-auto p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => setActiveTab("dashboard")} className="font-mono text-[11px] text-[#00f5ff] hover:text-white transition-colors">Dashboard</button>
            {activeTab !== "dashboard" && (<><span className="font-mono text-[11px] text-[#2a4060]">/</span><span className="font-mono text-[11px] text-[#5a7a95]">{tabLabels[activeTab]}</span></>)}
          </div>

          {msg && (
            <div className="mb-5 p-3 font-mono text-xs text-[#00ff88] flex items-center gap-2 animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 6 }}>
              <Icon name="CheckCircle" size={14} />{msg}
            </div>
          )}

          {/* ===== DASHBOARD ===== */}
          {activeTab === "dashboard" && (
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
                    <AreaChart data={trafficData}>
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
                      <Area type="monotone" dataKey="new" stroke="#00f5ff" strokeWidth={2} fill="url(#gradNew)" />
                      <Area type="monotone" dataKey="old" stroke="#00ff88" strokeWidth={2} fill="url(#gradOld)" />
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
                  <button onClick={() => { setActiveTab("users"); setFilter("pending"); }}
                    className="flex items-center gap-2 font-mono text-xs px-4 py-2 transition-all flex-shrink-0"
                    style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.08)", borderRadius: 4 }}>
                    <Icon name="ArrowRight" size={12} />РАССМОТРЕТЬ
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <AdminUsersTab users={users} loading={loading} filter={filter} setFilter={setFilter} msg=""
              onApprove={approve} onReject={reject} onMakeAdmin={makeAdmin} onRemoveAdmin={removeAdmin} onSetRole={setRole} onDeleteUser={deleteUser} />
          )}
          {activeTab === "roles" && <AdminRolesTab />}
          {activeTab === "files" && <AdminFilesTab />}
          {activeTab === "lectures" && <AdminLecturesTab />}
          {activeTab === "removals" && <AdminRemovalTab onPendingCount={setRemovalPendingCount} />}
          {activeTab === "discussions" && <AdminDiscussionsTab />}
        </main>
      </div>
    </div>
  );
}