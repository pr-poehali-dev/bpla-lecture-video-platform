"""
Инструкторский раздел: расписание, конспекты, ведомости, документы.
Доступ только для инструкторов и администраторов.
Действия: schedule-list/create/update/delete,
          notes-list/upload/delete/share,
          sheets-list/get/create/update/delete/share,
          docs-list/get/create/update/delete/share/export-docx
"""
import json
import os
import base64
import uuid
import re
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
                   gs.is_shared, gs.created_at, gs.updated_at,
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

    if action == "sheet-share" and method == "POST":
        sid = body.get("id")
        shared = bool(body.get("is_shared", True))
        if not sid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_grade_sheets')} WHERE id = %s", (sid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Ведомость не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        cur.execute(f"UPDATE {t('instructor_grade_sheets')} SET is_shared = %s, updated_at = NOW() WHERE id = %s", (shared, sid))
        conn.commit(); conn.close()
        return ok({"message": "Доступ обновлён", "is_shared": shared})

    # ── ШАРИНГ КОНСПЕКТОВ (files) ─────────────────────────────────────────────

    if action == "note-share" and method == "POST":
        fid = body.get("id")
        # Для конспектов-файлов шаринг = перенос в section instructor_shared
        # Используем поле description prefix "[SHARED]"
        if not fid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT uploaded_by, description FROM {t('files')} WHERE id = %s AND section = 'instructor'", (fid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Файл не найден", 404)
        if not user["is_admin"] and row["uploaded_by"] != uid:
            conn.close(); return err("Нет доступа", 403)
        shared = bool(body.get("is_shared", True))
        desc = row["description"] or ""
        if shared and not desc.startswith("[SHARED]"):
            desc = "[SHARED] " + desc
        elif not shared:
            desc = desc.replace("[SHARED] ", "").replace("[SHARED]", "")
        cur.execute(f"UPDATE {t('files')} SET description = %s WHERE id = %s", (desc, fid))
        conn.commit(); conn.close()
        return ok({"message": "Доступ обновлён", "is_shared": shared})

    # ── ДОКУМЕНТЫ (встроенный редактор) ──────────────────────────────────────

    if action == "docs-list" and method == "GET":
        show_all = params.get("all") == "1"
        if show_all:
            # все свои + все расшаренные другими
            cur.execute(f"""
                SELECT d.id, d.title, d.category, d.group_name, d.subject,
                       d.is_shared, d.created_at, d.updated_at,
                       u.name AS instructor_name, u.callsign AS instructor_callsign,
                       LENGTH(d.content_html) AS content_len
                FROM {t('instructor_documents')} d
                JOIN {t('users')} u ON u.id = d.instructor_id
                WHERE d.instructor_id = %s OR d.is_shared = TRUE
                ORDER BY d.updated_at DESC
            """, (uid,))
        else:
            cur.execute(f"""
                SELECT d.id, d.title, d.category, d.group_name, d.subject,
                       d.is_shared, d.created_at, d.updated_at,
                       u.name AS instructor_name, u.callsign AS instructor_callsign,
                       LENGTH(d.content_html) AS content_len
                FROM {t('instructor_documents')} d
                JOIN {t('users')} u ON u.id = d.instructor_id
                WHERE d.instructor_id = %s
                ORDER BY d.updated_at DESC
            """, (uid,))
        docs = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"docs": docs})

    if action == "doc-get" and method == "GET":
        did = params.get("id")
        if not did:
            conn.close(); return err("id обязателен")
        cur.execute(f"""
            SELECT d.*, u.name AS instructor_name, u.callsign AS instructor_callsign
            FROM {t('instructor_documents')} d
            JOIN {t('users')} u ON u.id = d.instructor_id
            WHERE d.id = %s
        """, (did,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Документ не найден", 404)
        row = dict(row)
        if not user["is_admin"] and row["instructor_id"] != uid and not row["is_shared"]:
            conn.close(); return err("Нет доступа", 403)
        conn.close()
        return ok({"doc": row})

    if action == "doc-create" and method == "POST":
        title = (body.get("title") or "Новый документ").strip()
        cur.execute(f"""
            INSERT INTO {t('instructor_documents')}
            (instructor_id, title, category, content_html, group_name, subject, is_shared)
            VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (uid, title, body.get("category","Конспект"),
              body.get("content_html",""), body.get("group_name",""),
              body.get("subject",""), bool(body.get("is_shared", False))))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "message": "Документ создан"})

    if action == "doc-update" and method == "POST":
        did = body.get("id")
        if not did:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_documents')} WHERE id = %s", (did,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Документ не найден", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        fields, vals = [], []
        for col in ["title","category","group_name","subject"]:
            if col in body:
                fields.append(f"{col} = %s"); vals.append(body[col])
        if "content_html" in body:
            fields.append("content_html = %s"); vals.append(body["content_html"])
        if "is_shared" in body:
            fields.append("is_shared = %s"); vals.append(bool(body["is_shared"]))
        if not fields:
            conn.close(); return err("Нет полей")
        fields.append("updated_at = NOW()")
        vals.append(did)
        cur.execute(f"UPDATE {t('instructor_documents')} SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit(); conn.close()
        return ok({"message": "Сохранено"})

    if action == "doc-delete" and method == "POST":
        did = body.get("id")
        if not did:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_documents')} WHERE id = %s", (did,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Документ не найден", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        cur.execute(f"DELETE FROM {t('instructor_documents')} WHERE id = %s", (did,))
        conn.commit(); conn.close()
        return ok({"message": "Удалён"})

    if action == "doc-export-docx" and method == "POST":
        """Конвертирует HTML-контент документа в DOCX и отдаёт base64."""
        did = body.get("id")
        if not did:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT * FROM {t('instructor_documents')} WHERE id = %s", (did,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Документ не найден", 404)
        row = dict(row)
        if not user["is_admin"] and row["instructor_id"] != uid and not row["is_shared"]:
            conn.close(); return err("Нет доступа", 403)
        conn.close()

        try:
            from docx import Document
            from docx.shared import Pt, RGBColor
            from docx.enum.text import WD_ALIGN_PARAGRAPH
            import io

            doc = Document()
            # Стили документа
            style = doc.styles["Normal"]
            style.font.name = "Times New Roman"
            style.font.size = Pt(12)

            # Заголовок документа
            title_para = doc.add_heading(row["title"], 0)
            title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER

            # Метаданные
            if row.get("subject") or row.get("group_name"):
                meta = []
                if row.get("subject"): meta.append(f"Предмет: {row['subject']}")
                if row.get("group_name"): meta.append(f"Группа: {row['group_name']}")
                meta_para = doc.add_paragraph(" | ".join(meta))
                meta_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in meta_para.runs:
                    run.font.color.rgb = RGBColor(0x5a, 0x7a, 0x95)
                    run.font.size = Pt(10)

            doc.add_paragraph("")

            # Парсим HTML в параграфы
            html = row.get("content_html", "")
            # Убираем теги, оставляем структуру
            html = html.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")

            # Разбиваем по блочным тегам
            blocks = re.split(r'(</?(?:p|h[1-6]|ul|ol|li|div|blockquote)[^>]*>)', html)
            current_tag = "p"
            list_level = 0

            for block in blocks:
                block = block.strip()
                if not block:
                    continue
                # Тег открывающий
                m = re.match(r'^<(h[1-6]|p|li|ul|ol|div|blockquote)([^>]*)>$', block, re.I)
                if m:
                    current_tag = m.group(1).lower()
                    if current_tag in ("ul", "ol"):
                        list_level += 1
                    continue
                # Тег закрывающий
                if re.match(r'^</(h[1-6]|p|li|ul|ol|div|blockquote)>$', block, re.I):
                    if re.match(r'^</(ul|ol)>$', block, re.I):
                        list_level = max(0, list_level - 1)
                    continue
                # Текстовый контент — убираем оставшиеся теги
                text = re.sub(r'<[^>]+>', '', block).strip()
                if not text:
                    continue

                if current_tag in ("h1", "h2"):
                    para = doc.add_heading(text, level=1)
                elif current_tag in ("h3", "h4"):
                    para = doc.add_heading(text, level=2)
                elif current_tag in ("h5", "h6"):
                    para = doc.add_heading(text, level=3)
                elif current_tag == "li":
                    para = doc.add_paragraph(style="List Bullet")
                    para.add_run(text)
                else:
                    para = doc.add_paragraph(text)

            # Сохраняем в байты
            buf = io.BytesIO()
            doc.save(buf)
            docx_b64 = base64.b64encode(buf.getvalue()).decode()
            filename = re.sub(r'[^\w\s-]', '', row["title"]).strip().replace(' ', '_') or "document"
            return ok({"docx_b64": docx_b64, "filename": f"{filename}.docx"})

        except ImportError:
            return err("python-docx не установлен на сервере", 500)
        except Exception as e:
            return err(f"Ошибка экспорта: {str(e)}", 500)

    # ── ПАПКИ ────────────────────────────────────────────────────────────────

    if action == "folders-list" and method == "GET":
        # Возвращает все папки + документы в них для текущего инструктора
        # (и расшаренные другими если ?all=1)
        show_all = params.get("all") == "1"
        if show_all:
            cur.execute(f"""
                SELECT f.id, f.name, f.parent_id, f.color, f.sort_order, f.is_shared,
                       u.name AS owner_name, u.callsign AS owner_callsign
                FROM {t('instructor_folders')} f
                JOIN {t('users')} u ON u.id = f.instructor_id
                WHERE f.instructor_id = %s OR f.is_shared = TRUE
                ORDER BY f.parent_id NULLS FIRST, f.sort_order, f.name
            """, (uid,))
        else:
            cur.execute(f"""
                SELECT f.id, f.name, f.parent_id, f.color, f.sort_order, f.is_shared,
                       u.name AS owner_name, u.callsign AS owner_callsign
                FROM {t('instructor_folders')} f
                JOIN {t('users')} u ON u.id = f.instructor_id
                WHERE f.instructor_id = %s
                ORDER BY f.parent_id NULLS FIRST, f.sort_order, f.name
            """, (uid,))
        folders = [dict(r) for r in cur.fetchall()]
        # Документы в папках
        folder_ids = [f["id"] for f in folders]
        docs = []
        if folder_ids or True:
            if show_all:
                cur.execute(f"""
                    SELECT d.id, d.title, d.category, d.doc_type, d.folder_id,
                           d.group_name, d.subject, d.is_shared, d.updated_at,
                           d.file_url, d.file_original_name, d.file_size, d.file_mime,
                           d.sort_order, u.name AS instructor_name, u.callsign AS instructor_callsign
                    FROM {t('instructor_documents')} d
                    JOIN {t('users')} u ON u.id = d.instructor_id
                    WHERE d.instructor_id = %s OR d.is_shared = TRUE
                    ORDER BY d.folder_id NULLS LAST, d.sort_order, d.updated_at DESC
                """, (uid,))
            else:
                cur.execute(f"""
                    SELECT d.id, d.title, d.category, d.doc_type, d.folder_id,
                           d.group_name, d.subject, d.is_shared, d.updated_at,
                           d.file_url, d.file_original_name, d.file_size, d.file_mime,
                           d.sort_order, u.name AS instructor_name, u.callsign AS instructor_callsign
                    FROM {t('instructor_documents')} d
                    JOIN {t('users')} u ON u.id = d.instructor_id
                    WHERE d.instructor_id = %s
                    ORDER BY d.folder_id NULLS LAST, d.sort_order, d.updated_at DESC
                """, (uid,))
            docs = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"folders": folders, "docs": docs})

    if action == "folder-create" and method == "POST":
        name = (body.get("name") or "").strip()
        if not name:
            conn.close(); return err("Название обязательно")
        parent_id = body.get("parent_id") or None
        color = body.get("color", "#00f5ff")
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {t('instructor_folders')} WHERE instructor_id = %s AND parent_id IS NOT DISTINCT FROM %s", (uid, parent_id))
        order = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {t('instructor_folders')} (instructor_id, name, parent_id, color, sort_order)
            VALUES (%s,%s,%s,%s,%s) RETURNING id
        """, (uid, name, parent_id, color, order))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "message": f"Папка «{name}» создана"})

    if action == "folder-update" and method == "POST":
        fid = body.get("id")
        if not fid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_folders')} WHERE id = %s", (fid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Папка не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        fields, vals = [], []
        for col in ["name", "color", "parent_id"]:
            if col in body:
                fields.append(f"{col} = %s"); vals.append(body[col] if body[col] != "" else None)
        if "is_shared" in body:
            fields.append("is_shared = %s"); vals.append(bool(body["is_shared"]))
        if not fields:
            conn.close(); return err("Нет полей")
        fields.append("updated_at = NOW()")
        vals.append(fid)
        cur.execute(f"UPDATE {t('instructor_folders')} SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit(); conn.close()
        return ok({"message": "Папка обновлена"})

    if action == "folder-delete" and method == "POST":
        fid = body.get("id")
        if not fid:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_folders')} WHERE id = %s", (fid,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Папка не найдена", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        # Документы в папке переносим в корень
        cur.execute(f"UPDATE {t('instructor_documents')} SET folder_id = NULL WHERE folder_id = %s", (fid,))
        # Подпапки переносим в корень
        cur.execute(f"UPDATE {t('instructor_folders')} SET parent_id = NULL WHERE parent_id = %s", (fid,))
        cur.execute(f"UPDATE {t('instructor_folders')} SET parent_id = NULL WHERE id = %s", (fid,))
        conn.commit(); conn.close()
        return ok({"message": "Папка удалена"})

    # ── ЗАГРУЗКА WORD/PDF ФАЙЛОВ ──────────────────────────────────────────────

    if action == "file-upload" and method == "POST":
        title = (body.get("title") or "").strip()
        file_data = body.get("file_data", "")
        original_name = body.get("original_name", "file")
        mime_type = body.get("mime_type", "application/octet-stream")
        folder_id = body.get("folder_id") or None
        category = body.get("category", "Конспект")
        if not title:
            conn.close(); return err("Название обязательно")
        if not file_data:
            conn.close(); return err("Файл обязателен")
        try:
            raw = base64.b64decode(file_data.split(",")[-1] if "," in file_data else file_data)
        except Exception:
            conn.close(); return err("Ошибка декодирования файла")
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "bin"
        key = f"instructor-files/{uuid.uuid4()}.{ext}"
        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=mime_type)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
        cur.execute(f"""
            INSERT INTO {t('instructor_documents')}
            (instructor_id, title, category, content_html, folder_id, doc_type,
             file_url, file_original_name, file_size, file_mime, s3_key)
            VALUES (%s,%s,%s,'',%s,'file',%s,%s,%s,%s,%s) RETURNING id
        """, (uid, title, category, folder_id, cdn_url, original_name, len(raw), mime_type, key))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "file_url": cdn_url, "message": "Файл загружен"})

    # Перемещение документа в папку
    if action == "doc-move" and method == "POST":
        did = body.get("id")
        folder_id = body.get("folder_id")  # None = корень
        if not did:
            conn.close(); return err("id обязателен")
        cur.execute(f"SELECT instructor_id FROM {t('instructor_documents')} WHERE id = %s", (did,))
        row = cur.fetchone()
        if not row:
            conn.close(); return err("Документ не найден", 404)
        if not user["is_admin"] and row["instructor_id"] != uid:
            conn.close(); return err("Нет доступа", 403)
        cur.execute(f"UPDATE {t('instructor_documents')} SET folder_id = %s, updated_at = NOW() WHERE id = %s",
                    (folder_id if folder_id else None, did))
        conn.commit(); conn.close()
        return ok({"message": "Перемещено"})

    # Создать документ в папке
    if action == "doc-create-in-folder" and method == "POST":
        title = (body.get("title") or "Новый документ").strip()
        folder_id = body.get("folder_id") or None
        category = body.get("category", "Конспект")
        cur.execute(f"""
            INSERT INTO {t('instructor_documents')}
            (instructor_id, title, category, content_html, group_name, subject, is_shared, folder_id, doc_type)
            VALUES (%s,%s,%s,'',%s,%s,%s,%s,'document') RETURNING id
        """, (uid, title, category, body.get("group_name",""), body.get("subject",""),
              bool(body.get("is_shared", False)), folder_id))
        new_id = cur.fetchone()["id"]
        conn.commit(); conn.close()
        return ok({"id": new_id, "message": "Документ создан"})

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