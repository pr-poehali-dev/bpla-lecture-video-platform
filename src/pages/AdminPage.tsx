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
    <div className="min-h-screen flex flex-col" style={{ background: "#f0f2f5", fontFamily: "sans-serif" }}>
      <AdminHeader currentUser={currentUser} onLogout={onLogout} onGoToSite={onGoToSite} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#2c3e50", minHeight: "calc(100vh - 48px)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #3a4f63" }}>
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "#7a9bb5" }}>Основное меню</span>
          </div>

          <nav className="flex flex-col py-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-all relative"
                style={{
                  color: activeTab === item.key ? "#fff" : "#a0b8cc",
                  background: activeTab === item.key ? "rgba(0,0,0,0.2)" : "transparent",
                  borderLeft: activeTab === item.key ? "3px solid #00aaff" : "3px solid transparent",
                }}
              >
                <Icon name={item.icon as "Users"} size={16} />
                {item.label}
                {item.key === "users" && pendingCount > 0 && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#ff6b00", color: "#fff" }}>
                    {pendingCount}
                  </span>
                )}
                {item.key === "removals" && removalPendingCount > 0 && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: "#cc2244", color: "#fff" }}>
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
          <div className="px-6 py-2.5 flex items-center gap-2 text-sm" style={{ background: "#fff", borderBottom: "1px solid #dde3ea" }}>
            <button onClick={() => setActiveTab("dashboard")} className="text-[#3a7bd5] hover:underline">Главная</button>
            <span style={{ color: "#aaa" }}>/</span>
            <span style={{ color: "#555" }}>{tabLabels[activeTab]}</span>
          </div>

          <div className="px-6 py-6">
            {/* Page title */}
            <h1 className="text-2xl font-normal mb-5" style={{ color: "#2c3e50" }}>{tabLabels[activeTab]}</h1>

            {/* Global msg */}
            {msg && (
              <div className="mb-4 px-4 py-2.5 rounded text-sm flex items-center gap-2" style={{ background: "#d4edda", border: "1px solid #c3e6cb", color: "#155724" }}>
                <Icon name="CheckCircle" size={16} />
                {msg}
              </div>
            )}

            {/* Dashboard */}
            {activeTab === "dashboard" && (
              <div>
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Всего бойцов", value: stats?.total ?? "—", color: "#3a7bd5", icon: "Users", bg: "#e8f0fb" },
                    { label: "Ожидают допуска", value: stats?.pending ?? "—", color: "#e67e22", icon: "Clock", bg: "#fef3e2" },
                    { label: "Допущены", value: stats?.approved ?? "—", color: "#27ae60", icon: "UserCheck", bg: "#e9f7ef" },
                    { label: "Администраторы", value: stats?.admins ?? "—", color: "#8e44ad", icon: "Shield", bg: "#f4ecfb" },
                  ].map(s => (
                    <div key={s.label} className="rounded p-4 flex items-center gap-4" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                      <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                        <Icon name={s.icon as "Users"} size={20} style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs" style={{ color: "#7a8a9a" }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* By role */}
                {stats?.by_role && Object.keys(stats.by_role).length > 0 && (
                  <div className="rounded p-5 mb-5" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: "#555" }}>Состав по категориям</h3>
                    <div className="flex flex-wrap gap-6">
                      {Object.entries(stats.by_role).map(([role, cnt]) => (
                        <div key={role} className="flex items-center gap-2">
                          <span className="text-xl font-bold" style={{ color: role === "инструктор" ? "#27ae60" : role === "администратор" ? "#e67e22" : "#3a7bd5" }}>{cnt}</span>
                          <span className="text-sm capitalize" style={{ color: "#777" }}>{role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending alert */}
                {pendingCount > 0 && (
                  <div className="rounded p-4 flex items-center gap-4" style={{ background: "#fff8e1", border: "1px solid #ffe082" }}>
                    <Icon name="AlertCircle" size={20} className="text-[#f59e0b] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm" style={{ color: "#7a5800" }}>
                        <strong>{pendingCount}</strong> {pendingCount === 1 ? "заявка ожидает" : "заявок ожидают"} рассмотрения
                      </span>
                    </div>
                    <button
                      onClick={() => { setActiveTab("users"); setFilter("pending"); }}
                      className="text-sm px-3 py-1.5 rounded font-medium transition-all"
                      style={{ background: "#f59e0b", color: "#fff" }}
                    >
                      Рассмотреть
                    </button>
                  </div>
                )}

                {/* Quick nav */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                  {sidebarItems.slice(1).map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className="p-4 rounded text-left transition-all hover:shadow-md"
                      style={{ background: "#fff", border: "1px solid #dde3ea" }}
                    >
                      <Icon name={item.icon as "Users"} size={20} style={{ color: "#3a7bd5", marginBottom: 8 }} />
                      <div className="text-sm font-medium" style={{ color: "#2c3e50" }}>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Users tab */}
            {activeTab === "users" && (
              <div className="rounded" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
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
              </div>
            )}

            {/* Roles tab */}
            {activeTab === "roles" && (
              <div className="rounded" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <AdminRolesTab />
              </div>
            )}

            {/* Files tab */}
            {activeTab === "files" && (
              <div className="rounded" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <AdminFilesTab />
              </div>
            )}

            {/* Removals tab */}
            {activeTab === "removals" && (
              <div className="rounded" style={{ background: "#fff", border: "1px solid #dde3ea", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <AdminRemovalTab onPendingCount={setRemovalPendingCount} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
