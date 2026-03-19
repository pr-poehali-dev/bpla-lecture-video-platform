import { useState, useEffect } from "react";
import { api } from "@/api";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminUsersTab, { User } from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import Icon from "@/components/ui/icon";

interface Props {
  currentUser: { name: string; email: string };
  onLogout: () => void;
  onGoToSite: () => void;
}

export default function AdminPage({ currentUser, onLogout, onGoToSite }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState<"users" | "files">("users");
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    const res = await api.admin.users();
    if (res.users) setUsers(res.users);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  const approve = async (id: number) => {
    const res = await api.admin.approve(id);
    if (res.message) { showMsg(res.message); load(); }
  };

  const reject = async (id: number) => {
    const res = await api.admin.reject(id);
    if (res.message) { showMsg(res.message); load(); }
  };

  const makeAdmin = async (id: number) => {
    const res = await api.admin.makeAdmin(id);
    if (res.message) { showMsg(res.message); load(); }
  };

  return (
    <div className="min-h-screen grid-bg" style={{ background: "#050810" }}>
      <AdminHeader currentUser={currentUser} onLogout={onLogout} onGoToSite={onGoToSite} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { key: "users", label: "ПОЛЬЗОВАТЕЛИ", icon: "Users" },
            { key: "files", label: "ФАЙЛЫ И МЕДИА", icon: "Upload" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "users" | "files")}
              className="flex items-center gap-2 font-mono text-xs px-4 py-2 tracking-wider transition-all"
              style={{
                border: `1px solid ${activeTab === tab.key ? "#00f5ff" : "#1a2a3a"}`,
                color: activeTab === tab.key ? "#050810" : "#3a5570",
                background: activeTab === tab.key ? "#00f5ff" : "transparent",
              }}
            >
              <Icon name={tab.icon as "Users" | "Upload"} size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "files" ? (
          <AdminFilesTab />
        ) : (
          <AdminUsersTab
            users={users}
            loading={loading}
            filter={filter}
            setFilter={setFilter}
            msg={msg}
            onApprove={approve}
            onReject={reject}
            onMakeAdmin={makeAdmin}
          />
        )}
      </div>
    </div>
  );
}
