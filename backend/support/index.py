"""
Чат поддержки: пользователи создают тикеты, администрация отвечает и делает рассылки.
Действия: ticket-create, ticket-list, ticket-messages, ticket-reply, ticket-close,
          admin-tickets, admin-reply, admin-broadcast, broadcast-list, admin-file-send
"""
import json
import os
import base64
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3

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
    cur.execute(f"SELECT id, name, callsign, rank, is_admin FROM {t('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    return cur.fetchone()

def extract_token(event):
    auth = (event.get("headers") or {}).get("X-Authorization") or (event.get("headers") or {}).get("x-authorization") or (event.get("headers") or {}).get("Authorization") or (event.get("headers") or {}).get("authorization") or ""
    return auth.replace("Bearer ", "").strip()

def upload_file(data_url: str, ext: str) -> str:
    header, b64 = data_url.split(",", 1)
    data = base64.b64decode(b64)
    key = f"support/{uuid.uuid4()}.{ext}"
    s3 = boto3.client("s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    content_types = {"pdf": "application/pdf", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "gif": "image/gif", "mp4": "video/mp4", "zip": "application/zip"}
    ct = content_types.get(ext.lower(), "application/octet-stream")
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=ct)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def handler(event: dict, context) -> dict:
    """Чат поддержки: тикеты пользователей и ответы администрации."""
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
    if not user:
        return err("Не авторизован", 401)

    # ── ПОЛЬЗОВАТЕЛЬ: создать тикет ──
    if action == "ticket-create" and method == "POST":
        subject = (body.get("subject") or "").strip()
        content = (body.get("content") or "").strip()
        if not subject:
            return err("Укажите тему обращения")
        if not content:
            return err("Напишите текст обращения")
        cur.execute(
            f"INSERT INTO {t('support_tickets')} (user_id, subject, status) VALUES (%s, %s, 'open') RETURNING id",
            (user["id"], subject)
        )
        ticket_id = cur.fetchone()["id"]
        cur.execute(
            f"INSERT INTO {t('support_messages')} (ticket_id, sender_id, is_admin, content) VALUES (%s, %s, FALSE, %s)",
            (ticket_id, user["id"], content)
        )
        conn.commit()
        return ok({"ticket_id": ticket_id})

    # ── ПОЛЬЗОВАТЕЛЬ: список своих тикетов ──
    if action == "ticket-list" and method == "GET":
        cur.execute(f"""
            SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                (SELECT COUNT(*) FROM {t('support_messages')} m WHERE m.ticket_id = t.id) AS message_count,
                (SELECT m.content FROM {t('support_messages')} m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT m.created_at FROM {t('support_messages')} m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
            FROM {t('support_tickets')} t
            WHERE t.user_id = %s
            ORDER BY t.updated_at DESC
        """, (user["id"],))
        tickets = cur.fetchall()
        return ok({"tickets": tickets})

    # ── ПОЛЬЗОВАТЕЛЬ: сообщения тикета ──
    if action == "ticket-messages" and method == "GET":
        ticket_id = params.get("ticket_id")
        if not ticket_id:
            return err("Укажите ticket_id")
        cur.execute(f"SELECT id FROM {t('support_tickets')} WHERE id = %s AND user_id = %s", (ticket_id, user["id"]))
        if not cur.fetchone():
            return err("Тикет не найден", 404)
        cur.execute(f"""
            SELECT m.id, m.sender_id, m.is_admin, m.content, m.file_url, m.file_name, m.file_type, m.created_at,
                u.callsign AS sender_callsign, u.name AS sender_name
            FROM {t('support_messages')} m
            JOIN {t('users')} u ON u.id = m.sender_id
            WHERE m.ticket_id = %s
            ORDER BY m.created_at ASC
        """, (ticket_id,))
        messages = cur.fetchall()
        return ok({"messages": messages})

    # ── ПОЛЬЗОВАТЕЛЬ: ответить в тикет ──
    if action == "ticket-reply" and method == "POST":
        ticket_id = body.get("ticket_id")
        content = (body.get("content") or "").strip()
        if not ticket_id or not content:
            return err("Укажите ticket_id и content")
        cur.execute(f"SELECT id, status FROM {t('support_tickets')} WHERE id = %s AND user_id = %s", (ticket_id, user["id"]))
        ticket = cur.fetchone()
        if not ticket:
            return err("Тикет не найден", 404)
        if ticket["status"] == "closed":
            return err("Тикет закрыт")
        cur.execute(
            f"INSERT INTO {t('support_messages')} (ticket_id, sender_id, is_admin, content) VALUES (%s, %s, FALSE, %s) RETURNING id",
            (ticket_id, user["id"], content)
        )
        msg_id = cur.fetchone()["id"]
        cur.execute(f"UPDATE {t('support_tickets')} SET status = 'open', updated_at = NOW() WHERE id = %s", (ticket_id,))
        conn.commit()
        return ok({"message_id": msg_id})

    # ── ПОЛЬЗОВАТЕЛЬ: закрыть тикет ──
    if action == "ticket-close" and method == "POST":
        ticket_id = body.get("ticket_id")
        cur.execute(f"UPDATE {t('support_tickets')} SET status = 'closed', updated_at = NOW() WHERE id = %s AND user_id = %s", (ticket_id, user["id"]))
        conn.commit()
        return ok({"ok": True})

    # ── РАССЫЛКИ: список для пользователя ──
    if action == "broadcast-list" and method == "GET":
        cur.execute(f"""
            SELECT b.id, b.content, b.file_url, b.file_name, b.file_type, b.created_at,
                u.callsign AS admin_callsign, u.name AS admin_name
            FROM {t('support_broadcasts')} b
            JOIN {t('users')} u ON u.id = b.admin_id
            ORDER BY b.created_at DESC
            LIMIT 50
        """)
        broadcasts = cur.fetchall()
        return ok({"broadcasts": broadcasts})

    # ─────── ADMIN ONLY ───────
    if not user.get("is_admin"):
        return err("Доступ запрещён", 403)

    # ── АДМИН: все тикеты ──
    if action == "admin-tickets" and method == "GET":
        status_filter = params.get("status", "")
        where = f"WHERE t.status = '{status_filter}'" if status_filter in ("open", "answered", "closed") else ""
        cur.execute(f"""
            SELECT t.id, t.subject, t.status, t.created_at, t.updated_at,
                u.callsign AS user_callsign, u.name AS user_name,
                (SELECT COUNT(*) FROM {t('support_messages')} m WHERE m.ticket_id = t.id) AS message_count,
                (SELECT m.content FROM {t('support_messages')} m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                (SELECT m.created_at FROM {t('support_messages')} m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at
            FROM {t('support_tickets')} t
            JOIN {t('users')} u ON u.id = t.user_id
            {where}
            ORDER BY t.updated_at DESC
        """)
        tickets = cur.fetchall()
        return ok({"tickets": tickets})

    # ── АДМИН: сообщения тикета ──
    if action == "admin-ticket-messages" and method == "GET":
        ticket_id = params.get("ticket_id")
        if not ticket_id:
            return err("Укажите ticket_id")
        cur.execute(f"""
            SELECT m.id, m.sender_id, m.is_admin, m.content, m.file_url, m.file_name, m.file_type, m.created_at,
                u.callsign AS sender_callsign, u.name AS sender_name
            FROM {t('support_messages')} m
            JOIN {t('users')} u ON u.id = m.sender_id
            WHERE m.ticket_id = %s
            ORDER BY m.created_at ASC
        """, (ticket_id,))
        messages = cur.fetchall()
        cur.execute(f"SELECT t.id, t.subject, t.status, u.callsign, u.name FROM {t('support_tickets')} t JOIN {t('users')} u ON u.id = t.user_id WHERE t.id = %s", (ticket_id,))
        ticket = cur.fetchone()
        return ok({"messages": messages, "ticket": ticket})

    # ── АДМИН: ответить в тикет (с опциональным файлом) ──
    if action == "admin-reply" and method == "POST":
        ticket_id = body.get("ticket_id")
        content = (body.get("content") or "").strip()
        file_data = body.get("file_data")
        file_name = body.get("file_name", "")
        file_ext = body.get("file_ext", "bin")
        if not ticket_id:
            return err("Укажите ticket_id")
        if not content and not file_data:
            return err("Нужен текст или файл")
        cur.execute(f"SELECT id FROM {t('support_tickets')} WHERE id = %s", (ticket_id,))
        if not cur.fetchone():
            return err("Тикет не найден", 404)
        file_url = None
        file_type = None
        if file_data:
            file_url = upload_file(file_data, file_ext)
            file_type = file_ext
        cur.execute(
            f"INSERT INTO {t('support_messages')} (ticket_id, sender_id, is_admin, content, file_url, file_name, file_type) VALUES (%s, %s, TRUE, %s, %s, %s, %s) RETURNING id",
            (ticket_id, user["id"], content or None, file_url, file_name or None, file_type)
        )
        cur.execute(f"UPDATE {t('support_tickets')} SET status = 'answered', updated_at = NOW() WHERE id = %s", (ticket_id,))
        conn.commit()
        return ok({"ok": True})

    # ── АДМИН: закрыть тикет ──
    if action == "admin-close" and method == "POST":
        ticket_id = body.get("ticket_id")
        cur.execute(f"UPDATE {t('support_tickets')} SET status = 'closed', updated_at = NOW() WHERE id = %s", (ticket_id,))
        conn.commit()
        return ok({"ok": True})

    # ── АДМИН: рассылка всем пользователям ──
    if action == "admin-broadcast" and method == "POST":
        content = (body.get("content") or "").strip()
        file_data = body.get("file_data")
        file_name = body.get("file_name", "")
        file_ext = body.get("file_ext", "bin")
        if not content and not file_data:
            return err("Нужен текст или файл")
        file_url = None
        file_type = None
        if file_data:
            file_url = upload_file(file_data, file_ext)
            file_type = file_ext
        cur.execute(
            f"INSERT INTO {t('support_broadcasts')} (admin_id, content, file_url, file_name, file_type) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (user["id"], content or "", file_url, file_name or None, file_type)
        )
        conn.commit()
        return ok({"ok": True})

    return err("Неизвестное действие", 404)
