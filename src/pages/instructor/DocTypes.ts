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
  // Новые поля файлового менеджера
  folder_id?: number | null;
  doc_type?: "document" | "file";
  file_url?: string | null;
  file_original_name?: string | null;
  file_size?: number | null;
  file_mime?: string | null;
  sort_order?: number;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  color: string;
  sort_order: number;
  is_shared: boolean;
  owner_name: string;
  owner_callsign: string;
}

export const CATEGORIES = ["Конспект", "Методичка", "Программа", "Нормативный документ", "Расписание", "Ведомость", "Прочее"];

export const FOLDER_COLORS = ["#00f5ff", "#00ff88", "#ff6b00", "#a855f7", "#ffbe32", "#ff2244", "#3b82f6"];

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function fmtSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export const MIME_ICON: Record<string, { icon: string; color: string; label: string }> = {
  "application/pdf": { icon: "FileText", color: "#ff6b00", label: "PDF" },
  "application/msword": { icon: "FileText", color: "#2b7fff", label: "DOC" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: "FileText", color: "#2b7fff", label: "DOCX" },
  "application/vnd.ms-powerpoint": { icon: "Presentation", color: "#ff6b00", label: "PPT" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { icon: "Presentation", color: "#ff6b00", label: "PPTX" },
  "text/plain": { icon: "FileText", color: "#00ff88", label: "TXT" },
  "application/zip": { icon: "Archive", color: "#a855f7", label: "ZIP" },
};
