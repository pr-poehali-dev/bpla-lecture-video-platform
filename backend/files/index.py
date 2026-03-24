"""
Функция для управления файлами: видео и документы.
Поддерживает загрузку, список, удаление файлов через S3.
Поддерживает секции: general (материалы) и firmware (прошивки FPV КТ).
"""

import json
import os
import base64
import uuid
import psycopg2
import boto3

ALLOWED_VIDEO = {"video/mp4", "video/webm", "video/x-matroska", "video/quicktime", "video/avi"}
ALLOWED_DOC = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def esc(val):
    return str(val).replace("'", "''")


def get_user_from_token(cur, token: str, schema: str):
    cur.execute(
        f"SELECT id, name, is_admin, role FROM {schema}.users WHERE session_token = %s AND status = 'approved'",
        (token,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "name": row[1], "is_admin": row[2], "role": row[3]}


def can_upload(user: dict) -> bool:
    return user["is_admin"] or user.get("role") in ("инструктор", "администратор")


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    schema = os.environ["MAIN_DB_SCHEMA"]
    conn = get_db()
    cur = conn.cursor()

    # GET /files - список файлов
    if method == "GET":
        params = event.get("queryStringParameters") or {}
        file_type = params.get("type")
        category = params.get("category")
        section = params.get("section")

        limit = min(int(params.get("limit", 50)), 100)
        offset = max(int(params.get("offset", 0)), 0)

        where = "WHERE 1=1"
        if file_type:
            where += f" AND f.file_type = '{esc(file_type)}'"
        if category:
            where += f" AND f.category = '{esc(category)}'"
        if section:
            where += f" AND f.section = '{esc(section)}'"

        cur.execute(f"SELECT COUNT(*) FROM {schema}.files f {where}")
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT f.id, f.title, f.description, f.file_type, f.category,
                   f.original_name, f.mime_type, f.file_size, f.cdn_url,
                   f.created_at, u.name as uploader, f.section
            FROM {schema}.files f
            LEFT JOIN {schema}.users u ON f.uploaded_by = u.id
            {where}
            ORDER BY f.created_at DESC
            LIMIT {limit} OFFSET {offset}
        """)
        rows = cur.fetchall()
        conn.close()

        files = []
        for r in rows:
            files.append({
                "id": r[0],
                "title": r[1],
                "description": r[2],
                "file_type": r[3],
                "category": r[4],
                "original_name": r[5],
                "mime_type": r[6],
                "file_size": r[7],
                "cdn_url": r[8],
                "created_at": r[9].isoformat() if r[9] else None,
                "uploader": r[10],
                "section": r[11],
            })
        return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"files": files, "total": total, "limit": limit, "offset": offset})}

    # POST /files - загрузка файла (для инструкторов и администраторов)
    if method == "POST":
        token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
        user = get_user_from_token(cur, token, schema)
        if not user or not can_upload(user):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён. Загрузка доступна только инструкторам."})}

        body = json.loads(event.get("body") or "{}")
        title = body.get("title", "").strip()
        description = body.get("description", "")
        category = body.get("category", "")
        section = body.get("section", "general")
        original_name = body.get("original_name", "file")
        mime_type = body.get("mime_type", "application/octet-stream")
        file_data_b64 = body.get("file_data", "")

        if not title:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите название"})}

        # YouTube — без загрузки в S3
        if mime_type == "youtube":
            youtube_id = body.get("youtube_id", "").strip()
            if not youtube_id:
                conn.close()
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите youtube_id"})}
            cdn_url = f"https://www.youtube.com/embed/{youtube_id}"
            s3_key = f"youtube/{youtube_id}"
            cur.execute(f"""
                INSERT INTO {schema}.files
                    (title, description, file_type, category, section, original_name, mime_type, file_size, s3_key, cdn_url, uploaded_by)
                VALUES ('{esc(title)}', '{esc(description)}', 'video', '{esc(category)}', '{esc(section)}',
                        '{esc(youtube_id)}', 'youtube', 0, '{esc(s3_key)}', '{esc(cdn_url)}', {user['id']})
                RETURNING id
            """)
            new_id = cur.fetchone()[0]
            conn.commit()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "cdn_url": cdn_url, "file_type": "video"})}

        if mime_type in ALLOWED_VIDEO:
            file_type = "video"
        elif mime_type in ALLOWED_DOC:
            file_type = "document"
        else:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Формат не поддерживается: {mime_type}"})}

        file_bytes = base64.b64decode(file_data_b64)
        file_size = len(file_bytes)

        ext = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
        s3_key = f"{file_type}s/{uuid.uuid4()}.{ext}"

        s3 = get_s3()
        s3.put_object(Bucket="files", Key=s3_key, Body=file_bytes, ContentType=mime_type)

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

        cur.execute(f"""
            INSERT INTO {schema}.files
                (title, description, file_type, category, section, original_name, mime_type, file_size, s3_key, cdn_url, uploaded_by)
            VALUES ('{esc(title)}', '{esc(description)}', '{esc(file_type)}', '{esc(category)}', '{esc(section)}',
                    '{esc(original_name)}', '{esc(mime_type)}', {file_size}, '{esc(s3_key)}', '{esc(cdn_url)}', {user['id']})
            RETURNING id
        """)
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id, "cdn_url": cdn_url, "file_type": file_type})}

    # DELETE /files?id=X (только для администраторов)
    if method == "DELETE":
        token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")
        user = get_user_from_token(cur, token, schema)
        if not user or not user["is_admin"]:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Удаление материалов доступно только администраторам"})}

        params = event.get("queryStringParameters") or {}
        file_id = params.get("id")
        if not file_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите id"})}

        cur.execute(f"SELECT s3_key, mime_type FROM {schema}.files WHERE id = {int(file_id)}")
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Файл не найден"})}

        s3_key, mime_type = row
        if mime_type != "youtube":
            s3 = get_s3()
            s3.delete_object(Bucket="files", Key=s3_key)

        cur.execute(f"DELETE FROM {schema}.files WHERE id = {int(file_id)}")
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}