const AUTH_URL = "https://functions.poehali.dev/549cd8d9-b876-4355-9483-609144c1e199";
const ADMIN_URL = "https://functions.poehali.dev/5407bcc9-7143-4278-8422-e2a603eb0135";
const FILES_URL = "https://functions.poehali.dev/0edb3a50-4c27-43a5-b907-883104f0c559";
const MSG_URL = "https://functions.poehali.dev/64d88e88-79a2-48b8-8ac8-d37bfa8eb51e";
const REMOVAL_URL = "https://functions.poehali.dev/c72247bf-756d-4755-9c5d-88a1c31e0f01";

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

export interface RemovalRequest {
  id: number;
  file_id: number;
  file_title: string;
  file_type: string;
  mime_type: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  requester: string;
  callsign: string;
  reviewer: string | null;
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

  uploadAvatar: (image_data: string, image_ext: string) =>
    fetch(`${AUTH_URL}/?action=upload-avatar`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ image_data, image_ext }) }).then((r) => r.json()),

  admin: {
    users: () =>
      fetch(`${ADMIN_URL}/?action=users`, { headers: authHeaders() }).then((r) => r.json()),

    approve: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=approve`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    reject: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=reject`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    makeAdmin: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=make-admin`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    setRole: (user_id: number, role: string) =>
      fetch(`${ADMIN_URL}/?action=set-role`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id, role }) }).then((r) => r.json()),

    getPermissions: () =>
      fetch(`${ADMIN_URL}/?action=get-permissions`, { headers: authHeaders() }).then((r) => r.json()),

    setPermissions: (role: string, permissions: Record<string, boolean>) =>
      fetch(`${ADMIN_URL}/?action=set-permissions`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ role, permissions }) }).then((r) => r.json()),

    removeAdmin: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=remove-admin`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    deleteUser: (user_id: number) =>
      fetch(`${ADMIN_URL}/?action=delete-user`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id }) }).then((r) => r.json()),

    stats: () =>
      fetch(`${ADMIN_URL}/?action=stats`, { headers: authHeaders() }).then((r) => r.json()),
  },

  msg: {
    searchUsers: (q: string) =>
      fetch(`${MSG_URL}/?action=users-search&q=${encodeURIComponent(q)}`, { headers: authHeaders() }).then(r => r.json()),
    contactsList: () =>
      fetch(`${MSG_URL}/?action=contacts-list`, { headers: authHeaders() }).then(r => r.json()),
    contactRequest: (target_id: number) =>
      fetch(`${MSG_URL}/?action=contact-request`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ target_id }) }).then(r => r.json()),
    contactRespond: (contact_id: number, response: "accept" | "reject") =>
      fetch(`${MSG_URL}/?action=contact-respond`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ contact_id, response }) }).then(r => r.json()),
    chatsList: () =>
      fetch(`${MSG_URL}/?action=chats-list`, { headers: authHeaders() }).then(r => r.json()),
    chatCreate: (name: string, member_ids: number[]) =>
      fetch(`${MSG_URL}/?action=chat-create`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ name, member_ids }) }).then(r => r.json()),
    chatMessages: (chat_id: number) =>
      fetch(`${MSG_URL}/?action=chat-messages&chat_id=${chat_id}`, { headers: authHeaders() }).then(r => r.json()),
    messageSend: (chat_id: number, content: string) =>
      fetch(`${MSG_URL}/?action=message-send`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ chat_id, content }) }).then(r => r.json()),
    imageSend: (chat_id: number, image_data: string, image_ext: string, caption?: string) =>
      fetch(`${MSG_URL}/?action=image-send`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ chat_id, image_data, image_ext, caption }) }).then(r => r.json()),
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

  discussions: {
    topics: () =>
      fetch(`${ADMIN_URL}/?action=disc-topics`).then((r) => r.json()),
    topic: (id: number) =>
      fetch(`${ADMIN_URL}/?action=disc-topic&topic_id=${id}`).then((r) => r.json()),
    create: (data: { title: string; category: string; text: string }) =>
      fetch(`${ADMIN_URL}/?action=disc-create`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) }).then((r) => r.json()),
    reply: (topic_id: number, text: string) =>
      fetch(`${ADMIN_URL}/?action=disc-reply&topic_id=${topic_id}`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ text }) }).then((r) => r.json()),
    deleteTopic: (topic_id: number) =>
      fetch(`${ADMIN_URL}/?action=disc-delete-topic&topic_id=${topic_id}`, { method: "POST", headers: authHeaders() }).then((r) => r.json()),
    deleteReply: (reply_id: number) =>
      fetch(`${ADMIN_URL}/?action=disc-delete-reply`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ reply_id }) }).then((r) => r.json()),
  },

  removal: {
    list: (): Promise<{ requests: RemovalRequest[] }> =>
      fetch(`${REMOVAL_URL}/`, { headers: authHeaders() }).then((r) => r.json()),

    create: (file_id: number, reason: string): Promise<{ id?: number; error?: string }> =>
      fetch(`${REMOVAL_URL}/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ file_id, reason }),
      }).then((r) => r.json()),

    review: (id: number, action: "approve" | "reject"): Promise<{ ok?: boolean; error?: string }> =>
      fetch(`${REMOVAL_URL}/`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ id, action }),
      }).then((r) => r.json()),
  },
};