"""
Аутентификация пользователей: регистрация, вход, проверка сессии, выход.
Роутинг через query param ?action=register|login|me|logout
"""
import json
import os
import hashlib
import secrets
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    return conn

def q(table: str) -> str:
    return f'"{get_schema()}".{table}'

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}

def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

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

    # register
    if action == "register" and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""
        name = (body.get("name") or "").strip()

        if not email or not password or not name:
            return err("Заполните все поля")
        if len(password) < 6:
            return err("Пароль минимум 6 символов")

        cur.execute(f"SELECT id FROM {q('users')} WHERE email = %s", (email,))
        if cur.fetchone():
            return err("Email уже зарегистрирован")

        pw_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {q('users')} (email, password_hash, name, status) VALUES (%s, %s, %s, 'pending') RETURNING id",
            (email, pw_hash, name)
        )
        conn.commit()
        return ok({"message": "Заявка отправлена. Ожидайте одобрения администратора."}, 201)

    # login
    if action == "login" and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password") or ""

        if not email or not password:
            return err("Введите email и пароль")

        pw_hash = hash_password(password)
        cur.execute(f"SELECT id, name, status, is_admin FROM {q('users')} WHERE email = %s AND password_hash = %s", (email, pw_hash))
        user = cur.fetchone()

        if not user:
            return err("Неверный email или пароль", 401)

        status = user["status"]
        if status == "pending":
            return err("pending", 403)
        if status == "rejected":
            return err("rejected", 403)

        token = secrets.token_hex(32)
        cur.execute(f"UPDATE {q('users')} SET session_token = %s WHERE id = %s", (token, user["id"]))
        conn.commit()

        return ok({
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": email,
                "is_admin": user["is_admin"],
                "status": status,
            }
        })

    # me
    if action == "me" and method == "GET":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Не авторизован", 401)

        cur.execute(f"SELECT id, name, email, status, is_admin FROM {q('users')} WHERE session_token = %s", (token,))
        user = cur.fetchone()
        if not user:
            return err("Сессия недействительна", 401)

        return ok({"user": dict(user)})

    # logout
    if action == "logout" and method == "POST":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if token:
            cur.execute(f"UPDATE {q('users')} SET session_token = NULL WHERE session_token = %s", (token,))
            conn.commit()
        return ok({"message": "Вышли из системы"})

    return err("Не найдено", 404)