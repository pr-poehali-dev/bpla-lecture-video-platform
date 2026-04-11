import React from "react";

export interface Topic {
  id: number;
  title: string;
  category: string;
  views: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_callsign: string;
  replies_count: number;
  is_pinned?: boolean;
}

export interface Reply {
  id: number;
  text: string;
  created_at: string;
  updated_at?: string;
  author_name: string;
  author_callsign: string;
  author_id?: number;
  likes_count: number;
  i_liked: boolean;
  quote_reply_id?: number | null;
  quote_text?: string | null;
  quote_callsign?: string | null;
}

export const CATEGORIES = ["Общее", "Техника", "Тактика", "Настройка", "Разбор", "Вопросы"];
export type SortMode = "active" | "new" | "popular";

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} д назад`;
}

export function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (inCode) {
        result.push(
          React.createElement("pre", {
            key: i,
            className: "my-2 px-3 py-2 font-mono text-xs text-[#00ff88] overflow-x-auto rounded-sm",
            style: { background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)" },
          }, codeLines.join("\n"))
        );
        codeLines = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeLines.push(line); return; }

    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return React.createElement("strong", { key: j, className: "text-white font-semibold" }, part.slice(2, -2));
      if (part.startsWith("`") && part.endsWith("`"))
        return React.createElement("code", {
          key: j,
          className: "font-mono text-[11px] px-1 py-0.5 rounded-sm text-[#00f5ff]",
          style: { background: "rgba(0,245,255,0.08)" },
        }, part.slice(1, -1));
      return part;
    });
    result.push(React.createElement("span", { key: i }, parts, i < lines.length - 1 && React.createElement("br")));
  });
  return result;
}

export function useLastSeen() {
  const get = (topicId: number) => {
    try { return parseInt(localStorage.getItem(`disc_seen_${topicId}`) || "0"); } catch (_e) { return 0; }
  };
  const set = (topicId: number) => {
    try { localStorage.setItem(`disc_seen_${topicId}`, String(Date.now())); } catch (_e) { /* ignore */ }
  };
  return { get, set };
}
