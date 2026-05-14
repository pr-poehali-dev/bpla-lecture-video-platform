"""
Инструкторский раздел: расписание, конспекты, ведомости.
Доступ только для инструкторов и администраторов.
Действия: schedule-list, schedule-create, schedule-update, schedule-delete,
          notes-list, note-upload, note-delete,
          sheets-list, sheet-create, sheet-update, sheet-delete
"""
import json
import os
import base64
import uuid
import psycopg2
import psycopg2.extras
import boto3
from psycopg2.extras import RealDictCursor

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
    "Access-Control-Max-Age": "86400",
}

INSTRUCTOR_ROLES = {"инструктор кт", "инструктор fpv", "инструктор оператор-сапер"}

ALLOWED_DOC = {
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip", "application/octet-stream",
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


def get_user(event, cur):
    auth = (event.get("headers") or {}).get("X-Authorization") or (event.get("headers") or {}).get("x-authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur.execute(f"SELECT id, name, callsign, is_admin, role FROM {t('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    row = cur.fetchone()
    return dict(row) if row else None


def is_instructor(user):
    return user and (user["is_admin"] or user.get("role") in INSTRUCTOR_ROLES)


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    """Инструкторский раздел: расписание, конспекты, ведомости."""
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

    user = get_user(event, cur)
    if not user:
        conn.close()
        return err("Не авторизован", 401)
    if not is_instructor(user):
        conn.close()
        return err("Доступ только для инструкторов", 403)

    uid = user["id"]

    # ── РАСПИСАНИЕ ───────────────────────────────────────────────────────────

    if action == "schedule-list" and method == "GET":
        date_from = params.get("date_from", "")
        date_to = params.get("date_to", "")
        show_all = params.get("all") == "1" and user["is_admin"]

        where = "WHERE 1=1"
        vals = []
        if not show_all:
            where += " AND s.instructor_id = %s"
            vals.append(uid)
        if date_from:
            where += " AND s.scheduled_date >= %s"
            vals.append(date_from)
        if date_to:
            where += " AND s.scheduled_date <= %s"
            vals.append(date_to)

        cur.execute(f"""
            SELECT s.id, s.title, s.subject, s.group_name, s.location,
                   s.scheduled_date, s.time_start, s.time_end,
                   s.notes, s.is_cancelled, s.created_at,
                   u.name AS instructor_name, u.callsign AS instructor_callsign
            FROM {t('instructor_schedule')} s
            JOIN {t('users')} u ON u.id = s.instructor_id
            {where}
            ORDER BY s.scheduled_date ASC, s.time_start ASC
        """, vals)
        items = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"schedule": items})

    if action == "schedule-create" and method == "POST":
        title = (body.get("title") or "").strip()
        if not title:
            conn.close(); return err("Название обязательно")
        cur.execute(f"""
            INSERT INTO {t('instructor_schedule')}
            (instructor_id, title, subject, group_name, location, scheduled_date, time_start, time_end, notes)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (uid, title, body.get("subject",""), body.get("group_name",""),
              body.get("location",""), body.get("scheduled_date"),
              body.get("time_start") or None, body.get("time_end") or None,
              body.get("notes","")))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "message": "Занятие добавлено"})

    if action == "schedule-update" and method == "POST":
        sid = body.get("id")
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_schedule')} WHERE id = %s", (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Запись не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        fields, vals = [], []
        for col in ["title","subject","group_name","location","scheduled_date","time_start","time_end","notes","is_cancelled"]:
            if col in body:
                fields.append(f"{col} = %s")
                vals.append(body[col] if body[col] != "" else None if col in ("time_start","time_end") else body[col])
        if not fields:
            conn.close(); return err("Нет полей")
        fields.append("updated_at = NOW()")
        vals.append(sid)
        cur.execute(f"UPDATE {t('instructor_schedule')} SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit(); conn.close()
        return ok({"message": "Занятие обновлено"})

    if action == "schedule-delete" and method == "POST":
        sid = body.get("id")
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_schedule')} WHERE id = %s", (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Запись не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        cur.execute(f"DELETE FROM {t('instructor_schedule')} WHERE id = %s", (sid,))
        conn.commit(); conn.close()
        return ok({"message": "Занятие удалено"})

    # ── КОНСПЕКТЫ (используем таблицу files с section=instructor) ────────────

    if action == "notes-list" and method == "GET":
        show_all = params.get("all") == "1"
        where = "WHERE f.section = 'instructor'"
        vals = []
        if not show_all and not user["is_admin"]:
            where += " AND f.uploaded_by = %s"
            vals.append(uid)
        cur.execute(f"""
            SELECT f.id, f.title, f.description, f.category, f.original_name,
                   f.mime_type, f.file_size, f.cdn_url, f.created_at,
                   u.name AS uploader_name, u.callsign AS uploader_callsign
            FROM {t('files')} f
            LEFT JOIN {t('users')} u ON u.id = f.uploaded_by
            {where}
            ORDER BY f.created_at DESC
        """, vals)
        items = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"notes": items})

    if action == "note-upload" and method == "POST":
        title = (body.get("title") or "").strip()
        file_data = body.get("file_data", "")
        original_name = body.get("original_name", "file")
        mime_type = body.get("mime_type", "application/octet-stream")
        if not title:
            conn.close(); return err("Название обязательно")
        if not file_data:
            conn.close(); return err("Файл обязателен")
        if mime_type not in ALLOWED_DOC and not mime_type.startswith("application/"):
            conn.close(); return err("Неподдерживаемый формат файла")
        try:
            raw = base64.b64decode(file_data.split(",")[-1] if "," in file_data else file_data)
        except Exception:
            conn.close(); return err("Ошибка декодирования файла")
        ext = original_name.rsplit(".", 1)[-1] if "." in original_name else "bin"
        key = f"instructor/{uuid.uuid4()}.{ext}"
        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.execute(f"""
            INSERT INTO {t('files')} (title, description, file_type, category, section, original_name, mime_type, file_size, cdn_url, s3_key, uploaded_by)
            VALUES (%s,%s,'document',%s,'instructor',%s,%s,%s,%s,%s,%s) RETURNING id
        """, (title, body.get("description",""), body.get("category","Конспект"),
              original_name, mime_type, len(raw), cdn_url, key, uid))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "cdn_url": cdn_url, "message": "Конспект загружен"})

    if action == "note-delete" and method == "POST":
        fid = body.get("id")
        if not fid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT uploaded_by, s3_key FROM {t('files')} WHERE id = %s AND section = 'instructor'", (fid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Файл не найден", 404)
        if not user["is_admin"] and row["uploaded_by"] != uid:
            conn.close(); return err("Нет доступа", 403)
        if row["s3_key"]:
            try:
                get_s3().delete_object(Bucket="files", Key=row["s3_key"])
            except Exception:
                pass
        cur.execute(f"DELETE FROM {t('files')} WHERE id = %s", (fid,))
        conn.commit(); conn.close()
        return ok({"message": "Конспект удалён"})

    # ── ВЕДОМОСТИ ─────────────────────────────────────────────────────────────

    if action == "sheets-list" and method == "GET":
        show_all = params.get("all") == "1" and user["is_admin"]
        where = "WHERE 1=1"
        vals = []
        if not show_all:
            where += " AND gs.instructor_id = %s"
            vals.append(uid)
        cur.execute(f"""
            SELECT gs.id, gs.title, gs.group_name, gs.subject, gs.notes,
                   gs.created_at, gs.updated_at,
                   u.name AS instructor_name, u.callsign AS instructor_callsign,
                   jsonb_array_length(gs.sheet_data) AS rows_count
            FROM {t('instructor_grade_sheets')} gs
            JOIN {t('users')} u ON u.id = gs.instructor_id
            {where}
            ORDER BY gs.updated_at DESC
        """, vals)
        items = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"sheets": items})

    if action == "sheet-get" and method == "GET":
        sid = params.get("id")
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"""
            SELECT gs.*, u.name AS instructor_name, u.callsign AS instructor_callsign
            FROM {t('instructor_grade_sheets')} gs
            JOIN {t('users')} u ON u.id = gs.instructor_id
            WHERE gs.id = %s
        """, (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Ведомость не найдена", 404)
        row = dict(row)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        conn.close()
        return ok({"sheet": row})

    if action == "sheet-create" and method == "POST":
        title = (body.get("title") or "").strip()
        if not title:
            conn.close(); return err("Название обязательно")
        sheet_data = body.get("sheet_data", [])
        cur.execute(f"""
            INSERT INTO {t('instructor_grade_sheets')}
            (instructor_id, title, group_name, subject, notes, sheet_data)
            VALUES (%s,%s,%s,%s,%s,%s) RETURNING id
        """, (uid, title, body.get("group_name",""), body.get("subject",""),
              body.get("notes",""), json.dumps(sheet_data, ensure_ascii=False)))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "message": "Ведомость создана"})

    if action == "sheet-update" and method == "POST":
        sid = body.get("id")
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_grade_sheets')} WHERE id = %s", (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Ведомость не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        fields, vals = [], []
        for col in ["title","group_name","subject","notes"]:
            if col in body:
                fields.append(f"{col} = %s"); vals.append(body[col])
        if "sheet_data" in body:
            fields.append("sheet_data = %s")
            vals.append(json.dumps(body["sheet_data"], ensure_ascii=False))
        if not fields:
            conn.close(); return err("Нет полей")
        fields.append("updated_at = NOW()")
        vals.append(sid)
        cur.execute(f"UPDATE {t('instructor_grade_sheets')} SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit(); conn.close()
        return ok({"message": "Ведомость обновлена"})

    if action == "sheet-delete" and method == "POST":
        sid = body.get("id")
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_grade_sheets')} WHERE id = %s", (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Ведомость не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        cur.execute(f"DELETE FROM {t('instructor_grade_sheets')} WHERE id = %s", (sid,))
        conn.commit(); conn.close()
        return ok({"message": "Ведомость удалена"})

    # ── ПОИСК КУРСАНТОВ для ведомости ────────────────────────────────────────

    if action == "search-users" and method == "GET":
        q = (params.get("q") or "").strip()
        if len(q) < 2:
            conn.close(); return ok({"users": []})
        cur.execute(f"""
            SELECT id, name, callsign, rank, role
            FROM {t('users')}
            WHERE status = 'approved' AND role = 'курсант'
              AND (callsign ILIKE %s OR name ILIKE %s)
            ORDER BY callsign, name LIMIT 20
        """, (f"%{q}%", f"%{q}%"))
        users = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"users": users})

    conn.close()
    return err("Не найдено", 404)
