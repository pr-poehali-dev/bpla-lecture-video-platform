import { useState, useEffect } from "react";
import { api } from "@/api";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersTab, { User } from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminRemovalTab from "@/components/admin/AdminRemovalTab";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

type Tab = "dashboard" | "users" | "roles" | "files" | "removals";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  admins: number;
  by_role: Record<string, number>;
}

const tabLabels: Record<Tab, string> = {
  dashboard: "Панель управления",
  users: "Личный состав",
  roles: "Доступы",
  files: "Файлы",
  removals: "Заявки на удаление",
};

const tabIcons: Record<Tab, string> = {
  dashboard: "LayoutDashboard",
  users: "Users",
  roles: "Shield",
  files: "Upload",
  removals: "Trash2",
};

// Сайдбар с группами как в Joomla
const sidebarGroups = [
  {
    label: "СОСТАВ",
    items: [
      { key: "users" as Tab, label: "Личный состав", icon: "Users" },
      { key: "roles" as Tab, label: "Доступы", icon: "Shield" },
    ],
  },
  {
    label: "МАТЕРИАЛЫ",
    items: [
      { key: "files" as Tab, label: "Файлы", icon: "Upload" },
    ],
  },
  {
    label: "ЗАЯВКИ",
    items: [
      { key: "removals" as Tab, label: "На удаление", icon: "Trash2" },
    ],
  },
];

// Плитки быстрых действий на dashboard
const quickTiles = [
  { key: "users" as Tab, label: "Личный состав", icon: "Users", color: "#00f5ff", desc: "Управление бойцами" },
  { key: "roles" as Tab, label: "Доступы", icon: "Shield", color: "#00ff88", desc: "Роли и права" },
  { key: "files" as Tab, label: "Файлы", icon: "Upload", color: "#ff6b00", desc: "Загрузка материалов" },
  { key: "removals" as Tab, label: "Заявки", icon: "Trash2", color: "#ff2244", desc: "На удаление" },
];

export default function AdminPage({ currentUser, onLogout, onGoToSite }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [removalPendingCount, setRemovalPendingCount] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.admin.users();
    if (res.users) setUsers(res.users);
    setLoading(false);
  };

  const loadStats = async () => {
    const res = await api.admin.stats();
    if (res.total !== undefined) setStats(res as Stats);
  };

  useEffect(() => { loadUsers(); loadStats(); }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  };

  const approve = async (id: number) => {
    const res = await api.admin.approve(id);
    if (res.message) { showMsg(res.message); loadUsers(); loadStats(); }
  };
  const reject = async (id: number) => {
    const res = await api.admin.reject(id);
    if (res.message) { showMsg(res.message); loadUsers(); loadStats(); }
  };
  const makeAdmin = async (id: number) => {
    const res = await api.admin.makeAdmin(id);
    if (res.message) { showMsg(res.message); loadUsers(); loadStats(); }
  };
  const removeAdmin = async (id: number) => {
    const res = await api.admin.removeAdmin(id);
    if (res.message) { showMsg(res.message); loadUsers(); loadStats(); }
  };
  const setRole = async (id: number, role: string) => {
    const res = await api.admin.setRole(id, role);
    if (res.message) { showMsg(res.message); loadUsers(); }
  };

  const pendingCount = users.filter(u => u.status === "pending").length;

  const navigate = (tab: string) => setActiveTab(tab as Tab);

  return (
    <div className="min-h-screen flex flex-col grid-bg" style={{ background: "#050810" }}>
      <AdminHeader
        currentUser={currentUser}
        onLogout={onLogout}
        onGoToSite={onGoToSite}
        onNavigate={navigate}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — группы как в Joomla */}
        <aside className="w-52 flex-shrink-0 flex flex-col" style={{ background: "rgba(5,8,16,0.97)", borderRight: "1px solid rgba(0,245,255,0.1)", minHeight: "calc(100vh - 88px)" }}>

          {/* Dashboard link */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-2.5 px-4 py-3 font-mono text-xs tracking-wider transition-all w-full"
            style={{
              color: activeTab === "dashboard" ? "#00f5ff" : "#7a9bb5",
              background: activeTab === "dashboard" ? "rgba(0,245,255,0.07)" : "transparent",
              borderLeft: activeTab === "dashboard" ? "2px solid #00f5ff" : "2px solid transparent",
              borderBottom: "1px solid rgba(0,245,255,0.06)",
            }}
          >
            <Icon name="LayoutDashboard" size={14} />
            ПАНЕЛЬ УПРАВЛЕНИЯ
          </button>

          {/* Groups */}
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <div className="px-4 py-2 font-mono text-[9px] tracking-[0.3em]" style={{ color: "#2a4060", borderBottom: "1px solid rgba(0,245,255,0.04)" }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 font-mono text-xs tracking-wider transition-all"
                  style={{
                    color: activeTab === item.key ? "#00f5ff" : "#5a7a95",
                    background: activeTab === item.key ? "rgba(0,245,255,0.06)" : "transparent",
                    borderLeft: activeTab === item.key ? "2px solid #00f5ff" : "2px solid transparent",
                  }}
                >
                  <Icon name={item.icon as "Users"} size={13} />
                  {item.label}
                  {item.key === "users" && pendingCount > 0 && (
                    <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 font-bold" style={{ background: "#ff6b00", color: "#fff" }}>
                      {pendingCount}
                    </span>
                  )}
                  {item.key === "removals" && removalPendingCount > 0 && (
                    <span className="ml-auto font-mono text-[9px] px-1.5 py-0.5 font-bold" style={{ background: "#ff2244", color: "#fff" }}>
                      {removalPendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-6 py-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.07)", background: "rgba(0,245,255,0.015)" }}>
            <Icon name="Home" size={11} className="text-[#3a5570]" />
            <button onClick={() => setActiveTab("dashboard")} className="font-mono text-[10px] text-[#00f5ff] hover:text-white transition-colors tracking-wider">
              ПАНЕЛЬ УПРАВЛЕНИЯ
            </button>
            {activeTab !== "dashboard" && (
              <>
                <span className="font-mono text-[10px] text-[#1a2a3a]">/</span>
                <span className="font-mono text-[10px] text-[#5a7a95] tracking-wider">{tabLabels[activeTab].toUpperCase()}</span>
              </>
            )}
          </div>

          <div className="px-6 py-6">
            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center flex-shrink-0" style={{ border: "1px solid rgba(0,245,255,0.3)", background: "rgba(0,245,255,0.05)" }}>
                <Icon name={tabIcons[activeTab] as "Users"} size={16} className="text-[#00f5ff]" />
              </div>
              <h1 className="font-orbitron text-xl font-black text-white tracking-wider">{tabLabels[activeTab].toUpperCase()}</h1>
            </div>

            {/* Msg */}
            {msg && (
              <div className="mb-5 p-3 font-mono text-xs text-[#00ff88] flex items-center gap-2 animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
                <Icon name="CheckCircle" size={14} />
                {msg}
              </div>
            )}

            {/* ===== DASHBOARD ===== */}
            {activeTab === "dashboard" && (
              <div>
                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "ВСЕГО БОЙЦОВ", value: stats?.total ?? "—", color: "#00f5ff", icon: "Users" },
                    { label: "ОЖИДАЮТ ДОПУСКА", value: stats?.pending ?? "—", color: "#ff6b00", icon: "Clock" },
                    { label: "ДОПУЩЕНЫ", value: stats?.approved ?? "—", color: "#00ff88", icon: "UserCheck" },
                    { label: "АДМИНИСТРАТОРЫ", value: stats?.admins ?? "—", color: "#a855f7", icon: "Shield" },
                  ].map(s => (
                    <div key={s.label} className="card-drone p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Icon name={s.icon as "Users"} size={15} style={{ color: s.color }} />
                        <div className="font-orbitron text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      </div>
                      <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Плитки быстрых действий — как в Joomla */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-px bg-[#00f5ff]" />
                    <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.3em]">// БЫСТРЫЕ ДЕЙСТВИЯ</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickTiles.map((tile, i) => (
                      <button
                        key={tile.key}
                        onClick={() => setActiveTab(tile.key)}
                        className="card-drone p-6 flex flex-col items-center gap-3 group transition-all animate-fade-in hover:scale-[1.02]"
                        style={{ animationDelay: `${i * 0.06}s`, borderColor: "rgba(0,245,255,0.1)" }}
                      >
                        <div
                          className="w-14 h-14 flex items-center justify-center transition-all group-hover:scale-110"
                          style={{ background: `${tile.color}10`, border: `1px solid ${tile.color}30` }}
                        >
                          <Icon name={tile.icon as "Users"} size={28} style={{ color: tile.color }} />
                        </div>
                        <div className="text-center">
                          <div className="font-orbitron text-xs font-bold text-white tracking-wider mb-0.5 group-hover:text-[#00f5ff] transition-colors">{tile.label}</div>
                          <div className="font-mono text-[10px] text-[#3a5570]">{tile.desc}</div>
                        </div>
                        {tile.key === "users" && pendingCount > 0 && (
                          <span className="font-mono text-[9px] px-2 py-0.5 font-bold" style={{ background: "#ff6b00", color: "#fff" }}>
                            {pendingCount} ОЖИДАЮТ
                          </span>
                        )}
                        {tile.key === "removals" && removalPendingCount > 0 && (
                          <span className="font-mono text-[9px] px-2 py-0.5 font-bold" style={{ background: "#ff2244", color: "#fff" }}>
                            {removalPendingCount} НОВЫХ
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* By role */}
                {stats?.by_role && Object.keys(stats.by_role).length > 0 && (
                  <div className="card-drone p-5 mb-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-px bg-[#00f5ff]" />
                      <span className="font-mono text-[10px] text-[#3a5570] tracking-[0.3em]">// СОСТАВ ПО КАТЕГОРИЯМ</span>
                    </div>
                    <div className="flex flex-wrap gap-6">
                      {Object.entries(stats.by_role).map(([role, cnt]) => (
                        <div key={role} className="flex items-center gap-3">
                          <div className="font-orbitron text-2xl font-black" style={{ color: role === "инструктор" ? "#00ff88" : role === "администратор" ? "#ff6b00" : "#00f5ff" }}>{cnt}</div>
                          <div className="font-mono text-xs text-[#5a7a95]">{role.toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alert */}
                {pendingCount > 0 && (
                  <div className="card-drone p-4 flex items-center gap-4" style={{ borderColor: "rgba(255,107,0,0.3)" }}>
                    <Icon name="AlertCircle" size={18} className="text-[#ff6b00] flex-shrink-0" />
                    <div className="flex-1 font-plex text-sm text-[#8aacbf]">
                      <span className="font-bold text-white">{pendingCount}</span> {pendingCount === 1 ? "заявка ожидает" : "заявок ожидают"} рассмотрения
                    </div>
                    <button
                      onClick={() => { setActiveTab("users"); setFilter("pending"); }}
                      className="flex items-center gap-2 font-mono text-xs px-4 py-2 transition-all flex-shrink-0"
                      style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}
                    >
                      <Icon name="ArrowRight" size={12} />
                      РАССМОТРЕТЬ
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <AdminUsersTab
                users={users} loading={loading} filter={filter} setFilter={setFilter} msg=""
                onApprove={approve} onReject={reject} onMakeAdmin={makeAdmin} onRemoveAdmin={removeAdmin} onSetRole={setRole}
              />
            )}
            {activeTab === "roles" && <AdminRolesTab />}
            {activeTab === "files" && <AdminFilesTab />}
            {activeTab === "removals" && <AdminRemovalTab onPendingCount={setRemovalPendingCount} />}
          </div>
        </main>
      </div>
    </div>
  );
}
