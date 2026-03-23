import { type User } from "@/App";
import AdminFilesTab from "@/components/admin/AdminFilesTab";
import Icon from "@/components/ui/icon";

interface Props {
  user: User;
}

export default function ContentUploadPage({ user }: Props) {
  const canUpload = user.is_admin || user.role === "инструктор";

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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-[#00f5ff]" />
        <span className="font-mono text-xs text-[#00f5ff] tracking-[0.3em]">// УПРАВЛЕНИЕ КОНТЕНТОМ</span>
      </div>
      <h1 className="font-orbitron text-3xl font-black text-white mb-2 tracking-wider">ЗАГРУЗКА МАТЕРИАЛОВ</h1>
      <div className="flex items-center gap-2 mb-8">
        <div className="font-mono text-xs px-2 py-0.5" style={{ border: "1px solid rgba(0,255,136,0.3)", color: "#00ff88", background: "rgba(0,255,136,0.06)" }}>
          {user.role?.toUpperCase() || "ИНСТРУКТОР"}
        </div>
        <span className="font-mono text-xs text-[#3a5570]">{user.callsign || user.name}</span>
      </div>

      <AdminFilesTab isAdmin={user.is_admin} />
    </div>
  );
}