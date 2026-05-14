import { useState, useEffect } from "react";
import { api } from "@/api";
import Icon from "@/components/ui/icon";
import ConfirmModal from "./ConfirmModal";

export default function AdminSettingsTab() {
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [message, setMessage] = useState("Сайт временно недоступен. Ведутся технические работы.");
  const [siteName, setSiteName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [maxFileSize, setMaxFileSize] = useState("100");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [showDisableSiteConfirm, setShowDisableSiteConfirm] = useState(false);

  const showMsg = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  useEffect(() => {
    api.admin.getSettings().then((res) => {
      if (res.settings) {
        setSiteEnabled(res.settings.site_enabled !== "false");
        setRegistrationOpen(res.settings.registration_open !== "false");
        if (res.settings.maintenance_message) setMessage(res.settings.maintenance_message);
        if (res.settings.site_name) setSiteName(res.settings.site_name);
        if (res.settings.contact_email) setContactEmail(res.settings.contact_email);
        if (res.settings.max_file_size_mb) setMaxFileSize(res.settings.max_file_size_mb);
        if (res.settings.logo_url) setLogoUrl(res.settings.logo_url);
        if (res.settings.favicon_url) setFaviconUrl(res.settings.favicon_url);
        if (res.settings.seo_title) setSeoTitle(res.settings.seo_title);
        if (res.settings.seo_description) setSeoDescription(res.settings.seo_description);
        if (res.settings.welcome_message) setWelcomeMessage(res.settings.welcome_message);
      }
      setLoading(false);
    });
  }, []);

  const toggleSite = () => {
    if (siteEnabled) setShowDisableSiteConfirm(true);
    else setSiteEnabled(true);
  };

  const save = async () => {
    setSaving(true);
    const res = await api.admin.setSettings({
      site_enabled: siteEnabled ? "true" : "false",
      maintenance_message: message,
      registration_open: registrationOpen ? "true" : "false",
      site_name: siteName,
      contact_email: contactEmail,
      max_file_size_mb: maxFileSize,
      logo_url: logoUrl,
      favicon_url: faviconUrl,
      seo_title: seoTitle,
      seo_description: seoDescription,
      welcome_message: welcomeMessage,
    });
    setSaving(false);
    if (res.message) showMsg(res.message);
    else showMsg(res.error || "Ошибка сохранения", false);
  };

  if (loading) {
    return <div className="text-center py-16 font-mono text-sm text-[#3a5570] tracking-widest">ЗАГРУЗКА...</div>;
  }

  function Toggle({ value, onChange, colorOn = "#00ff88" }: { value: boolean; onChange: (v: boolean) => void; colorOn?: string }) {
    return (
      <button onClick={() => onChange(!value)}
        className="flex-shrink-0 relative w-12 h-6 rounded-full transition-all duration-300"
        style={{ background: value ? colorOn : "#1a2a3a", border: `1px solid ${value ? colorOn + "80" : "rgba(255,255,255,0.1)"}`, boxShadow: value ? `0 0 10px ${colorOn}40` : "none" }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center"
          style={{ left: value ? "calc(100% - 22px)" : "2px", background: value ? "#050810" : "#3a5570" }}>
          <Icon name={value ? "Check" : "X"} size={9} style={{ color: value ? colorOn : "#5a7a95" }} />
        </span>
      </button>
    );
  }

  function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-6 py-3" style={{ borderBottom: "1px solid rgba(0,245,255,0.05)" }}>
        <div>
          <div className="font-plex text-sm text-white">{label}</div>
          {desc && <div className="font-mono text-[10px] text-[#3a5570] mt-0.5">{desc}</div>}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5">
      {/* General */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">ОСНОВНЫЕ</div>
        <SettingRow label="Название сайта" desc="Отображается в заголовке и письмах">
          <input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="Название платформы"
            className="w-48 bg-transparent px-3 py-1.5 font-plex text-sm text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
        <SettingRow label="Контактный email" desc="Обратная связь, системные письма">
          <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="admin@example.com"
            className="w-48 bg-transparent px-3 py-1.5 font-mono text-sm text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
      </div>

      {/* Access */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">ДОСТУП</div>
        <SettingRow label={siteEnabled ? "Сайт работает" : "Сайт выключен"} desc={siteEnabled ? "Все пользователи имеют доступ" : "Только администраторы могут войти"}>
          <Toggle value={siteEnabled} onChange={toggleSite} colorOn="#00ff88" />
        </SettingRow>
        {!siteEnabled && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 p-3 font-mono text-xs text-[#ff6b00]" style={{ border: "1px solid rgba(255,107,0,0.2)", background: "rgba(255,107,0,0.05)" }}>
              <Icon name="AlertTriangle" size={13} />Незалогиненные пользователи увидят страницу тех. работ
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2}
              className="w-full px-3 py-2 font-plex text-sm bg-transparent text-white outline-none resize-none"
              style={{ border: "1px solid #1a2a3a" }} placeholder="Текст для пользователей..." />
          </div>
        )}
        <SettingRow label="Регистрация открыта" desc="Новые пользователи могут подать заявку">
          <Toggle value={registrationOpen} onChange={setRegistrationOpen} />
        </SettingRow>
      </div>

      {/* Branding */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">БРЕНДИНГ</div>
        <SettingRow label="URL логотипа" desc="Ссылка на изображение логотипа">
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
            className="w-48 bg-transparent px-3 py-1.5 font-plex text-sm text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
        {logoUrl && (
          <div className="mt-2 flex items-center gap-3">
            <img src={logoUrl} alt="logo preview" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            <span className="font-mono text-[10px] text-[#3a5570]">Предпросмотр</span>
          </div>
        )}
        <SettingRow label="URL favicon" desc="Иконка вкладки браузера (ico/png)">
          <input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://..."
            className="w-48 bg-transparent px-3 py-1.5 font-plex text-sm text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
      </div>

      {/* SEO */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">SEO</div>
        <SettingRow label="Title страницы" desc="Заголовок в поисковике и вкладке">
          <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="БпС — Платформа"
            className="w-48 bg-transparent px-3 py-1.5 font-plex text-sm text-white outline-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
        <div className="py-3" style={{ borderBottom: "1px solid rgba(0,245,255,0.05)" }}>
          <div className="font-plex text-sm text-white mb-1">Meta description</div>
          <div className="font-mono text-[10px] text-[#3a5570] mb-2">Описание сайта для поисковиков</div>
          <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2}
            placeholder="Профессиональная образовательная платформа..."
            className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none resize-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>
      </div>

      {/* Welcome */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">ПРИВЕТСТВИЕ</div>
        <div className="py-3">
          <div className="font-plex text-sm text-white mb-1">Сообщение при одобрении заявки</div>
          <div className="font-mono text-[10px] text-[#3a5570] mb-2">Отправляется пользователю когда его заявка одобрена</div>
          <textarea value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} rows={3}
            placeholder="Добро пожаловать на платформу! Ваша заявка одобрена. Теперь вам доступны все материалы..."
            className="w-full bg-transparent px-3 py-2 font-plex text-sm text-white outline-none resize-none"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </div>
      </div>

      {/* Limits */}
      <div className="p-5" style={{ border: "1px solid rgba(0,245,255,0.1)", background: "#0a1520" }}>
        <div className="font-mono text-xs text-[#00f5ff] tracking-widest mb-4">ОГРАНИЧЕНИЯ</div>
        <SettingRow label="Максимальный размер файла" desc="Для загрузки материалов (МБ)">
          <input value={maxFileSize} onChange={e => setMaxFileSize(e.target.value.replace(/\D/g, ""))} placeholder="100"
            className="w-24 bg-transparent px-3 py-1.5 font-mono text-sm text-white outline-none text-right"
            style={{ border: "1px solid rgba(0,245,255,0.15)" }} />
        </SettingRow>
      </div>

      {msg && (
        <div className="p-3 font-mono text-xs" style={{ border: `1px solid ${msg.ok ? "rgba(0,255,136,0.3)" : "rgba(255,34,68,0.3)"}`, color: msg.ok ? "#00ff88" : "#ff2244", background: msg.ok ? "rgba(0,255,136,0.05)" : "rgba(255,34,68,0.05)" }}>
          {msg.ok ? "✓" : "✗"} {msg.text}
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 font-mono text-xs px-6 py-3 transition-all disabled:opacity-50"
        style={{ border: "1px solid rgba(0,245,255,0.4)", color: "#00f5ff", background: "rgba(0,245,255,0.06)" }}>
        {saving ? <><Icon name="Loader" size={13} className="animate-spin" />СОХРАНЕНИЕ...</> : <><Icon name="Save" size={13} />СОХРАНИТЬ НАСТРОЙКИ</>}
      </button>

      <ConfirmModal open={showDisableSiteConfirm} title="Выключить сайт"
        message="Все пользователи (кроме администраторов) потеряют доступ к платформе. Продолжить?"
        confirmLabel="Выключить" danger
        onConfirm={() => { setSiteEnabled(false); setShowDisableSiteConfirm(false); }}
        onCancel={() => setShowDisableSiteConfirm(false)} />
    </div>
  );
}