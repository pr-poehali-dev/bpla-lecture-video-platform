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

const sidebarItems: { key: Tab; label: string; icon: string }[] = [
  { key: "dashboard", label: "Панель управления", icon: "LayoutDashboard" },
  { key: "users", label: "Личный состав", icon: "Users" },
  { key: "roles", label: "Доступы", icon: "Shield" },
  { key: "files", label: "Файлы", icon: "Upload" },
  { key: "removals", label: "Заявки на удаление", icon: "Trash2" },
];

const tabLabels: Record<Tab, string> = {
  dashboard: "Панель управления",
  users: "Личный состав",
  roles: "Доступы",
  files: "Файлы",
  removals: "Заявки на удаление",
};

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

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col grid-bg" style={{ background: "#050810" }}>
      <AdminHeader currentUser={currentUser} onLogout={onLogout} onGoToSite={onGoToSite} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "rgba(5,8,16,0.95)", borderRight: "1px solid rgba(0,245,255,0.1)", minHeight: "calc(100vh - 56px)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)" }}>
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#3a5570]">// УПРАВЛЕНИЕ</span>
          </div>

          <nav className="flex flex-col py-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className="flex items-center gap-3 px-4 py-2.5 font-mono text-xs tracking-wider text-left transition-all"
                style={{
                  color: activeTab === item.key ? "#00f5ff" : "#5a7a95",
                  background: activeTab === item.key ? "rgba(0,245,255,0.06)" : "transparent",
                  borderLeft: activeTab === item.key ? "2px solid #00f5ff" : "2px solid transparent",
                }}
              >
                <Icon name={item.icon as "Users"} size={14} />
                {item.label.toUpperCase()}
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
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {/* Breadcrumbs */}
          <div className="px-6 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)", background: "rgba(0,245,255,0.02)" }}>
            <button onClick={() => setActiveTab("dashboard")} className="font-mono text-xs text-[#00f5ff] hover:text-white transition-colors">ГЛАВНАЯ</button>
            <span className="font-mono text-xs text-[#1a2a3a]">/</span>
            <span className="font-mono text-xs text-[#5a7a95]">{tabLabels[activeTab].toUpperCase()}</span>
          </div>

          <div className="px-6 py-6">
            {/* Page title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-px bg-[#00f5ff]" />
              <h1 className="font-orbitron text-2xl font-black text-white tracking-wider">{tabLabels[activeTab].toUpperCase()}</h1>
            </div>

            {/* Global msg */}
            {msg && (
              <div className="mb-5 p-3 font-mono text-xs text-[#00ff88] flex items-center gap-2 animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
                <Icon name="CheckCircle" size={14} />
                {msg}
              </div>
            )}

            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "ВСЕГО БОЙЦОВ", value: stats?.total ?? "—", color: "#00f5ff", icon: "Users" },
                    { label: "ОЖИДАЮТ ДОПУСКА", value: stats?.pending ?? "—", color: "#ff6b00", icon: "Clock" },
                    { label: "ДОПУЩЕНЫ", value: stats?.approved ?? "—", color: "#00ff88", icon: "UserCheck" },
                    { label: "АДМИНИСТРАТОРЫ", value: stats?.admins ?? "—", color: "#ff6b00", icon: "Shield" },
                  ].map(s => (
                    <div key={s.label} className="card-drone p-5 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Icon name={s.icon as "Users"} size={16} style={{ color: s.color }} />
                        <div className="font-orbitron text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      </div>
                      <div className="font-mono text-[10px] text-[#3a5570] tracking-wider">{s.label}</div>
                    </div>
                  ))}
                </div>

                {stats?.by_role && Object.keys(stats.by_role).length > 0 && (
                  <div className="card-drone p-5 mb-5">
                    <div className="font-mono text-xs text-[#3a5570] tracking-wider mb-4">СОСТАВ ПО КАТЕГОРИЯМ</div>
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

                {pendingCount > 0 && (
                  <div className="card-drone p-5 mb-5" style={{ borderColor: "rgba(255,107,0,0.3)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon name="AlertCircle" size={16} className="text-[#ff6b00]" />
                      <span className="font-mono text-xs text-[#ff6b00] tracking-wider">ТРЕБУЕТ ВНИМАНИЯ</span>
                    </div>
                    <p className="font-plex text-sm text-[#8aacbf] mb-4">
                      <span className="font-bold text-white">{pendingCount}</span> {pendingCount === 1 ? "заявка ожидает" : "заявок ожидают"} рассмотрения
                    </p>
                    <button
                      onClick={() => { setActiveTab("users"); setFilter("pending"); }}
                      className="flex items-center gap-2 font-mono text-xs px-4 py-2 transition-all"
                      style={{ border: "1px solid rgba(255,107,0,0.4)", color: "#ff6b00", background: "rgba(255,107,0,0.05)" }}
                    >
                      <Icon name="ArrowRight" size={13} />
                      РАССМОТРЕТЬ ЗАЯВКИ
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sidebarItems.slice(1).map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className="card-drone p-5 text-left group transition-all hover:border-[rgba(0,245,255,0.3)]"
                    >
                      <Icon name={item.icon as "Users"} size={20} className="text-[#3a5570] group-hover:text-[#00f5ff] transition-colors mb-3" />
                      <div className="font-mono text-xs text-[#5a7a95] group-hover:text-[#00f5ff] tracking-wider transition-colors">{item.label.toUpperCase()}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <AdminUsersTab
                users={users}
                loading={loading}
                filter={filter}
                setFilter={setFilter}
                msg=""
                onApprove={approve}
                onReject={reject}
                onMakeAdmin={makeAdmin}
                onRemoveAdmin={removeAdmin}
                onSetRole={setRole}
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