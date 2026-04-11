"""
Уведомления пользователей.
Действия: list, read-all, read-one, admin-send
"""
import json, os, psycopg2
from psycopg2.extras import RealDictCursor

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization"}

def get_conn(): return psycopg2.connect(os.environ["DATABASE_URL"])
def schema(): return os.environ.get("MAIN_DB_SCHEMA", "public")
def t(n): return f'"{schema()}".{n}'
def ok(d, s=200): return {"statusCode": s, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(d, ensure_ascii=False, default=str)}
def err(m, s=400): return {"statusCode": s, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": m}, ensure_ascii=False)}

def get_user(cur, token):
    cur.execute(f"SELECT id, name, callsign, is_admin FROM {t('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    return cur.fetchone()

def extract_token(event):
    h = event.get("headers") or {}
    auth = h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or ""
    return auth.replace("Bearer ", "").strip()

def handler(event: dict, context) -> dict:
    """Уведомления: список, отметка прочитанным, отправка администратором."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        try: body = json.loads(event["body"])
        except: pass

    token = extract_token(event)
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    user = get_user(cur, token) if token else None
    if not user:
        return err("Не авторизован", 401)

    # ── Список уведомлений ──
    if action == "list" and method == "GET":
        cur.execute(f"""
            SELECT id, type, title, body, link_page, is_read, created_at
            FROM {t('notifications')}
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user["id"],))
        notifs = cur.fetchall()
        unread = sum(1 for n in notifs if not n["is_read"])
        return ok({"notifications": notifs, "unread": unread})

    # ── Прочитать всё ──
    if action == "read-all" and method == "POST":
        cur.execute(f"UPDATE {t('notifications')} SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE", (user["id"],))
        conn.commit()
        return ok({"ok": True})

    # ── Прочитать одно ──
    if action == "read-one" and method == "POST":
        notif_id = body.get("id")
        cur.execute(f"UPDATE {t('notifications')} SET is_read = TRUE WHERE id = %s AND user_id = %s", (notif_id, user["id"]))
        conn.commit()
        return ok({"ok": True})

    # ─── ADMIN ───
    if not user.get("is_admin"):
        return err("Доступ запрещён", 403)

    # ── Отправить уведомление всем или конкретному пользователю ──
    if action == "admin-send" and method == "POST":
        title = (body.get("title") or "").strip()
        notif_body = (body.get("body") or "").strip()
        link_page = body.get("link_page")
        notif_type = body.get("type", "info")
        target_user_id = body.get("user_id")  # None = всем
        if not title:
            return err("Укажите title")
        if target_user_id:
            cur.execute(f"INSERT INTO {t('notifications')} (user_id, type, title, body, link_page) VALUES (%s, %s, %s, %s, %s)",
                (target_user_id, notif_type, title, notif_body or None, link_page))
        else:
            cur.execute(f"SELECT id FROM {t('users')} WHERE status = 'approved'")
            user_ids = [r["id"] for r in cur.fetchall()]
            for uid in user_ids:
                cur.execute(f"INSERT INTO {t('notifications')} (user_id, type, title, body, link_page) VALUES (%s, %s, %s, %s, %s)",
                    (uid, notif_type, title, notif_body or None, link_page))
        conn.commit()
        return ok({"ok": True, "sent": 1 if target_user_id else len(user_ids)})

    # ── Авто: уведомить о новом контенте (вызывается при загрузке файла) ──
    if action == "notify-new-content" and method == "POST":
        title = (body.get("title") or "").strip()
        file_type = body.get("file_type", "document")
        link_page = "lectures" if file_type == "document" else "videos"
        notif_type = "new_content"
        if not title:
            return err("Укажите title")
        cur.execute(f"SELECT id FROM {t('users')} WHERE status = 'approved'")
        user_ids = [r["id"] for r in cur.fetchall()]
        for uid in user_ids:
            cur.execute(f"INSERT INTO {t('notifications')} (user_id, type, title, body, link_page) VALUES (%s, %s, %s, %s, %s)",
                (uid, notif_type, f"Новый материал: {title}", f"Добавлен новый {'документ' if file_type == 'document' else 'видеоматериал'}", link_page))
        conn.commit()
        return ok({"ok": True})

    return err("Неизвестное действие", 404)
