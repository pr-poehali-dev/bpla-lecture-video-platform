import { useState } from "react";
import { User } from "@/App";
import Icon from "@/components/ui/icon";
import InstructorFilesManager from "./instructor/InstructorFilesManager";
import InstructorScheduleTab from "./instructor/InstructorScheduleTab";
import InstructorSheetsTab from "./instructor/InstructorSheetsTab";

type Tab = "files" | "schedule" | "sheets";

const TABS: { id: Tab; label: string; icon: string; desc: string }[] = [
  { id: "files",    label: "Материалы",  icon: "FolderOpen",    desc: "Конспекты, документы, файлы" },
  { id: "schedule", label: "Расписание", icon: "CalendarDays",  desc: "Занятия и события" },
  { id: "sheets",   label: "Ведомости",  icon: "ClipboardList", desc: "Успеваемость" },
];

interface Props { user: User; }

export default function InstructorPage({ user }: Props) {
  const [tab, setTab] = useState<Tab>("files");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-8 h-px bg-[#00ff88]" />
          <span className="font-mono text-xs text-[#00ff88] tracking-[0.3em]">// ИНСТРУКТОР</span>
        </div>
        <h1 className="font-orbitron text-2xl sm:text-3xl font-black text-white tracking-wider mb-1">
          КАБИНЕТ ИНСТРУКТОРА
        </h1>
        <p className="font-plex text-sm text-[#5a7a95]">
          {user.callsign || user.name} · {user.role}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: "1px solid rgba(0,255,136,0.12)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 sm:px-6 py-3 font-mono text-xs tracking-wider transition-all"
            style={{
              borderBottom: tab === t.id ? "2px solid #00ff88" : "2px solid transparent",
              color: tab === t.id ? "#00ff88" : "#3a5570",
              background: tab === t.id ? "rgba(0,255,136,0.04)" : "transparent",
              marginBottom: "-1px",
            }}
          >
            <Icon name={t.icon as "FolderOpen"} size={13} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "files"    && <InstructorFilesManager user={user} />}
      {tab === "schedule" && <InstructorScheduleTab  user={user} />}
      {tab === "sheets"   && <InstructorSheetsTab    user={user} />}
    </div>
  );
}
