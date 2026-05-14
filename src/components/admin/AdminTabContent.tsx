import { User } from "@/components/admin/AdminUsersTab";
import AdminUsersTab from "@/components/admin/AdminUsersTab";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import AdminRolesTab from "@/components/admin/AdminRolesTab";
import AdminRemovalTab from "@/components/admin/AdminRemovalTab";
import AdminDiscussionsTab from "@/components/admin/AdminDiscussionsTab";
import AdminLecturesTab from "@/components/admin/AdminLecturesTab";
import AdminVideosTab from "@/components/admin/AdminVideosTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminPagesTab from "@/components/admin/AdminPagesTab";
import AdminSupportTab from "@/components/admin/AdminSupportTab";
import AdminQuizzesTab from "@/components/admin/AdminQuizzesTab";
import AdminContentTab from "@/components/admin/AdminContentTab";
import AdminAuditTab from "@/components/admin/AdminAuditTab";
import AdminDronesTab from "@/components/admin/AdminDronesTab";

type Tab = "dashboard" | "users" | "roles" | "content" | "removals" | "discussions" | "lectures" | "videos" | "files" | "settings" | "pages" | "support" | "quizzes" | "audit" | "drones";

interface Props {
  activeTab: Tab;
  users: User[];
  loading: boolean;
  filter: string;
  setFilter: (f: string) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onMakeAdmin: (id: number) => void;
  onRemoveAdmin: (id: number) => void;
  onSetRole: (id: number, role: string) => void;
  onDeleteUser: (id: number) => void;
  onBlockUser: (id: number, reason: string) => void;
  onUnblockUser: (id: number) => void;
  onResetPassword: (id: number) => Promise<unknown>;
  onBulkApprove: (ids: number[]) => void;
  onBulkReject: (ids: number[]) => void;
  onRemovalPendingCount: (n: number) => void;
}

export default function AdminTabContent({
  activeTab,
  users, loading, filter, setFilter,
  onApprove, onReject, onMakeAdmin, onRemoveAdmin, onSetRole,
  onDeleteUser, onBlockUser, onUnblockUser, onResetPassword,
  onBulkApprove, onBulkReject,
  onRemovalPendingCount,
}: Props) {
  return (
    <>
      {activeTab === "users" && (
        <AdminUsersTab
          users={users} loading={loading} filter={filter} setFilter={setFilter} msg=""
          onApprove={onApprove} onReject={onReject} onMakeAdmin={onMakeAdmin} onRemoveAdmin={onRemoveAdmin} onSetRole={onSetRole}
          onDeleteUser={onDeleteUser} onBlockUser={onBlockUser} onUnblockUser={onUnblockUser}
          onResetPassword={onResetPassword} onBulkApprove={onBulkApprove} onBulkReject={onBulkReject}
        />
      )}
      {activeTab === "roles" && <AdminRolesTab />}
      {activeTab === "content" && <AdminContentTab />}
      {activeTab === "files" && <AdminFilesTab />}
      {activeTab === "lectures" && <AdminLecturesTab />}
      {activeTab === "videos" && <AdminVideosTab />}
      {activeTab === "removals" && <AdminRemovalTab onPendingCount={onRemovalPendingCount} />}
      {activeTab === "discussions" && <AdminDiscussionsTab />}
      {activeTab === "settings" && <AdminSettingsTab />}
      {activeTab === "pages" && <AdminPagesTab />}
      {activeTab === "support" && <AdminSupportTab />}
      {activeTab === "quizzes" && <AdminQuizzesTab />}
      {activeTab === "audit" && <AdminAuditTab />}
      {activeTab === "drones" && <AdminDronesTab />}
    </>
  );
}
