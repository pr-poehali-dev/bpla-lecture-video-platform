"""
Админ-панель: список пользователей, одобрение/отклонение заявок, управление ролями и правами доступа.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization, X-User-Id, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

PAGES = ["home", "lectures", "videos", "drone-types", "materials", "firmware", "discussions", "downloads"]
ROLES = ["курсант", "инструктор"]

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    return conn

def q(table: str) -> str:
    return f'"{get_schema()}".{table}'

def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_admin(event, cur):
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur.execute(f"SELECT id, name, email, is_admin FROM {q('users')} WHERE session_token = %s", (token,))
    user = cur.fetchone()
    if not user or not user["is_admin"]:
        return None
    return user

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Discussions — открытые эндпоинты (не требуют is_admin)
    if action.startswith("disc-"):
        result = handle_discussions(event, method, action, body, conn, cur)
        conn.close()
        return result if result else err("Не найдено", 404)

    admin = get_admin(event, cur)
    if not admin:
        return err("Доступ запрещён", 403)

    # GET ?action=users
    if action == "users" and method == "GET":
        cur.execute(f"SELECT id, name, callsign, email, status, is_admin, role, created_at, approved_at FROM {q('users')} ORDER BY created_at DESC")
        users = [dict(u) for u in cur.fetchall()]
        return ok({"users": users})

    # GET ?action=get-permissions
    if action == "get-permissions" and method == "GET":
        cur.execute(f"SELECT role, page, allowed FROM {q('role_permissions')} ORDER BY role, page")
        rows = cur.fetchall()
        result = {}
        for row in rows:
            r = row["role"]
            if r not in result:
                result[r] = {}
            result[r][row["page"]] = row["allowed"]
        # заполнить пропущенные страницы дефолтом True
        for role in ROLES:
            if role not in result:
                result[role] = {}
            for page in PAGES:
                if page not in result[role]:
                    result[role][page] = True
        return ok({"permissions": result, "pages": PAGES, "roles": ROLES})

    # POST ?action=set-permissions
    if action == "set-permissions" and method == "POST":
        role = body.get("role")
        permissions = body.get("permissions")  # dict page -> bool
        if not role or role not in ROLES:
            return err("Недопустимая роль")
        if not isinstance(permissions, dict):
            return err("permissions должен быть объектом")
        for page, allowed in permissions.items():
            if page not in PAGES:
                continue
            cur.execute(
                f"INSERT INTO {q('role_permissions')} (role, page, allowed, updated_at) VALUES (%s, %s, %s, NOW()) "
                f"ON CONFLICT (role, page) DO UPDATE SET allowed = EXCLUDED.allowed, updated_at = NOW()",
                (role, page, bool(allowed))
            )
        conn.commit()
        return ok({"message": f"Права для роли «{role}» обновлены"})

    # POST ?action=set-role
    if action == "set-role" and method == "POST":
        user_id = body.get("user_id")
        role = body.get("role")
        if not user_id:
            return err("user_id обязателен")
        if role not in ("курсант", "инструктор", "администратор"):
            return err("Недопустимая роль")
        cur.execute(f"UPDATE {q('users')} SET role = %s WHERE id = %s RETURNING id, name, callsign", (role, user_id))
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"Роль пользователя {user['callsign'] or user['name']} изменена на «{role}»"})

    # POST ?action=approve
    if action == "approve" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'approved', approved_at = NOW() WHERE id = %s RETURNING id, name, email",
            (user_id,)
        )
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"Пользователь {user['email']} одобрен", "user": dict(user)})

    # POST ?action=reject
    if action == "reject" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'rejected' WHERE id = %s RETURNING id, name, email",
            (user_id,)
        )
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"Пользователь {user['email']} отклонён", "user": dict(user)})

    # POST ?action=make-admin
    if action == "make-admin" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(f"UPDATE {q('users')} SET is_admin = TRUE, status = 'approved' WHERE id = %s RETURNING id, email", (user_id,))
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"{user['email']} назначен администратором"})

    # POST ?action=remove-admin
    if action == "remove-admin" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        if user_id == admin["id"]:
            return err("Нельзя снять права с себя")
        cur.execute(f"UPDATE {q('users')} SET is_admin = FALSE WHERE id = %s RETURNING id, email", (user_id,))
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"Права администратора сняты с {user['email']}"})

    # GET ?action=stats
    if action == "stats" and method == "GET":
        cur.execute(f"SELECT COUNT(*) as total FROM {q('users')}")
        total = cur.fetchone()["total"]
        cur.execute(f"SELECT COUNT(*) as cnt FROM {q('users')} WHERE status = 'pending'")
        pending = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) as cnt FROM {q('users')} WHERE status = 'approved'")
        approved = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) as cnt FROM {q('users')} WHERE is_admin = TRUE")
        admins = cur.fetchone()["cnt"]
        cur.execute(f"SELECT role, COUNT(*) as cnt FROM {q('users')} WHERE status = 'approved' GROUP BY role")
        by_role = {row["role"]: row["cnt"] for row in cur.fetchall()}
        return ok({"total": total, "pending": pending, "approved": approved, "admins": admins, "by_role": by_role})

    return err("Не найдено", 404)


# ── DISCUSSIONS ──────────────────────────────────────────────────────────────

DISC_CATEGORIES = ["Общее", "Техника", "Тактика", "Настройка", "Разбор", "Вопросы"]


def get_any_user(event, cur):
    """Возвращает пользователя по токену (не обязательно admin)."""
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur.execute(f"SELECT id, name, callsign, is_admin, role FROM {q('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    row = cur.fetchone()
    return dict(row) if row else None


def handle_discussions(event, method, action, body, conn, cur):
    topic_id = (event.get("queryStringParameters") or {}).get("topic_id")
    user = get_any_user(event, cur)

    # GET topics list
    if action == "disc-topics" and method == "GET":
        cur.execute(f"""
            SELECT t.id, t.title, t.category, t.views, t.created_at, t.updated_at,
                   u.name as author_name, u.callsign as author_callsign,
                   COUNT(r.id) as replies_count
            FROM {q('topics')} t
            JOIN {q('users')} u ON t.author_id = u.id
            LEFT JOIN {q('topic_replies')} r ON r.topic_id = t.id
            GROUP BY t.id, u.name, u.callsign
            ORDER BY t.updated_at DESC
        """)
        topics = [dict(t) for t in cur.fetchall()]
        return ok({"topics": topics, "categories": DISC_CATEGORIES})

    # GET single topic + replies
    if action == "disc-topic" and method == "GET":
        if not topic_id:
            return err("Укажите topic_id")
        cur.execute(f"""
            SELECT t.id, t.title, t.category, t.views, t.created_at,
                   u.name as author_name, u.callsign as author_callsign
            FROM {q('topics')} t JOIN {q('users')} u ON t.author_id = u.id
            WHERE t.id = %s
        """, (topic_id,))
        topic = cur.fetchone()
        if not topic:
            return err("Топик не найден", 404)
        cur.execute(f"UPDATE {q('topics')} SET views = views + 1 WHERE id = %s", (topic_id,))
        conn.commit()
        cur.execute(f"""
            SELECT r.id, r.text, r.created_at,
                   u.name as author_name, u.callsign as author_callsign
            FROM {q('topic_replies')} r JOIN {q('users')} u ON r.author_id = u.id
            WHERE r.topic_id = %s ORDER BY r.created_at ASC
        """, (topic_id,))
        replies = [dict(r) for r in cur.fetchall()]
        return ok({"topic": dict(topic), "replies": replies})

    # POST create topic
    if action == "disc-create" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        if not (user["is_admin"] or user.get("role") in ("инструктор", "администратор")):
            return err("Создавать темы могут только инструкторы", 403)
        title = body.get("title", "").strip()
        category = body.get("category", "Общее")
        text = body.get("text", "").strip()
        if not title:
            return err("Укажите заголовок")
        if category not in DISC_CATEGORIES:
            category = "Общее"
        cur.execute(f"INSERT INTO {q('topics')} (title, category, author_id) VALUES (%s, %s, %s) RETURNING id", (title, category, user["id"]))
        new_id = cur.fetchone()["id"]
        if text:
            cur.execute(f"INSERT INTO {q('topic_replies')} (topic_id, author_id, text) VALUES (%s, %s, %s)", (new_id, user["id"], text))
        conn.commit()
        return ok({"id": new_id})

    # POST delete topic (только для админов)
    if action == "disc-delete-topic" and method == "POST":
        if not user or not user["is_admin"]:
            return err("Доступ запрещён", 403)
        if not topic_id:
            return err("Укажите topic_id")
        cur.execute(f"SELECT id FROM {q('topics')} WHERE id = %s", (topic_id,))
        if not cur.fetchone():
            return err("Топик не найден", 404)
        cur.execute(f"DELETE FROM {q('topic_replies')} WHERE topic_id = %s", (topic_id,))
        cur.execute(f"DELETE FROM {q('topics')} WHERE id = %s", (topic_id,))
        conn.commit()
        return ok({"ok": True})

    # POST delete reply (только для админов)
    if action == "disc-delete-reply" and method == "POST":
        if not user or not user["is_admin"]:
            return err("Доступ запрещён", 403)
        reply_id = body.get("reply_id")
        if not reply_id:
            return err("Укажите reply_id")
        cur.execute(f"SELECT id, topic_id FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        row = cur.fetchone()
        if not row:
            return err("Ответ не найден", 404)
        cur.execute(f"DELETE FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        cur.execute(f"UPDATE {q('topics')} SET updated_at = NOW() WHERE id = %s", (row["topic_id"],))
        conn.commit()
        return ok({"ok": True})

    # POST add reply
    if action == "disc-reply" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        if not topic_id:
            return err("Укажите topic_id")
        text = body.get("text", "").strip()
        if not text:
            return err("Текст не может быть пустым")
        cur.execute(f"SELECT id FROM {q('topics')} WHERE id = %s", (topic_id,))
        if not cur.fetchone():
            return err("Топик не найден", 404)
        cur.execute(f"INSERT INTO {q('topic_replies')} (topic_id, author_id, text) VALUES (%s, %s, %s) RETURNING id", (topic_id, user["id"], text))
        reply_id = cur.fetchone()["id"]
        cur.execute(f"UPDATE {q('topics')} SET updated_at = NOW() WHERE id = %s", (topic_id,))
        conn.commit()
        return ok({"id": reply_id})

    return None