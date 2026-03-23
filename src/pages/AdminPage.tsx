import { useState, useEffect } from "react";
import { api } from "@/api";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersTab, { User } from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

type Tab = "dashboard" | "users" | "roles" | "files";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  admins: number;
  by_role: Record<string, number>;
}

export default function AdminPage({ currentUser, onLogout, onGoToSite }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "ОБЗОР", icon: "LayoutDashboard" },
    { key: "users", label: "ЛИЧНЫЙ СОСТАВ", icon: "Users" },
    { key: "roles", label: "ДОСТУПЫ", icon: "Shield" },
    { key: "files", label: "ФАЙЛЫ", icon: "Upload" },
  ];

  return (
    <div className="min-h-screen grid-bg" style={{ background: "#050810" }}>
      <AdminHeader currentUser={currentUser} onLogout={onLogout} onGoToSite={onGoToSite} />

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Global msg */}
        {msg && (
          <div className="mb-5 p-3 font-plex text-sm text-[#00ff88] animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)" }}>
            ✓ {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 font-mono text-xs px-4 py-2.5 tracking-wider transition-all whitespace-nowrap relative"
              style={{
                border: `1px solid ${activeTab === tab.key ? "#00f5ff" : "#1a2a3a"}`,
                color: activeTab === tab.key ? "#050810" : "#3a5570",
                background: activeTab === tab.key ? "#00f5ff" : "transparent",
              }}
            >
              <Icon name={tab.icon as "LayoutDashboard"} size={13} />
              {tab.label}
              {tab.key === "users" && pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "#ff6b00", color: "#fff", marginLeft: 2 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-6 h-px bg-[#00f5ff]" />
                <span className="font-mono text-xs text-[#00f5ff] tracking-[0.2em]">// ЦЕНТР УПРАВЛЕНИЯ</span>
              </div>
              <h1 className="font-orbitron text-2xl font-black text-white tracking-wider">ПАНЕЛЬ АДМИНИСТРАТОРА</h1>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

            {/* By role */}
            {stats?.by_role && Object.keys(stats.by_role).length > 0 && (
              <div className="card-drone p-5 mb-8">
                <div className="font-mono text-xs text-[#3a5570] tracking-wider mb-4">СОСТАВ ПО КАТЕГОРИЯМ</div>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(stats.by_role).map(([role, cnt]) => (
                    <div key={role} className="flex items-center gap-3">
                      <div className="font-orbitron text-xl font-black" style={{ color: role === "инструктор" ? "#00ff88" : role === "администратор" ? "#ff6b00" : "#00f5ff" }}>{cnt}</div>
                      <div className="font-mono text-xs text-[#5a7a95]">{role.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            {pendingCount > 0 && (
              <div className="card-drone p-5 mb-6" style={{ borderColor: "rgba(255,107,0,0.3)" }}>
                <div className="flex items-center gap-3 mb-4">
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

            {/* Quick nav */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { tab: "users" as Tab, title: "Личный состав", desc: "Управление пользователями, одобрение заявок, назначение ролей", icon: "Users", color: "#00f5ff" },
                { tab: "roles" as Tab, title: "Матрица доступа", desc: "Настройка прав доступа к разделам для курсантов и инструкторов", icon: "Shield", color: "#00ff88" },
                { tab: "files" as Tab, title: "Файлы и медиа", desc: "Загрузка материалов, видео, документов и прошивок", icon: "Upload", color: "#a78bfa" },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  className="card-drone p-5 text-left transition-all hover:opacity-90 group"
                  style={{ borderColor: `${item.color}22` }}
                >
                  <Icon name={item.icon as "Users"} size={20} style={{ color: item.color }} className="mb-3" />
                  <div className="font-orbitron text-sm font-bold text-white tracking-wider mb-1 group-hover:text-[#00f5ff] transition-colors">{item.title}</div>
                  <div className="font-mono text-[10px] text-[#3a5570] leading-relaxed">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
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

        {/* Roles */}
        {activeTab === "roles" && <AdminRolesTab />}

        {/* Files */}
        {activeTab === "files" && <AdminFilesTab isAdmin={true} />}
      </div>
    </div>
  );
}