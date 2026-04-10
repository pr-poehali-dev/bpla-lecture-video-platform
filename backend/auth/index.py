"""
Аутентификация пользователей: регистрация, вход, проверка сессии, выход, загрузка аватара.
Роутинг через query param ?action=register|login|me|logout|update-profile|upload-avatar
Вход выполняется по позывному (callsign) и паролю.
"""
import json
import os
import hashlib
import secrets
import base64
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
}

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def q(table: str) -> str:
    return f'"{get_schema()}".{table}'

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

PAGES = ["home", "lectures", "videos", "drone-types", "materials", "firmware", "discussions", "downloads"]

def get_permissions(cur, role: str) -> dict:
    if not role:
        return {p: True for p in PAGES}
    cur.execute(f'SELECT page, allowed FROM "{get_schema()}".role_permissions WHERE role = %s', (role,))
    rows = cur.fetchall()
    perms = {p: True for p in PAGES}
    for row in rows:
        perms[row["page"]] = row["allowed"]
    return perms

def refresh_permissions_cache(cur, conn, user_id: int, role: str, is_admin: bool) -> dict:
    perms = {p: True for p in PAGES} if is_admin else get_permissions(cur, role)
    cur.execute(
        f"UPDATE {q('users')} SET permissions_cache = %s WHERE id = %s",
        (json.dumps(perms), user_id)
    )
    conn.commit()
    return perms

def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}

def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def user_fields():
    return "id, name, callsign, email, status, is_admin, rank, contacts, avatar_url, role, permissions_cache, gender"

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
        callsign = (body.get("callsign") or "").strip()
        rank = (body.get("rank") or "").strip()
        gender = (body.get("gender") or "").strip()

        if not email or not password or not name or not callsign:
            return err("Заполните все поля")
        if not rank:
            return err("Укажите звание")
        if not gender or gender not in ("male", "female"):
            return err("Укажите пол")
        if len(password) < 6:
            return err("Пароль минимум 6 символов")

        cur.execute(f"SELECT id FROM {q('users')} WHERE email = %s OR callsign = %s", (email, callsign))
        existing = cur.fetchone()
        if existing:
            cur.execute(f"SELECT id FROM {q('users')} WHERE email = %s", (email,))
            return err("Email уже зарегистрирован") if cur.fetchone() else err("Позывной уже занят")

        pw_hash = hash_password(password)
        cur.execute(
            f"INSERT INTO {q('users')} (email, password_hash, name, callsign, rank, gender, status) VALUES (%s, %s, %s, %s, %s, %s, 'pending') RETURNING id",
            (email, pw_hash, name, callsign, rank, gender)
        )
        conn.commit()
        return ok({"message": "Заявка отправлена. Ожидайте одобрения администратора."}, 201)

    # login — по позывному
    if action == "login" and method == "POST":
        callsign = (body.get("callsign") or "").strip()
        password = body.get("password") or ""

        if not callsign or not password:
            return err("Введите позывной и пароль")

        pw_hash = hash_password(password)
        cur.execute(
            f"SELECT {user_fields()} FROM {q('users')} WHERE callsign = %s AND password_hash = %s",
            (callsign, pw_hash)
        )
        user = cur.fetchone()

        if not user:
            return err("Неверный позывной или пароль", 401)

        status = user["status"]
        if status == "pending":
            return err("pending", 403)
        if status == "rejected":
            return err("rejected", 403)

        token = secrets.token_hex(32)

        # Используем кэш прав или пересчитываем
        if user["permissions_cache"]:
            perms = user["permissions_cache"] if isinstance(user["permissions_cache"], dict) else json.loads(user["permissions_cache"])
            cur.execute(f"UPDATE {q('users')} SET session_token = %s WHERE id = %s", (token, user["id"]))
        else:
            perms = {p: True for p in PAGES} if user["is_admin"] else get_permissions(cur, user["role"])
            cur.execute(
                f"UPDATE {q('users')} SET session_token = %s, permissions_cache = %s WHERE id = %s",
                (token, json.dumps(perms), user["id"])
            )
        conn.commit()

        return ok({
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "callsign": user["callsign"],
                "email": user["email"],
                "is_admin": user["is_admin"],
                "status": status,
                "rank": user["rank"],
                "contacts": user["contacts"],
                "avatar_url": user["avatar_url"],
                "role": user["role"],
                "permissions": perms,
            }
        })

    # me
    if action == "me" and method == "GET":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Не авторизован", 401)

        cur.execute(
            f"UPDATE {q('users')} SET last_seen = NOW() WHERE session_token = %s RETURNING {user_fields()}",
            (token,)
        )
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Сессия недействительна", 401)

        # Читаем права из кэша — без лишнего запроса к role_permissions
        if user["permissions_cache"]:
            perms = user["permissions_cache"] if isinstance(user["permissions_cache"], dict) else json.loads(user["permissions_cache"])
        else:
            perms = refresh_permissions_cache(cur, conn, user["id"], user["role"], user["is_admin"])

        user_dict = dict(user)
        user_dict.pop("permissions_cache", None)
        user_dict["permissions"] = perms
        return ok({"user": user_dict})

    # logout
    if action == "logout" and method == "POST":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if token:
            cur.execute(f"UPDATE {q('users')} SET session_token = NULL WHERE session_token = %s", (token,))
            conn.commit()
        return ok({"message": "Выход выполнен"})

    # update-profile
    if action == "update-profile" and method == "POST":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Не авторизован", 401)

        cur.execute(f"SELECT id, is_admin, role FROM {q('users')} WHERE session_token = %s", (token,))
        user = cur.fetchone()
        if not user:
            return err("Сессия недействительна", 401)

        name = (body.get("name") or "").strip()
        rank = (body.get("rank") or "").strip()
        contacts = (body.get("contacts") or "").strip()
        gender = (body.get("gender") or "").strip()

        if not name:
            return err("Имя не может быть пустым")
        if gender and gender not in ("male", "female"):
            return err("Недопустимое значение пола")

        cur.execute(
            f"UPDATE {q('users')} SET name = %s, rank = %s, contacts = %s, gender = %s WHERE id = %s",
            (name, rank or None, contacts or None, gender or None, user["id"])
        )
        conn.commit()

        cur.execute(f"SELECT {user_fields()} FROM {q('users')} WHERE id = %s", (user["id"],))
        updated = cur.fetchone()
        updated_dict = dict(updated)

        if updated_dict.get("permissions_cache"):
            perms = updated_dict["permissions_cache"] if isinstance(updated_dict["permissions_cache"], dict) else json.loads(updated_dict["permissions_cache"])
        else:
            perms = refresh_permissions_cache(cur, conn, user["id"], updated_dict.get("role"), updated_dict.get("is_admin"))

        updated_dict.pop("permissions_cache", None)
        updated_dict["permissions"] = perms
        return ok({"user": updated_dict})

    # upload-avatar
    if action == "upload-avatar" and method == "POST":
        auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Не авторизован", 401)

        cur.execute(f"SELECT id FROM {q('users')} WHERE session_token = %s", (token,))
        user = cur.fetchone()
        if not user:
            return err("Сессия недействительна", 401)

        image_data = body.get("image_data") or ""
        image_ext = (body.get("image_ext") or "jpg").lower().strip(".")

        if not image_data:
            return err("Нет данных изображения")
        if image_ext not in ("jpg", "jpeg", "png", "gif", "webp"):
            return err("Недопустимый формат")

        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
        if len(img_bytes) > 5 * 1024 * 1024:
            return err("Изображение слишком большое (макс. 5 МБ)")

        import boto3
        s3 = boto3.client("s3",
            endpoint_url="https://bucket.poehali.dev",
            aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"]
        )

        key = f"avatars/{uuid.uuid4()}.{image_ext}"
        content_type = f"image/{'jpeg' if image_ext in ('jpg', 'jpeg') else image_ext}"
        s3.put_object(Bucket="files", Key=key, Body=img_bytes, ContentType=content_type)

        avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.execute(f"UPDATE {q('users')} SET avatar_url = %s WHERE id = %s", (avatar_url, user["id"]))
        conn.commit()

        return ok({"avatar_url": avatar_url})

    return err("Не найдено", 404)