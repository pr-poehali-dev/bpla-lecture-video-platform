"""
Личные сообщения: контакты, чаты, переписка, отправка картинок.
Действия: contacts-list, contact-request, contact-respond,
          chats-list, chat-create, chat-messages, message-send,
          image-send, users-search, message-remove, chat-leave,
          chat-clear, chat-rename, typing-set, typing-get,
          message-react, message-reply
"""
import json
import os
import base64
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
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
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or event.get("headers", {}).get("Authorization") or event.get("headers", {}).get("authorization") or ""
    return auth.replace("Bearer ", "").strip()

def handler(event: dict, context) -> dict:
    """Обработчик сообщений: чаты, контакты, переписка."""
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
                u.name, u.callsign, u.rank, u.last_seen,
                (SELECT cm.chat_id FROM {t('chat_members')} cm
                 JOIN {t('chats')} ch ON ch.id = cm.chat_id
                 WHERE ch.type = 'direct' AND cm.user_id = %s
                   AND EXISTS (SELECT 1 FROM {t('chat_members')} cm2 WHERE cm2.chat_id = cm.chat_id AND cm2.user_id = u.id)
                 LIMIT 1) AS chat_id
            FROM {t('contacts')} c
            JOIN {t('users')} u ON u.id = CASE WHEN c.requester_id = %s THEN c.target_id ELSE c.requester_id END
            WHERE c.requester_id = %s OR c.target_id = %s
            ORDER BY c.updated_at DESC
        """, (user["id"], user["id"], user["id"], user["id"], user["id"]))
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
        response = body.get("response")
        if not contact_id or response not in ("accept", "reject"):
            return err("Неверные параметры")

        cur.execute(f"SELECT * FROM {t('contacts')} WHERE id = %s AND target_id = %s AND status = 'pending'", (contact_id, user["id"]))
        contact = cur.fetchone()
        if not contact:
            return err("Заявка не найдена")

        new_status = "accepted" if response == "accept" else "rejected"
        cur.execute(f"UPDATE {t('contacts')} SET status = %s, updated_at = NOW() WHERE id = %s", (new_status, contact_id))

        if response == "accept":
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

    # Открыть / создать direct-чат с контактом
    if action == "direct-open" and method == "POST":
        target_id = body.get("target_id")
        if not target_id:
            return err("Укажите target_id")
        cur.execute(f"SELECT id FROM {t('contacts')} WHERE status = 'accepted' AND ((requester_id = %s AND target_id = %s) OR (requester_id = %s AND target_id = %s))", (user["id"], target_id, target_id, user["id"]))
        if not cur.fetchone():
            return err("Пользователь не в контактах")
        cur.execute(f"""
            SELECT cm1.chat_id FROM {t('chat_members')} cm1
            JOIN {t('chat_members')} cm2 ON cm1.chat_id = cm2.chat_id
            JOIN {t('chats')} ch ON ch.id = cm1.chat_id
            WHERE cm1.user_id = %s AND cm2.user_id = %s AND ch.type = 'direct'
        """, (user["id"], target_id))
        row = cur.fetchone()
        if row:
            chat_id = row["chat_id"]
        else:
            cur.execute(f"INSERT INTO {t('chats')} (type, created_by) VALUES ('direct', %s) RETURNING id", (user["id"],))
            chat_id = cur.fetchone()["id"]
            cur.execute(f"INSERT INTO {t('chat_members')} (chat_id, user_id) VALUES (%s, %s), (%s, %s)", (chat_id, user["id"], chat_id, target_id))
            conn.commit()
        return ok({"chat_id": chat_id})

    # Список чатов
    if action == "chats-list" and method == "GET":
        cur.execute(f"""
            SELECT ch.id, ch.type, ch.name, ch.created_at,
                (SELECT content FROM {t('messages')} m WHERE m.chat_id = ch.id AND m.hidden = FALSE ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT m.created_at FROM {t('messages')} m WHERE m.chat_id = ch.id AND m.hidden = FALSE ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                (SELECT COUNT(*) FROM {t('messages')} m WHERE m.chat_id = ch.id AND m.created_at > cm.last_read_at AND m.sender_id != %s AND m.hidden = FALSE) AS unread_count
            FROM {t('chats')} ch
            JOIN {t('chat_members')} cm ON cm.chat_id = ch.id AND cm.user_id = %s
            ORDER BY last_message_at DESC NULLS LAST
        """, (user["id"], user["id"]))
        chats = [dict(c) for c in cur.fetchall()]

        if chats:
            chat_ids = [c["id"] for c in chats]
            ids_placeholder = ",".join(["%s"] * len(chat_ids))

            cur.execute(f"""
                SELECT cm.chat_id, u.id, u.name, u.callsign, u.rank, u.last_seen, u.avatar_url
                FROM {t('chat_members')} cm
                JOIN {t('users')} u ON u.id = cm.user_id
                WHERE cm.chat_id IN ({ids_placeholder}) AND cm.user_id != %s
            """, (*chat_ids, user["id"]))
            partners_by_chat = {}
            for row in cur.fetchall():
                partners_by_chat[row["chat_id"]] = {"id": row["id"], "name": row["name"], "callsign": row["callsign"], "rank": row["rank"], "last_seen": row["last_seen"], "avatar_url": row["avatar_url"]}

            cur.execute(f"""
                SELECT chat_id, COUNT(*) AS cnt
                FROM {t('chat_members')}
                WHERE chat_id IN ({ids_placeholder})
                GROUP BY chat_id
            """, tuple(chat_ids))
            members_count_by_chat = {row["chat_id"]: row["cnt"] for row in cur.fetchall()}

            for chat in chats:
                if chat["type"] == "direct":
                    partner = partners_by_chat.get(chat["id"])
                    if partner:
                        chat["partner"] = partner
                elif chat["type"] == "group":
                    chat["members_count"] = members_count_by_chat.get(chat["id"], 0)

        return ok({"chats": chats})

    # Создать групповой чат
    if action == "chat-create" and method == "POST":
        name = (body.get("name") or "").strip()
        member_ids = body.get("member_ids") or []
        if not name:
            return err("Укажите название чата")
        if not member_ids:
            return err("Добавьте участников")

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

    # Переименовать групповой чат
    if action == "chat-rename" and method == "POST":
        chat_id = body.get("chat_id")
        new_name = (body.get("name") or "").strip()
        if not chat_id or not new_name:
            return err("Укажите chat_id и название")

        cur.execute(f"SELECT ch.id, ch.type, ch.created_by FROM {t('chats')} ch JOIN {t('chat_members')} cm ON cm.chat_id = ch.id AND cm.user_id = %s WHERE ch.id = %s", (user["id"], chat_id))
        chat = cur.fetchone()
        if not chat:
            return err("Чат не найден", 404)
        if chat["type"] != "group":
            return err("Можно переименовать только групповой чат")
        if chat["created_by"] != user["id"]:
            return err("Только создатель может переименовать чат", 403)

        cur.execute(f"UPDATE {t('chats')} SET name = %s WHERE id = %s", (new_name, chat_id))
        conn.commit()
        return ok({"message": "Чат переименован", "name": new_name})

    # Выйти из чата
    if action == "chat-leave" and method == "POST":
        chat_id = body.get("chat_id")
        if not chat_id:
            return err("Укажите chat_id")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Вы не участник этого чата", 403)

        cur.execute(f"UPDATE {t('chat_members')} SET user_id = -1 WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()
        return ok({"message": "Вы вышли из чата"})

    # Очистить историю чата (только для себя — скрыть все старые)
    if action == "chat-clear" and method == "POST":
        chat_id = body.get("chat_id")
        if not chat_id:
            return err("Укажите chat_id")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()
        return ok({"message": "История очищена"})

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
                m.image_url, m.message_type, m.hidden, m.reply_to_id, m.reactions,
                u.name AS sender_name, u.callsign AS sender_callsign,
                u.avatar_url AS sender_avatar_url,
                rm.content AS reply_content,
                ru.callsign AS reply_callsign
            FROM {t('messages')} m
            JOIN {t('users')} u ON u.id = m.sender_id
            LEFT JOIN {t('messages')} rm ON rm.id = m.reply_to_id
            LEFT JOIN {t('users')} ru ON ru.id = rm.sender_id
            WHERE m.chat_id = %s
            ORDER BY m.created_at ASC
            LIMIT 200
        """, (chat_id,))
        messages = [dict(m) for m in cur.fetchall()]

        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()

        return ok({"messages": messages})

    # Отправить сообщение
    if action == "message-send" and method == "POST":
        chat_id = body.get("chat_id")
        content = (body.get("content") or "").strip()
        reply_to_id = body.get("reply_to_id")
        if not chat_id or not content:
            return err("Укажите чат и сообщение")
        if len(content) > 2000:
            return err("Сообщение слишком длинное")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(
            f"INSERT INTO {t('messages')} (chat_id, sender_id, content, message_type, reply_to_id) VALUES (%s, %s, %s, 'text', %s) RETURNING id, created_at",
            (chat_id, user["id"], content, reply_to_id)
        )
        msg = cur.fetchone()
        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()

        cur.execute(f"SELECT avatar_url FROM {t('users')} WHERE id = %s", (user["id"],))
        urow = cur.fetchone()

        reply_data = None
        if reply_to_id:
            cur.execute(f"SELECT m.content, u.callsign FROM {t('messages')} m JOIN {t('users')} u ON u.id = m.sender_id WHERE m.id = %s", (reply_to_id,))
            rrow = cur.fetchone()
            if rrow:
                reply_data = {"content": rrow["content"], "callsign": rrow["callsign"]}

        return ok({"message": {
            "id": msg["id"], "chat_id": chat_id, "sender_id": user["id"],
            "sender_name": user["name"], "sender_callsign": user["callsign"],
            "sender_avatar_url": urow["avatar_url"] if urow else None,
            "content": content, "image_url": None, "message_type": "text",
            "created_at": msg["created_at"], "hidden": False,
            "reply_to_id": reply_to_id, "reply_content": reply_data["content"] if reply_data else None,
            "reply_callsign": reply_data["callsign"] if reply_data else None,
            "reactions": {}
        }})

    # Отправить картинку
    if action == "image-send" and method == "POST":
        chat_id = body.get("chat_id")
        image_data = body.get("image_data")
        image_ext = body.get("image_ext", "jpg").lower().strip(".")
        caption = (body.get("caption") or "").strip()[:500]
        reply_to_id = body.get("reply_to_id")
        if not chat_id or not image_data:
            return err("Укажите чат и изображение")
        if image_ext not in ("jpg", "jpeg", "png", "gif", "webp"):
            return err("Недопустимый формат изображения")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
        if len(img_bytes) > 10 * 1024 * 1024:
            return err("Изображение слишком большое (макс. 10 МБ)")

        import boto3
        s3 = boto3.client("s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"]
        )
        key = f"chat-images/{uuid.uuid4().hex}.{image_ext}"
        mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
        s3.put_object(Bucket="files", Key=key, Body=img_bytes, ContentType=mime_map.get(image_ext, "image/jpeg"))
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        content_text = caption if caption else "📷 Изображение"
        cur.execute(
            f"INSERT INTO {t('messages')} (chat_id, sender_id, content, image_url, message_type, reply_to_id) VALUES (%s, %s, %s, %s, 'image', %s) RETURNING id, created_at",
            (chat_id, user["id"], content_text, cdn_url, reply_to_id)
        )
        msg = cur.fetchone()
        cur.execute(f"UPDATE {t('chat_members')} SET last_read_at = NOW() WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        conn.commit()

        cur.execute(f"SELECT avatar_url FROM {t('users')} WHERE id = %s", (user["id"],))
        urow2 = cur.fetchone()
        return ok({"message": {
            "id": msg["id"], "chat_id": chat_id, "sender_id": user["id"],
            "sender_name": user["name"], "sender_callsign": user["callsign"],
            "sender_avatar_url": urow2["avatar_url"] if urow2 else None,
            "content": content_text, "image_url": cdn_url, "message_type": "image",
            "created_at": msg["created_at"], "hidden": False,
            "reply_to_id": reply_to_id, "reply_content": None, "reply_callsign": None,
            "reactions": {}
        }})

    # Удалить сообщение (скрыть)
    if action == "message-remove" and method == "POST":
        message_id = body.get("message_id")
        if not message_id:
            return err("Укажите message_id")

        cur.execute(f"SELECT m.id, m.sender_id, m.chat_id FROM {t('messages')} m WHERE m.id = %s", (message_id,))
        msg = cur.fetchone()
        if not msg:
            return err("Сообщение не найдено", 404)

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (msg["chat_id"], user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        if msg["sender_id"] != user["id"]:
            return err("Можно удалять только свои сообщения", 403)

        cur.execute(f"UPDATE {t('messages')} SET hidden = TRUE, content = 'Сообщение удалено' WHERE id = %s", (message_id,))
        conn.commit()
        return ok({"message_id": message_id, "ok": True})

    # Реакция на сообщение
    if action == "message-react" and method == "POST":
        message_id = body.get("message_id")
        emoji = (body.get("emoji") or "").strip()
        if not message_id or not emoji:
            return err("Укажите message_id и emoji")
        if len(emoji) > 8:
            return err("Недопустимый emoji")

        cur.execute(f"SELECT m.id, m.chat_id, m.reactions FROM {t('messages')} m WHERE m.id = %s", (message_id,))
        msg = cur.fetchone()
        if not msg:
            return err("Сообщение не найдено", 404)

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (msg["chat_id"], user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        reactions = msg["reactions"] if isinstance(msg["reactions"], dict) else {}
        uid_str = str(user["id"])
        if emoji not in reactions:
            reactions[emoji] = []
        if uid_str in reactions[emoji]:
            reactions[emoji].remove(uid_str)
            if not reactions[emoji]:
                del reactions[emoji]
        else:
            reactions[emoji].append(uid_str)

        cur.execute(f"UPDATE {t('messages')} SET reactions = %s WHERE id = %s", (json.dumps(reactions), message_id))
        conn.commit()
        return ok({"message_id": message_id, "reactions": reactions})

    # Typing: установить статус набора
    if action == "typing-set" and method == "POST":
        chat_id = body.get("chat_id")
        if not chat_id:
            return err("Укажите chat_id")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(
            f"INSERT INTO {t('typing_status')} (chat_id, user_id, updated_at) VALUES (%s, %s, NOW()) ON CONFLICT (chat_id, user_id) DO UPDATE SET updated_at = NOW()",
            (chat_id, user["id"])
        )
        conn.commit()
        return ok({"ok": True})

    # Typing: получить кто печатает
    if action == "typing-get" and method == "GET":
        chat_id = params.get("chat_id")
        if not chat_id:
            return err("Укажите chat_id")

        cur.execute(f"SELECT id FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s", (chat_id, user["id"]))
        if not cur.fetchone():
            return err("Нет доступа", 403)

        cur.execute(f"""
            SELECT u.callsign FROM {t('typing_status')} ts
            JOIN {t('users')} u ON u.id = ts.user_id
            WHERE ts.chat_id = %s AND ts.user_id != %s
              AND ts.updated_at > NOW() - INTERVAL '5 seconds'
        """, (chat_id, user["id"]))
        typing = [row["callsign"] for row in cur.fetchall()]
        return ok({"typing": typing})

    return err("Не найдено", 404)