"""
Личные сообщения: контакты, чаты, переписка.
Действия: contacts-list, contact-request, contact-respond,
          chats-list, chat-create, chat-messages, message-send, users-search
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def t(name):
    return f'"{schema()}".{name}'

def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_user(cur, token):
    cur.execute(f"SELECT id, name, callsign, rank FROM {t('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    return cur.fetchone()

def extract_token(event):
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
    return auth.replace("Bearer ", "").strip()

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

    token = extract_token(event)
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    user = get_user(cur, token) if token else None
    if not user and action != "":
        return err("Не авторизован", 401)

    # Поиск пользователей по позывному
    if action == "users-search" and method == "GET":
        q = (params.get("q") or "").strip()
        if len(q) < 2:
            return ok({"users": []})
        cur.execute(
            f"SELECT id, name, callsign, rank FROM {t('users')} WHERE status = 'approved' AND id != %s AND (callsign ILIKE %s OR name ILIKE %s) LIMIT 20",
            (user["id"], f"%{q}%", f"%{q}%")
        )
        return ok({"users": [dict(u) for u in cur.fetchall()]})

    # Список контактов
    if action == "contacts-list" and method == "GET":
        cur.execute(f"""
            SELECT c.id, c.status, c.created_at,
                CASE WHEN c.requester_id = %s THEN c.target_id ELSE c.requester_id END AS contact_user_id,
                c.requester_id, c.target_id,
                u.name, u.callsign, u.rank
            FROM {t('contacts')} c
            JOIN {t('users')} u ON u.id = CASE WHEN c.requester_id = %s THEN c.target_id ELSE c.requester_id END
            WHERE c.requester_id = %s OR c.target_id = %s
            ORDER BY c.updated_at DESC
        """, (user["id"], user["id"], user["id"], user["id"]))
        return ok({"contacts": [dict(c) for c in cur.fetchall()]})

    # Отправить заявку в контакты
    if action == "contact-request" and method == "POST":
        target_id = body.get("target_id")
        if not target_id:
            return err("Укажите пользователя")
        if target_id == user["id"]:
            return err("Нельзя добавить себя")

        cur.execute(f"SELECT id FROM {t('users')} WHERE id = %s AND status = 'approved'", (target_id,))
        if not cur.fetchone():
            return err("Пользователь не найден")

        cur.execute(
            f"SELECT id, status FROM {t('contacts')} WHERE (requester_id = %s AND target_id = %s) OR (requester_id = %s AND target_id = %s)",
            (user["id"], target_id, target_id, user["id"])
        )
        existing = cur.fetchone()
        if existing:
            if existing["status"] == "accepted":
                return err("Уже в контактах")
            if existing["status"] == "pending":
                return err("Заявка уже отправлена")

        cur.execute(
            f"INSERT INTO {t('contacts')} (requester_id, target_id, status) VALUES (%s, %s, 'pending') ON CONFLICT (requester_id, target_id) DO UPDATE SET status = 'pending', updated_at = NOW()",
            (user["id"], target_id)
        )
        conn.commit()
        return ok({"message": "Заявка отправлена"})

    # Ответить на заявку (принять / отклонить)
    if action == "contact-respond" and method == "POST":
        contact_id = body.get("contact_id")
        response = body.get("response")  # accept | reject
        if not contact_id or response not in ("accept", "reject"):
            return err("Неверные параметры")

        cur.execute(f"SELECT * FROM {t('contacts')} WHERE id = %s AND target_id = %s AND status = 'pending'", (contact_id, user["id"]))
        contact = cur.fetchone()
        if not contact:
            return err("Заявка не найдена")

        new_status = "accepted" if response == "accept" else "rejected"
        cur.execute(f"UPDATE {t('contacts')} SET status = %s, updated_at = NOW() WHERE id = %s", (new_status, contact_id))

        if response == "accept":
            # Создаём личный чат если его нет
            cur.execute(f"""
                SELECT cm1.chat_id FROM {t('chat_members')} cm1
                JOIN {t('chat_members')} cm2 ON cm1.chat_id = cm2.chat_id
                JOIN {t('chats')} ch ON ch.id = cm1.chat_id
                WHERE cm1.user_id = %s AND cm2.user_id = %s AND ch.type = 'direct'
            """, (user["id"], contact["requester_id"]))
            if not cur.fetchone():
                cur.execute(f"INSERT INTO {t('chats')} (type, created_by) VALUES ('direct', %s) RETURNING id", (user["id"],))
                chat_id = cur.fetchone()["id"]
                cur.execute(f"INSERT INTO {t('chat_members')} (chat_id, user_id) VALUES (%s, %s), (%s, %s)", (chat_id, user["id"], chat_id, contact["requester_id"]))

        conn.commit()
        return ok({"message": "Готово"})

    # Список чатов
    if action == "chats-list" and method == "GET":
        cur.execute(f"""
            SELECT ch.id, ch.type, ch.name, ch.created_at,
                (SELECT content FROM {t('messages')} m WHERE m.chat_id = ch.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT m.created_at FROM {t('messages')} m WHERE m.chat_id = ch.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM {t('messages')} m WHERE m.chat_id = ch.id AND m.created_at > cm.last_read_at AND m.sender_id != %s) AS unread_count
            FROM {t('chats')} ch
            JOIN {t('chat_members')} cm ON cm.chat_id = ch.id AND cm.user_id = %s
            ORDER BY last_message_at DESC NULLS LAST
        """, (user["id"], user["id"]))
        chats = [dict(c) for c in cur.fetchall()]

        # Для каждого direct чата — получить имя собеседника
        for chat in chats:
            if chat["type"] == "direct":
                cur.execute(f"""
                    SELECT u.id, u.name, u.callsign, u.rank FROM {t('users')} u
                    JOIN {t('chat_members')} cm ON cm.user_id = u.id
                    WHERE cm.chat_id = %s AND u.id != %s LIMIT 1
                """, (chat["id"], user["id"]))
                partner = cur.fetchone()
                if partner:
                    chat["partner"] = dict(partner)
            if chat["type"] == "group":
                cur.execute(f"SELECT COUNT(*) AS cnt FROM {t('chat_members')} WHERE chat_id = %s", (chat["id"],))
                chat["members_count"] = cur.fetchone()["cnt"]

        return ok({"chats": chats})

    # Создать групповой чат
    if action == "chat-create" and method == "POST":
        name = (body.get("name") or "").strip()
        member_ids = body.get("member_ids") or []
        if not name:
            return err("Укажите название чата")
        if not member_ids:
            return err("Добавьте участников")

        # Проверяем что все участники — принятые контакты
        cur.execute(f"""
            SELECT CASE WHEN requester_id = %s THEN target_id ELSE requester_id END AS contact_id
            FROM {t('contacts')} WHERE (requester_id = %s OR target_id = %s) AND status = 'accepted'
        """, (user["id"], user["id"], user["id"]))
        accepted_ids = {row["contact_id"] for row in cur.fetchall()}
        invalid = [mid for mid in member_ids if mid not in accepted_ids]
        if invalid:
            return err("Можно добавлять только контакты")

        cur.execute(f"INSERT INTO {t('chats')} (type, name, created_by) VALUES ('group', %s, %s) RETURNING id", (name, user["id"]))
        chat_id = cur.fetchone()["id"]

        all_members = list(set([user["id"]] + member_ids))
        args = [(chat_id, mid) for mid in all_members]
        cur.executemany(f"INSERT INTO {t('chat_members')} (chat_id, user_id) VALUES (%s, %s)", args)
        conn.commit()
        return ok({"chat_id": chat_id, "message": "Чат создан"})

    # Сообщения чата
    if action == "chat-messages" and method == "GET":
        chat_id = params.get("chat_id")
        if not chat_id:
            return err("Укажите чат")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(f"""
            SELECT m.id, m.content, m.created_at, m.sender_id,
                u.name AS sender_name, u.callsign AS sender_callsign
            FROM {t('messages')} m
            JOIN {t('users')} u ON u.id = m.sender_id
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
            LIMIT 100
        """, (chat_id,))
        messages = [dict(m) for m in cur.fetchall()]

        # Отметить как прочитанное
        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()

        return ok({"messages": messages})

    # Отправить сообщение
    if action == "message-send" and method == "POST":
        chat_id = body.get("chat_id")
        content = (body.get("content") or "").strip()
        if not chat_id or not content:
            return err("Укажите чат и сообщение")
        if len(content) > 2000:
            return err("Сообщение слишком длинное")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(
            f"INSERT INTO {t('messages')} (chat_id, sender_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
            (chat_id, user["id"], content)
        )
        msg = cur.fetchone()
        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()

        return ok({"message": {"id": msg["id"], "chat_id": chat_id, "sender_id": user["id"], "sender_name": user["name"], "sender_callsign": user["callsign"], "content": content, "created_at": msg["created_at"]}})

    return err("Не найдено", 404)
