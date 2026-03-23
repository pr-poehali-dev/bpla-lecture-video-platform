const AUTH_URL = "https://functions.poehali.dev/549cd8d9-b876-4355-9483-609144c1e199";
const ADMIN_URL = "https://functions.poehali.dev/5407bcc9-7143-4278-8422-e2a603eb0135";
const FILES_URL = "https://functions.poehali.dev/0edb3a50-4c27-43a5-b907-883104f0c559";

function getToken(): string {
  return localStorage.getItem("drone_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export interface FileItem {
  id: number;
  title: string;
  description: string;
  file_type: "video" | "document";
  category: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  cdn_url: string;
  created_at: string;
  uploader: string;
}

export const api = {
  register: (data: { callsign: string; name: string; email: string; password: string }) =>
    fetch(`${AUTH_URL}/?action=register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),

  login: (data: { callsign: string; password: string }) =>
    fetch(`${AUTH_URL}/?action=login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),

  me: () =>
    fetch(`${AUTH_URL}/?action=me`, { headers: authHeaders() }).then((r) => r.json()),

  logout: () =>
    fetch(`${AUTH_URL}/?action=logout`, { method: "POST", headers: authHeaders() }).then((r) => r.json()),

  updateProfile: (data: { name: string; rank: string; contacts: string }) =>
    fetch(`${AUTH_URL}/?action=update-profile`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then((r) => r.json()),

  admin: {
    users: () =>
      fetch(`${ADMIN_URL}/?action=users`, { headers: authHeaders() }).then((r) => r.json()),

    approve: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=approve`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    reject: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=reject`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    makeAdmin: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=make-admin`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),
  },

  files: {
    list: (type?: "video" | "document", category?: string, section?: string): Promise<{ files: FileItem[] }> => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (category) params.set("category", category);
      if (section) params.set("section", section);
      return fetch(`${FILES_URL}/?${params.toString()}`).then((r) => r.json());
    },

    upload: (data: {
      title: string;
      description: string;
      category: string;
      section?: string;
      original_name: string;
      mime_type: string;
      file_data: string;
    }) =>
      fetch(`${FILES_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      }).then((r) => r.json()),

    delete: (id: number) =>
      fetch(`${FILES_URL}/?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      }).then((r) => r.json()),

    addYoutube: (data: { title: string; description: string; category: string; section?: string; youtube_id: string }) =>
      fetch(`${FILES_URL}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ ...data, mime_type: "youtube" }),
      }).then((r) => r.json()),
  },
};