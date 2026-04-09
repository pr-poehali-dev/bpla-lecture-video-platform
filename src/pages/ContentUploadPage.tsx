import { useState, useEffect } from "react";
import { type User } from "@/App";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import Icon from "@/components/ui/icon";
import { api, RemovalRequest } from "@/api";

interface Props {
  user: User;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "НА РАССМОТРЕНИИ",
  approved: "ОДОБРЕНО",
  rejected: "ОТКЛОНЕНО",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#ff6b00",
  approved: "#00ff88",
  rejected: "#ff2244",
};

export default function ContentUploadPage({ user }: Props) {
  const canUpload = user.is_admin || ["инструктор кт", "инструктор fpv", "инструктор оператор-сапер"].includes(user.role || "");
  const [tab, setTab] = useState<"upload" | "requests">("upload");
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  const loadRequests = () => {
    setReqLoading(true);
    api.removal.list().then((res) => {
      setRequests(res.requests || []);
      setReqLoading(false);
    });
  };

  useEffect(() => {
    if (tab === "requests") loadRequests();
  }, [tab]);

  if (!canUpload) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6" style={{ border: "1px solid rgba(255,34,68,0.3)", background: "rgba(255,34,68,0.05)" }}>
          <Icon name="ShieldOff" size={28} className="text-[#ff2244]" />
        </div>
        <div className="font-orbitron text-xl font-bold text-white mb-3 tracking-wider">ДОСТУП ЗАКРЫТ</div>
        <div className="font-mono text-sm text-[#3a5570]">Загрузка материалов доступна только инструкторам и администраторам.</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// УПРАВЛЕНИЕ КОНТЕНТОМ</span>
      </div>
      <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white mb-2 tracking-wider">ЗАГРУЗКА МАТЕРИАЛОВ</h1>
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        <div className="font-mono text-xs px-2 py-0.5" style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          {user.role?.toUpperCase() || "ИНСТРУКТОР"}
        </div>
        <span className="font-mono text-xs text-[#3a5570]">{user.callsign || user.name}</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "upload", label: "ЗАГРУЗКА", icon: "Upload" },
          { key: "requests", label: "МОИ ЗАЯВКИ", icon: "Trash2" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as "upload" | "requests")}
            className="flex items-center gap-1.5 font-mono text-xs px-4 py-2 transition-all"
            style={{
              border: `1px solid ${tab === t.key ? "#00f5ff" : "#1a2a3a"}`,
              color: tab === t.key ? "#050810" : "#3a5570",
              background: tab === t.key ? "#00f5ff" : "transparent",
            }}
          >
            <Icon name={t.icon as "Upload"} size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "upload" && <AdminFilesTab isAdmin={user.is_admin} />}

      {tab === "requests" && (
        <div style={{ border: "1px solid #1a2a3a" }}>
          <div className="px-4 py-3 font-mono text-xs text-[#00f5ff] tracking-wider" style={{ borderBottom: "1px solid #1a2a3a", background: "#0a1520" }}>
            МОИ ЗАЯВКИ НА УДАЛЕНИЕ {!reqLoading && `(${requests.length})`}
          </div>
          {reqLoading ? (
            <div className="p-8 text-center font-mono text-xs text-[#3a5570] animate-pulse">ЗАГРУЗКА...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-[#3a5570]">Заявок пока нет</div>
          ) : (
            requests.map((r, i) => (
              <div
                key={r.id}
                className="px-4 py-4 flex items-start gap-3"
                style={{ borderBottom: i < requests.length - 1 ? "1px solid #0d1a28" : "none" }}
              >
                <Icon
                  name={r.file_type === "video" ? (r.mime_type === "youtube" ? "Youtube" : "Video") : "FileText"}
                  size={16}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: r.file_type === "video" ? "#00f5ff" : "#ff6b00" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white truncate mb-1">{r.file_title}</div>
                  {r.reason && (
                    <div className="font-mono text-xs text-[#3a5570] mb-1">Причина: {r.reason}</div>
                  )}
                  <div className="font-mono text-xs text-[#1a2a3a]">
                    {new Date(r.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <div
                  className="font-mono text-[10px] px-2 py-0.5 flex-shrink-0"
                  style={{
                    border: `1px solid ${STATUS_COLOR[r.status]}44`,
                    color: STATUS_COLOR[r.status],
                    background: `${STATUS_COLOR[r.status]}0d`,
                  }}
                >
                  {STATUS_LABEL[r.status] || r.status.toUpperCase()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}