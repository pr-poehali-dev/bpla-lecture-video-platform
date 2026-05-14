export interface Doc {
  id: number;
  title: string;
  category: string;
  group_name: string;
  subject: string;
  is_shared: boolean;
  content_html: string;
  created_at: string;
  updated_at: string;
  instructor_name: string;
  instructor_callsign: string;
  content_len?: number;
}

export const CATEGORIES = ["Конспект", "Методичка", "Программа", "Нормативный документ", "Прочее"];

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}
