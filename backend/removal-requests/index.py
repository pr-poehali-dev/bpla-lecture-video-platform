"""
Управление заявками на удаление файлов.
Инструктор подаёт заявку, администратор одобряет или отклоняет.
"""

import json
import os
import psycopg2
import boto3

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    """Заявки на удаление файлов: создание, просмотр, одобрение/отклонение."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    schema = os.environ["MAIN_DB_SCHEMA"]
    token = event.get("headers", {}).get("X-Authorization", "").replace("Bearer ", "")

    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, name, is_admin, role FROM {schema}.users WHERE session_token = %s AND status = 'approved'",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Требуется авторизация"})}

    user = {"id": row[0], "name": row[1], "is_admin": row[2], "role": row[3]}

    # GET — список заявок
    if method == "GET":
        if user["is_admin"]:
            cur.execute(
                f"""
                SELECT r.id, r.file_id, f.title, f.file_type, f.mime_type,
                       r.reason, r.status, r.created_at,
                       u.name as requester, u.callsign,
                       ru.name as reviewer
                FROM {schema}.file_removal_requests r
                JOIN {schema}.files f ON r.file_id = f.id
                JOIN {schema}.users u ON r.requested_by = u.id
                LEFT JOIN {schema}.users ru ON r.reviewed_by = ru.id
                ORDER BY r.status ASC, r.created_at DESC
                """
            )
        else:
            cur.execute(
                f"""
                SELECT r.id, r.file_id, f.title, f.file_type, f.mime_type,
                       r.reason, r.status, r.created_at,
                       u.name as requester, u.callsign,
                       ru.name as reviewer
                FROM {schema}.file_removal_requests r
                JOIN {schema}.files f ON r.file_id = f.id
                JOIN {schema}.users u ON r.requested_by = u.id
                LEFT JOIN {schema}.users ru ON r.reviewed_by = ru.id
                WHERE r.requested_by = %s
                ORDER BY r.created_at DESC
                """,
                (user["id"],),
            )
        rows = cur.fetchall()
        conn.close()

        requests = []
        for r in rows:
            requests.append({
                "id": r[0],
                "file_id": r[1],
                "file_title": r[2],
                "file_type": r[3],
                "mime_type": r[4],
                "reason": r[5],
                "status": r[6],
                "created_at": r[7].isoformat() if r[7] else None,
                "requester": r[8],
                "callsign": r[9],
                "reviewer": r[10],
            })
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"requests": requests})}

    INSTRUCTOR_ROLES = {"инструктор кт", "инструктор fpv", "инструктор оператор-сапер"}

    # POST — создать заявку (только инструктор)
    if method == "POST":
        if not (user.get("role") in INSTRUCTOR_ROLES or user["is_admin"]):
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён"})}

        body = json.loads(event.get("body") or "{}")
        file_id = body.get("file_id")
        reason = body.get("reason", "").strip()

        if not file_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите file_id"})}

        cur.execute(f"SELECT id FROM {schema}.files WHERE id = %s", (file_id,))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Файл не найден"})}

        cur.execute(
            f"SELECT id FROM {schema}.file_removal_requests WHERE file_id = %s AND requested_by = %s AND status = 'pending'",
            (file_id, user["id"]),
        )
        if cur.fetchone():
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Заявка на этот файл уже отправлена"})}

        cur.execute(
            f"INSERT INTO {schema}.file_removal_requests (file_id, requested_by, reason) VALUES (%s, %s, %s) RETURNING id",
            (file_id, user["id"], reason),
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"id": new_id})}

    # PUT — одобрить или отклонить (только администратор)
    if method == "PUT":
        if not user["is_admin"]:
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Доступ запрещён"})}

        body = json.loads(event.get("body") or "{}")
        request_id = body.get("id")
        action = body.get("action")

        if not request_id or action not in ("approve", "reject"):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите id и action (approve/reject)"})}

        cur.execute(
            f"SELECT r.id, r.file_id, r.status, f.s3_key, f.mime_type FROM {schema}.file_removal_requests r JOIN {schema}.files f ON r.file_id = f.id WHERE r.id = %s",
            (request_id,),
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Заявка не найдена"})}

        req_id, file_id, current_status, s3_key, mime_type = row

        if current_status != "pending":
            conn.close()
            return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Заявка уже обработана"})}

        new_status = "approved" if action == "approve" else "rejected"

        cur.execute(
            f"UPDATE {schema}.file_removal_requests SET status = %s, reviewed_by = %s, reviewed_at = NOW() WHERE id = %s",
            (new_status, user["id"], request_id),
        )

        if action == "approve":
            if mime_type != "youtube" and s3_key:
                s3 = get_s3()
                s3.delete_object(Bucket="files", Key=s3_key)
            cur.execute(f"UPDATE {schema}.file_removal_requests SET status = 'approved' WHERE file_id = %s AND status = 'pending'", (file_id,))
            cur.execute(f"DELETE FROM {schema}.files WHERE id = %s", (file_id,))

        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "status": new_status})}

    conn.close()
    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "Method not allowed"})}