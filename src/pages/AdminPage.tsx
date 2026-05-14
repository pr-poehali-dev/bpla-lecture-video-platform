import { useState, useEffect } from "react";
import { api } from "@/api";
import { User } from "@/components/admin/AdminUsersTab";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminTabContent from "@/components/admin/AdminTabContent";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string; callsign?: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

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

const tabLabels: Record<Tab, string> = {
  dashboard: "Панель управления",
  users: "Личный состав",
  roles: "Доступы",
  content: "Контент",
  files: "Загрузчик",
  removals: "Заявки на удаление",
  discussions: "Обсуждения",
  lectures: "Лекции",
  videos: "Видео",
  settings: "Настройки",
  pages: "Страницы",
  support: "Поддержка",
  quizzes: "Тесты",
  audit: "Журнал действий",
  drones: "Типы БпЛА",
};

export default function AdminPage({ currentUser, onLogout, onGoToSite }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [removalPendingCount, setRemovalPendingCount] = useState(0);
  const [supportPendingCount, setSupportPendingCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [topContent, setTopContent] = useState<TopItem[]>([]);

  const loadUsers = async () => { setLoading(true); const res = await api.admin.users(); if (res.users) setUsers(res.users); setLoading(false); };
  const loadStats = async () => { const res = await api.admin.stats(); if (res.total !== undefined) setStats(res as Stats); };
  const loadSupportCount = async () => {
    const res = await api.support.adminTickets("open").catch(() => ({}));
    setSupportPendingCount((res as { tickets?: unknown[] }).tickets?.length ?? 0);
  };
  const loadAnalytics = async () => {
    const [chartRes, topRes] = await Promise.all([
      api.admin.registrationsChart().catch(() => ({})),
      api.admin.topContent().catch(() => ({})),
    ]);
    if ((chartRes as { chart?: ChartRow[] }).chart) setChartData((chartRes as { chart: ChartRow[] }).chart);
    if ((topRes as { top?: TopItem[] }).top) setTopContent((topRes as { top: TopItem[] }).top);
  };
  useEffect(() => { loadUsers(); loadStats(); loadSupportCount(); loadAnalytics(); }, []);

  const showMsg = (text: string) => { setMsg(text); setTimeout(() => setMsg(""), 3500); };
  const approve = async (id: number) => { const res = await api.admin.approve(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const reject = async (id: number) => { const res = await api.admin.reject(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const makeAdmin = async (id: number) => { const res = await api.admin.makeAdmin(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const removeAdmin = async (id: number) => { const res = await api.admin.removeAdmin(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const setRole = async (id: number, role: string) => { const res = await api.admin.setRole(id, role); if (res.message) { showMsg(res.message); loadUsers(); } };
  const deleteUser = async (id: number) => { const res = await api.admin.deleteUser(id); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const blockUser = async (id: number, reason: string) => { const res = await api.admin.blockUser(id, reason); if (res.message) { showMsg(res.message); loadUsers(); } };
  const unblockUser = async (id: number) => { const res = await api.admin.unblockUser(id); if (res.message) { showMsg(res.message); loadUsers(); } };
  const resetPassword = async (id: number) => { return await api.admin.resetPassword(id); };
  const bulkApprove = async (ids: number[]) => { const res = await api.admin.bulkApprove(ids); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };
  const bulkReject = async (ids: number[]) => { const res = await api.admin.bulkReject(ids); if (res.message) { showMsg(res.message); loadUsers(); loadStats(); } };

  const pendingCount = users.filter(u => u.status === "pending").length;

  return (
    <div className="min-h-screen flex" style={{ background: "#07111f" }}>

      <AdminSidebar
        activeTab={activeTab}
        collapsed={sidebarCollapsed}
        pendingCount={pendingCount}
        removalPendingCount={removalPendingCount}
        supportPendingCount={supportPendingCount}
        onNavigate={setActiveTab}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        onGoToSite={onGoToSite}
      />

      {/* ===== MAIN ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="flex md:hidden items-center gap-3 px-4 h-14 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,245,255,0.08)", background: "#0d1b2e" }}>
          <button onClick={() => setSidebarCollapsed(false)} className="w-8 h-8 flex items-center justify-center text-[#5a7a95] hover:text-[#00f5ff] transition-colors">
            <Icon name="Menu" size={18} />
          </button>
          <span className="font-orbitron text-xs font-bold text-[#00f5ff] tracking-widest flex-1">{tabLabels[activeTab]}</span>
          <button onClick={onGoToSite} className="font-mono text-[10px] text-[#3a5570] hover:text-[#00f5ff] transition-colors">← Сайт</button>
        </div>

        <AdminHeader
          currentUser={currentUser}
          onLogout={onLogout}
          onGoToSite={onGoToSite}
          onNavigate={(t) => setActiveTab(t as Tab)}
          pendingCount={pendingCount}
        />

        <main className="flex-1 overflow-auto p-3 sm:p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-5">
            <button onClick={() => setActiveTab("dashboard")} className="font-mono text-[11px] text-[#00f5ff] hover:text-white transition-colors">Dashboard</button>
            {activeTab !== "dashboard" && (
              <>
                <span className="font-mono text-[11px] text-[#2a4060]">/</span>
                <span className="font-mono text-[11px] text-[#5a7a95]">{tabLabels[activeTab]}</span>
              </>
            )}
          </div>

          {msg && (
            <div className="mb-5 p-3 font-mono text-xs text-[#00ff88] flex items-center gap-2 animate-fade-in" style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 6 }}>
              <Icon name="CheckCircle" size={14} />{msg}
            </div>
          )}

          {activeTab === "dashboard" && (
            <AdminDashboard
              stats={stats}
              pendingCount={pendingCount}
              chartData={chartData}
              topContent={topContent}
              onNavigate={setActiveTab}
              onGoToUsers={() => { setActiveTab("users"); setFilter("pending"); }}
            />
          )}

          {activeTab !== "dashboard" && (
            <AdminTabContent
              activeTab={activeTab}
              users={users}
              loading={loading}
              filter={filter}
              setFilter={setFilter}
              onApprove={approve}
              onReject={reject}
              onMakeAdmin={makeAdmin}
              onRemoveAdmin={removeAdmin}
              onSetRole={setRole}
              onDeleteUser={deleteUser}
              onBlockUser={blockUser}
              onUnblockUser={unblockUser}
              onResetPassword={resetPassword}
              onBulkApprove={bulkApprove}
              onBulkReject={bulkReject}
              onRemovalPendingCount={setRemovalPendingCount}
            />
          )}
        </main>
      </div>
    </div>
  );
}
