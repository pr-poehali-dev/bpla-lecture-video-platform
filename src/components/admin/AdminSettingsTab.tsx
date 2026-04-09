import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";

export default function AdminSettingsTab() {
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [message, setMessage] = useState("Сайт временно недоступен. Ведутся технические работы.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    api.admin.getSettings().then((res) => {
      if (res.settings) {
        setSiteEnabled(res.settings.site_enabled !== "false");
        if (res.settings.maintenance_message) setMessage(res.settings.maintenance_message);
      }
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const res = await api.admin.setSettings({
      site_enabled: siteEnabled ? "true" : "false",
      maintenance_message: message,
    });
    setSaving(false);
    if (res.message) showMsg(res.message);
    else showMsg(res.error || "Ошибка сохранения", false);
  };

  if (loading) {
    return <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>;
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Site on/off */}
      <div className="p-5 space-y-4" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-1">ДОСТУПНОСТЬ САЙТА</div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-plex text-sm text-white mb-0.5">
              {siteEnabled ? "Сайт работает" : "Сайт выключен"}
            </div>
            <div className="font-mono text-xs text-[#3a5570]">
              {siteEnabled
                ? "Все пользователи имеют доступ"
                : "Только администраторы могут войти"}
            </div>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setSiteEnabled(!siteEnabled)}
            className="flex-shrink-0 relative w-14 h-7 rounded-full transition-all duration-300"
            style={{
              background: siteEnabled ? "#00ff88" : "#1a2a3a",
              border: `1px solid ${siteEnabled ? "rgba(0,255,136,0.5)" : "rgba(255,255,255,0.1)"}`,
              boxShadow: siteEnabled ? "0 0 12px rgba(0,255,136,0.4)" : "none",
            }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
              style={{
                left: siteEnabled ? "calc(100% - 26px)" : "2px",
                background: siteEnabled ? "#050810" : "#3a5570",
              }}
            >
              <Icon name={siteEnabled ? "Check" : "X"} size={10} className={siteEnabled ? "text-[#00ff88]" : "text-[#5a7a95]"} />
            </span>
          </button>
        </div>

        {!siteEnabled && (
          <div className="flex items-center gap-2 p-3 font-mono text-xs text-[#ff6b00]" style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.05)" }}>
            <Icon name="AlertTriangle" size={13} />
            Все незалогиненные пользователи увидят страницу технических работ
          </div>
        )}
      </div>

      {/* Maintenance message */}
      <div className="p-5 space-y-3" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest">СООБЩЕНИЕ ПРИ ОТКЛЮЧЕНИИ</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 font-plex text-sm bg-transparent text-white placeholder-[#3a5570] outline-none resize-none"
          style={{ border: "1px solid #1a2a3a" }}
          placeholder="Текст для пользователей..."
        />
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{
          border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`,
          color: msg.ok ? "#00ff88" : "#ff2244",
          background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)",
        }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 font-mono text-xs px-6 py-3 transition-all disabled:opacity-50"
        style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}
      >
        {saving
          ? <><Icon name="Loader" size={13} className="animate-spin" />СОХРАНЕНИЕ...</>
          : <><Icon name="Save" size={13} />СОХРАНИТЬ НАСТРОЙКИ</>
        }
      </button>
    </div>
  );
}
