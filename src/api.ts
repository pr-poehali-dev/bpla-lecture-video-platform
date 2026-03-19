const AUTH_URL = "https://functions.poehali.dev/549cd8d9-b876-4355-9483-609144c1e199";
const ADMIN_URL = "https://functions.poehali.dev/5407bcc9-7143-4278-8422-e2a603eb0135";

function getToken(): string {
  return localStorage.getItem("drone_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

export const api = {
  register: (data: { email: string; password: string; name: string }) =>
    fetch(`${AUTH_URL}/?action=register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),

  login: (data: { email: string; password: string }) =>
    fetch(`${AUTH_URL}/?action=login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),

  me: () =>
    fetch(`${AUTH_URL}/?action=me`, { headers: authHeaders() }).then((r) => r.json()),

  logout: () =>
    fetch(`${AUTH_URL}/?action=logout`, { method: "POST", headers: authHeaders() }).then((r) => r.json()),

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
};
