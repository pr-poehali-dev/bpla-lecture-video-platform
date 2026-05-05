import React from "react";
import Icon from "@/components/ui/icon";

export interface Note {
  id: number;
  item_type: string;
  item_id: number;
  content: string;
  updated_at: string;
}

export const RANKS = [
  "Рядовой", "Ефрейтор", "Младший сержант", "Сержант", "Старший сержант",
  "Старшина", "Прапорщик", "Старший прапорщик",
  "Младший лейтенант", "Лейтенант", "Старший лейтенант", "Капитан",
  "Майор", "Подполковник", "Полковник",
  "Генерал-майор", "Генерал-лейтенант", "Генерал-полковник", "Генерал армии",
];

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru", { day: "2-digit", month: "long", year: "numeric" });
}

export function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return `${Math.floor(diff / 86400)} д назад`;
}

export function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    React.createElement("div", { className: "flex items-center gap-2" },
      React.createElement("div", {
        className: "flex-1 h-1.5 rounded-full overflow-hidden",
        style: { background: "rgba(255,255,255,0.06)" }
      },
        React.createElement("div", {
          className: "h-full rounded-full transition-all duration-700",
          style: { width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }
        })
      ),
      React.createElement("span", {
        className: "font-mono text-[9px] flex-shrink-0",
        style: { color, minWidth: 28 }
      }, `${pct}%`)
    )
  );
}

export function Field({ label, value, icon, locked }: { label: string; value?: string | null; icon: string; locked?: boolean }) {
  return (
    React.createElement("div", {
      className: "flex items-start gap-3 py-2.5 border-b",
      style: { borderColor: "rgba(0,245,255,0.06)" }
    },
      React.createElement(Icon, { name: icon, size: 13, className: "text-[#3a5570] mt-0.5 flex-shrink-0" }),
      React.createElement("div", { className: "flex-1 min-w-0" },
        React.createElement("div", { className: "font-mono text-[10px] text-[#3a5570] tracking-wider mb-0.5" }, label),
        React.createElement("div", { className: "font-plex text-sm text-white truncate" },
          value || React.createElement("span", { className: "text-[#2a4060]" }, "не указано")
        )
      ),
      locked && React.createElement(Icon, { name: "Lock", size: 11, className: "text-[#2a4060] mt-1 flex-shrink-0" })
    )
  );
}