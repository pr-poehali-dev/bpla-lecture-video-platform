"""
Админ-панель: список пользователей, одобрение/отклонение заявок, управление ролями и правами доступа.
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization, X-User-Id, X-Auth-Token",
    "Access-Control-Max-Age": "86400",
}

PAGES = ["home", "lectures", "videos", "drone-types", "materials", "firmware", "discussions", "downloads", "instructor"]
ROLES = ["курсант", "инструктор кт", "инструктор fpv", "инструктор оператор-сапер"]
INSTRUCTOR_ROLES = {"инструктор кт", "инструктор fpv", "инструктор оператор-сапер"}

def get_schema():
    return os.environ.get("MAIN_DB_SCHEMA", "public")

def get_conn():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    return conn

def q(table: str) -> str:
    return f'"{get_schema()}".{table}'

def ok(data: dict) -> dict:
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg}, ensure_ascii=False)}

def get_admin(event, cur):
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur.execute(f"SELECT id, name, callsign, email, is_admin FROM {q('users')} WHERE session_token = %s", (token,))
    user = cur.fetchone()
    if not user or not user["is_admin"]:
        return None
    return user

def audit(cur, admin, action, target_type=None, target_id=None, target_name=None, details=None):
    admin_name = admin.get("callsign") or admin.get("name", "")
    cur.execute(
        f"INSERT INTO {q('admin_audit_log')} (admin_id, admin_name, action, target_type, target_id, target_name, details) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (admin["id"], admin_name, action, target_type, target_id, target_name, json.dumps(details or {}, ensure_ascii=False))
    )

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

    # Discussions — открытые эндпоинты (не требуют is_admin)
    if action.startswith("disc-"):
        result = handle_discussions(event, method, action, body, conn, cur)
        conn.close()
        return result if result else err("Не найдено", 404)

    # GET ?action=get-page&slug=home — публичный, для рендера страниц
    if action == "get-page" and method == "GET":
        slug = (event.get("queryStringParameters") or {}).get("slug", "home")
        cur.execute(f"SELECT id, slug, title, is_visible FROM {q('pages')} WHERE slug = %s", (slug,))
        page = cur.fetchone()
        if not page:
            conn.close()
            return err("Страница не найдена", 404)
        cur.execute(f"SELECT id, type, sort_order, data FROM {q('page_blocks')} WHERE page_id = %s AND sort_order >= 0 ORDER BY sort_order", (page["id"],))
        blocks = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"page": dict(page), "blocks": blocks})

    # GET ?action=get-settings — публичный, вызывается из App.tsx при старте
    if action == "get-settings" and method == "GET":
        cur.execute(f"SELECT key, value FROM {q('site_settings')}")
        rows = cur.fetchall()
        settings = {r["key"]: r["value"] for r in rows}
        conn.close()
        return ok({"settings": settings})

    # GET ?action=drones-list — публичный список дронов
    if action == "drones-list" and method == "GET":
        only_visible = params.get("all") != "1"
        where = "WHERE is_visible = TRUE" if only_visible else ""
        cur.execute(f"SELECT id, code, name, category, range_val, payload, speed, endurance, emoji, color, description, tags, sort_order, is_visible FROM {q('drone_types')} {where} ORDER BY sort_order, id")
        drones = [dict(r) for r in cur.fetchall()]
        conn.close()
        return ok({"drones": drones})

    # GET ?action=public-stats — публичная статистика для главной
    if action == "public-stats" and method == "GET":
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('files')} WHERE file_type = 'document'")
        docs_cnt = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('files')} WHERE file_type = 'video' OR mime_type = 'youtube'")
        vids_cnt = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('drone_types')} WHERE is_visible = TRUE")
        drones_cnt = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('users')} WHERE status = 'approved'")
        users_cnt = cur.fetchone()["cnt"]
        conn.close()
        return ok({"docs": docs_cnt, "videos": vids_cnt, "drones": drones_cnt, "users": users_cnt})

    admin = get_admin(event, cur)
    if not admin:
        return err("Доступ запрещён", 403)

    # GET ?action=users
    if action == "users" and method == "GET":
        cur.execute(f"SELECT id, name, callsign, email, status, is_admin, is_blocked, role, created_at, approved_at FROM {q('users')} ORDER BY created_at DESC")
        users = [dict(u) for u in cur.fetchall()]
        return ok({"users": users})

    # GET ?action=get-permissions
    if action == "get-permissions" and method == "GET":
        cur.execute(f"SELECT role, page, allowed FROM {q('role_permissions')} ORDER BY role, page")
        rows = cur.fetchall()
        result = {}
        for row in rows:
            r = row["role"]
            if r not in result:
                result[r] = {}
            result[r][row["page"]] = row["allowed"]
        # дефолты: instructor страница закрыта для курсантов, открыта для инструкторов
        INSTRUCTOR_PAGE_DEFAULT = {"курсант": False}
        for role in ROLES:
            if role not in result:
                result[role] = {}
            for page in PAGES:
                if page not in result[role]:
                    if page == "instructor":
                        result[role][page] = INSTRUCTOR_PAGE_DEFAULT.get(role, True)
                    else:
                        result[role][page] = True
        return ok({"permissions": result, "pages": PAGES, "roles": ROLES})

    # POST ?action=set-permissions
    if action == "set-permissions" and method == "POST":
        role = body.get("role")
        permissions = body.get("permissions")  # dict page -> bool
        if not role or role not in ROLES:
            return err("Недопустимая роль")
        if not isinstance(permissions, dict):
            return err("permissions должен быть объектом")
        for page, allowed in permissions.items():
            if page not in PAGES:
                continue
            cur.execute(
                f"INSERT INTO {q('role_permissions')} (role, page, allowed, updated_at) VALUES (%s, %s, %s, NOW()) "
                f"ON CONFLICT (role, page) DO UPDATE SET allowed = EXCLUDED.allowed, updated_at = NOW()",
                (role, page, bool(allowed))
            )
        # Сбрасываем кэш прав у всех пользователей с этой ролью
        cur.execute(f"UPDATE {q('users')} SET permissions_cache = NULL WHERE role = %s", (role,))
        conn.commit()
        return ok({"message": f"Права для роли «{role}» обновлены"})

    # POST ?action=set-role
    if action == "set-role" and method == "POST":
        user_id = body.get("user_id")
        role = body.get("role")
        if not user_id:
            return err("user_id обязателен")
        if role not in ("курсант", "инструктор кт", "инструктор fpv", "инструктор оператор-сапер", "администратор"):
            return err("Недопустимая роль")
        cur.execute(f"UPDATE {q('users')} SET role = %s, permissions_cache = NULL WHERE id = %s RETURNING id, name, callsign", (role, user_id))
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "set_role", "user", user["id"], user["callsign"] or user["name"], {"role": role})
        conn.commit()
        return ok({"message": f"Роль пользователя {user['callsign'] or user['name']} изменена на «{role}»"})

    # POST ?action=approve
    if action == "approve" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'approved', approved_at = NOW() WHERE id = %s RETURNING id, name, callsign, email",
            (user_id,)
        )
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "approve_user", "user", user["id"], user["callsign"] or user["name"])
        conn.commit()
        return ok({"message": f"Пользователь {user['email']} одобрен", "user": dict(user)})

    # POST ?action=reject
    if action == "reject" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'rejected' WHERE id = %s RETURNING id, name, callsign, email",
            (user_id,)
        )
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "reject_user", "user", user["id"], user["callsign"] or user["name"])
        conn.commit()
        return ok({"message": f"Пользователь {user['email']} отклонён", "user": dict(user)})

    # POST ?action=make-admin
    if action == "make-admin" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(f"UPDATE {q('users')} SET is_admin = TRUE, status = 'approved' WHERE id = %s RETURNING id, name, callsign, email", (user_id,))
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "make_admin", "user", user["id"], user["callsign"] or user["name"])
        conn.commit()
        return ok({"message": f"{user['email']} назначен администратором"})

    # POST ?action=block-user
    if action == "block-user" and method == "POST":
        user_id = body.get("user_id")
        reason = body.get("reason", "")
        if not user_id:
            return err("user_id обязателен")
        if user_id == admin["id"]:
            return err("Нельзя заблокировать себя")
        cur.execute(f"UPDATE {q('users')} SET is_blocked = TRUE, session_token = NULL WHERE id = %s RETURNING id, name, callsign, email", (user_id,))
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "block_user", "user", user["id"], user["callsign"] or user["name"], {"reason": reason})
        conn.commit()
        return ok({"message": f"Пользователь {user['callsign'] or user['name']} заблокирован"})

    # POST ?action=unblock-user
    if action == "unblock-user" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        cur.execute(f"UPDATE {q('users')} SET is_blocked = FALSE WHERE id = %s RETURNING id, name, callsign, email", (user_id,))
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "unblock_user", "user", user["id"], user["callsign"] or user["name"])
        conn.commit()
        return ok({"message": f"Пользователь {user['callsign'] or user['name']} разблокирован"})

    # POST ?action=reset-password
    if action == "reset-password" and method == "POST":
        import secrets, hashlib
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        new_password = secrets.token_urlsafe(10)
        pw_hash = hashlib.sha256(new_password.encode()).hexdigest()
        cur.execute(f"UPDATE {q('users')} SET password_hash = %s, session_token = NULL WHERE id = %s RETURNING id, name, callsign, email", (pw_hash, user_id))
        user = cur.fetchone()
        if not user:
            conn.commit(); return err("Пользователь не найден", 404)
        audit(cur, admin, "reset_password", "user", user["id"], user["callsign"] or user["name"])
        conn.commit()
        return ok({"message": f"Пароль сброшен", "new_password": new_password, "email": user["email"]})

    # POST ?action=bulk-approve
    if action == "bulk-approve" and method == "POST":
        user_ids = body.get("user_ids", [])
        if not user_ids or not isinstance(user_ids, list):
            return err("user_ids обязателен (массив)")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'approved', approved_at = NOW() WHERE id = ANY(%s::int[]) AND status = 'pending' RETURNING id, name, callsign",
            (user_ids,)
        )
        updated = cur.fetchall()
        for u in updated:
            audit(cur, admin, "approve_user", "user", u["id"], u["callsign"] or u["name"])
        conn.commit()
        return ok({"message": f"Одобрено {len(updated)} пользователей", "count": len(updated)})

    # POST ?action=bulk-reject
    if action == "bulk-reject" and method == "POST":
        user_ids = body.get("user_ids", [])
        if not user_ids or not isinstance(user_ids, list):
            return err("user_ids обязателен (массив)")
        cur.execute(
            f"UPDATE {q('users')} SET status = 'rejected' WHERE id = ANY(%s::int[]) AND status = 'pending' RETURNING id, name, callsign",
            (user_ids,)
        )
        updated = cur.fetchall()
        for u in updated:
            audit(cur, admin, "reject_user", "user", u["id"], u["callsign"] or u["name"])
        conn.commit()
        return ok({"message": f"Отклонено {len(updated)} пользователей", "count": len(updated)})

    # GET ?action=audit-log
    if action == "audit-log" and method == "GET":
        limit = min(int(params.get("limit", 100)), 500)
        offset = int(params.get("offset", 0))
        filter_action = params.get("filter_action", "")
        filter_admin = params.get("filter_admin", "")
        where_parts = []
        where_vals = []
        if filter_action:
            where_parts.append("action = %s")
            where_vals.append(filter_action)
        if filter_admin:
            where_parts.append("admin_name ILIKE %s")
            where_vals.append(f"%{filter_admin}%")
        where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
        cur.execute(f"SELECT COUNT(*) as cnt FROM {q('admin_audit_log')} {where_sql}", where_vals)
        total = cur.fetchone()["cnt"]
        cur.execute(
            f"SELECT id, admin_id, admin_name, action, target_type, target_id, target_name, details, created_at FROM {q('admin_audit_log')} {where_sql} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            where_vals + [limit, offset]
        )
        logs = [dict(r) for r in cur.fetchall()]
        return ok({"logs": logs, "total": total})

    # POST ?action=remove-admin
    if action == "remove-admin" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        if user_id == admin["id"]:
            return err("Нельзя снять права с себя")
        cur.execute(f"UPDATE {q('users')} SET is_admin = FALSE WHERE id = %s RETURNING id, email", (user_id,))
        user = cur.fetchone()
        conn.commit()
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"message": f"Права администратора сняты с {user['email']}"})

    # GET ?action=stats
    if action == "stats" and method == "GET":
        cur.execute(f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                COUNT(*) FILTER (WHERE is_admin = TRUE) AS admins,
                COUNT(*) FILTER (WHERE status = 'approved' AND role = 'курсант') AS role_kursant,
                COUNT(*) FILTER (WHERE status = 'approved' AND role = 'инструктор кт') AS role_inst_kt,
                COUNT(*) FILTER (WHERE status = 'approved' AND role = 'инструктор fpv') AS role_inst_fpv,
                COUNT(*) FILTER (WHERE status = 'approved' AND role = 'инструктор оператор-сапер') AS role_inst_saper
            FROM {q('users')}
        """)
        row = cur.fetchone()
        by_role = {}
        if row["role_kursant"]: by_role["курсант"] = row["role_kursant"]
        if row["role_inst_kt"]: by_role["инструктор кт"] = row["role_inst_kt"]
        if row["role_inst_fpv"]: by_role["инструктор fpv"] = row["role_inst_fpv"]
        if row["role_inst_saper"]: by_role["инструктор оператор-сапер"] = row["role_inst_saper"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('files')}")
        files_count = cur.fetchone()["cnt"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('topics')}")
        topics_count = cur.fetchone()["cnt"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('topic_replies')}")
        replies_count = cur.fetchone()["cnt"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('messages')}")
        messages_count = cur.fetchone()["cnt"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('chats')}")
        chats_count = cur.fetchone()["cnt"]

        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('file_removal_requests')} WHERE status = 'pending'")
        removal_pending = cur.fetchone()["cnt"]

        return ok({
            "total": row["total"], "pending": row["pending"], "approved": row["approved"],
            "admins": row["admins"], "by_role": by_role,
            "files": files_count, "topics": topics_count, "replies": replies_count,
            "messages": messages_count, "chats": chats_count, "removal_pending": removal_pending
        })

    # POST ?action=delete-user
    if action == "delete-user" and method == "POST":
        user_id = body.get("user_id")
        if not user_id:
            return err("user_id обязателен")
        if user_id == admin["id"]:
            return err("Нельзя удалить себя")
        cur.execute(f"SELECT id, callsign, email FROM {q('users')} WHERE id = %s", (user_id,))
        user = cur.fetchone()
        if not user:
            return err("Пользователь не найден", 404)
        audit(cur, admin, "delete_user", "user", user["id"], user["callsign"] or user["email"])
        cur.execute(f"UPDATE {q('users')} SET status = 'rejected', is_blocked = TRUE, session_token = NULL WHERE id = %s", (user_id,))
        conn.commit()
        return ok({"message": f"Пользователь {user['callsign'] or user['email']} удалён"})

    # GET ?action=get-settings  (публичный — без проверки админа, вызывается из App.tsx)
    # Примечание: этот action проверяется до get_admin выше, но здесь оставлен для полноты
    if action == "get-settings" and method == "GET":
        cur.execute(f"SELECT key, value FROM {q('site_settings')}")
        rows = cur.fetchall()
        settings = {r["key"]: r["value"] for r in rows}
        return ok({"settings": settings})

    # POST ?action=set-settings
    if action == "set-settings" and method == "POST":
        settings = body.get("settings")
        if not isinstance(settings, dict):
            return err("settings должен быть объектом")
        for key, value in settings.items():
            cur.execute(
                f"INSERT INTO {q('site_settings')} (key, value, updated_at) VALUES (%s, %s, NOW()) "
                f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                (key, str(value))
            )
        conn.commit()
        return ok({"message": "Настройки сохранены"})

    # ── USER PROFILE + NOTES ─────────────────────────────────────────────────

    if action == "user-profile" and method == "GET":
        uid = params.get("user_id")
        if not uid:
            return err("user_id обязателен")
        cur.execute(f"""
            SELECT id, name, callsign, email, rank, role, status, is_admin, is_blocked,
                   created_at, approved_at, last_seen
            FROM {q('users')} WHERE id = %s
        """, (uid,))
        u = cur.fetchone()
        if not u:
            return err("Пользователь не найден", 404)
        u = dict(u)
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('user_progress')} WHERE user_id = %s", (uid,))
        u["progress_count"] = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('topics')} WHERE user_id = %s", (uid,))
        u["topics_count"] = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('topic_replies')} WHERE user_id = %s", (uid,))
        u["replies_count"] = cur.fetchone()["cnt"]
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('messages')} WHERE sender_id = %s", (uid,))
        u["messages_count"] = cur.fetchone()["cnt"]
        cur.execute(f"SELECT note FROM {q('admin_user_notes')} WHERE user_id = %s AND admin_id = %s", (uid, admin["id"]))
        note_row = cur.fetchone()
        u["admin_note"] = note_row["note"] if note_row else ""
        return ok({"user": u})

    if action == "save-note" and method == "POST":
        uid = body.get("user_id")
        note = body.get("note", "")
        if not uid:
            return err("user_id обязателен")
        cur.execute(f"""
            INSERT INTO {q('admin_user_notes')} (user_id, admin_id, note)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, admin_id) DO UPDATE SET note = EXCLUDED.note, updated_at = NOW()
        """, (uid, admin["id"], note))
        conn.commit()
        return ok({"message": "Заметка сохранена"})

    # ── ANALYTICS ────────────────────────────────────────────────────────────

    if action == "registrations-chart" and method == "GET":
        cur.execute(f"""
            SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
                   COUNT(*) AS new_total,
                   COUNT(*) FILTER (WHERE status = 'approved') AS approved_total
            FROM {q('users')}
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at)
        """)
        rows = [dict(r) for r in cur.fetchall()]
        return ok({"chart": rows})

    if action == "top-content" and method == "GET":
        cur.execute(f"""
            SELECT f.id, f.title, f.file_type, f.category,
                   COUNT(up.id) AS views
            FROM {q('files')} f
            LEFT JOIN {q('user_progress')} up ON up.item_id = f.id
            GROUP BY f.id, f.title, f.file_type, f.category
            ORDER BY views DESC, f.created_at DESC
            LIMIT 8
        """)
        rows = [dict(r) for r in cur.fetchall()]
        return ok({"top": rows})

    # ── FILE MANAGEMENT ──────────────────────────────────────────────────────

    # POST ?action=update-file
    if action == "update-file" and method == "POST":
        fid = body.get("id")
        if not fid:
            return err("id обязателен")
        fields, vals = [], []
        for col in ["title", "description", "category"]:
            if col in body and body[col] is not None:
                fields.append(f"{col} = %s"); vals.append(body[col])
        if not fields:
            return err("Нет полей")
        vals.append(fid)
        cur.execute(f"UPDATE {q('files')} SET {', '.join(fields)} WHERE id = %s RETURNING title", vals)
        row = cur.fetchone()
        if not row:
            conn.commit(); return err("Файл не найден", 404)
        conn.commit()
        return ok({"message": f"Файл обновлён"})

    # POST ?action=bulk-delete-files
    if action == "bulk-delete-files" and method == "POST":
        ids = body.get("ids", [])
        if not ids or not isinstance(ids, list):
            return err("ids обязателен")
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('files')} WHERE id = ANY(%s::int[])", (ids,))
        count = cur.fetchone()["cnt"]
        cur.execute(f"UPDATE {q('files')} SET section = 'deleted' WHERE id = ANY(%s::int[])", (ids,))
        conn.commit()
        return ok({"message": f"Удалено {count} файлов"})

    # ── PAGES ────────────────────────────────────────────────────────────────

    # GET ?action=get-pages
    if action == "get-pages" and method == "GET":
        cur.execute(f"SELECT id, slug, title, is_system, is_visible, sort_order FROM {q('pages')} ORDER BY sort_order, id")
        pages = [dict(r) for r in cur.fetchall()]
        return ok({"pages": pages})

    # GET ?action=get-page&slug=home  (публичный — без проверки is_admin, уже разрешён выше)
    # POST ?action=create-page
    if action == "create-page" and method == "POST":
        slug = body.get("slug", "").strip().lower().replace(" ", "-")
        title = body.get("title", "").strip()
        if not slug or not title:
            return err("slug и title обязательны")
        cur.execute(f"SELECT id FROM {q('pages')} WHERE slug = %s", (slug,))
        if cur.fetchone():
            return err("Страница с таким slug уже существует")
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {q('pages')}")
        order = cur.fetchone()[0]
        cur.execute(
            f"INSERT INTO {q('pages')} (slug, title, is_system, sort_order) VALUES (%s, %s, FALSE, %s) RETURNING id",
            (slug, title, order)
        )
        page_id = cur.fetchone()[0]
        cur.execute(
            f"INSERT INTO {q('page_blocks')} (page_id, type, sort_order, data) VALUES (%s, 'text', 0, %s)",
            (page_id, json.dumps({"title": title, "content": "Содержимое страницы"}))
        )
        conn.commit()
        return ok({"id": page_id, "message": "Страница создана"})

    # POST ?action=update-page
    if action == "update-page" and method == "POST":
        page_id = body.get("page_id")
        title = body.get("title", "").strip()
        is_visible = body.get("is_visible")
        sort_order = body.get("sort_order")
        if not page_id:
            return err("page_id обязателен")
        fields = []
        vals = []
        if title:
            fields.append("title = %s"); vals.append(title)
        if is_visible is not None:
            fields.append("is_visible = %s"); vals.append(bool(is_visible))
        if sort_order is not None:
            fields.append("sort_order = %s"); vals.append(int(sort_order))
        if not fields:
            return err("Нет полей для обновления")
        fields.append("updated_at = NOW()")
        vals.append(page_id)
        cur.execute(f"UPDATE {q('pages')} SET {', '.join(fields)} WHERE id = %s", vals)
        conn.commit()
        return ok({"message": "Страница обновлена"})

    # POST ?action=delete-page
    if action == "delete-page" and method == "POST":
        page_id = body.get("page_id")
        if not page_id:
            return err("page_id обязателен")
        cur.execute(f"SELECT is_system FROM {q('pages')} WHERE id = %s", (page_id,))
        row = cur.fetchone()
        if not row:
            return err("Страница не найдена", 404)
        if row["is_system"]:
            return err("Системную страницу нельзя удалить")
        cur.execute(f"UPDATE {q('page_blocks')} SET data = data WHERE page_id = %s RETURNING id", (page_id,))
        cur.execute(f"UPDATE {q('pages')} SET is_visible = FALSE WHERE id = %s", (page_id,))
        cur.execute(f"UPDATE {q('pages')} SET slug = slug || '_deleted_' || %s WHERE id = %s", (str(page_id), page_id))
        conn.commit()
        return ok({"message": "Страница удалена"})

    # GET ?action=get-page-blocks&page_id=1
    if action == "get-page-blocks" and method == "GET":
        page_id = (event.get("queryStringParameters") or {}).get("page_id")
        if not page_id:
            return err("page_id обязателен")
        cur.execute(f"SELECT id, type, sort_order, data FROM {q('page_blocks')} WHERE page_id = %s ORDER BY sort_order", (page_id,))
        blocks = [dict(r) for r in cur.fetchall()]
        return ok({"blocks": blocks})

    # POST ?action=update-block
    if action == "update-block" and method == "POST":
        block_id = body.get("block_id")
        data = body.get("data")
        if not block_id or data is None:
            return err("block_id и data обязательны")
        cur.execute(
            f"UPDATE {q('page_blocks')} SET data = %s, updated_at = NOW() WHERE id = %s",
            (json.dumps(data), block_id)
        )
        conn.commit()
        return ok({"message": "Блок сохранён"})

    # POST ?action=add-block
    if action == "add-block" and method == "POST":
        page_id = body.get("page_id")
        block_type = body.get("type", "text")
        if not page_id:
            return err("page_id обязателен")
        defaults = {
            "hero": {"sysLabel": "SYS.INIT", "title1": "ЗАГОЛОВОК", "title2": "", "title3": "", "subtitle": "Описание страницы", "btn1Label": "Кнопка 1", "btn1Page": "home", "btn2Label": "Кнопка 2", "btn2Page": "home"},
            "stats": [{"value": "0", "label": "Метрика", "icon": "BarChart"}],
            "features": [{"icon": "Star", "title": "Раздел", "desc": "Описание", "page": "home"}],
            "text": {"title": "Заголовок блока", "content": "Текст блока"},
            "cta": {"label": "// ПОДЗАГОЛОВОК", "title": "ЗАГОЛОВОК", "subtitle": "Описание", "btnLabel": "Кнопка", "btnPage": "home"},
            "intro-video": {"url": "", "caption": ""},
        }
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {q('page_blocks')} WHERE page_id = %s", (page_id,))
        order = cur.fetchone()[0]
        cur.execute(
            f"INSERT INTO {q('page_blocks')} (page_id, type, sort_order, data) VALUES (%s, %s, %s, %s) RETURNING id",
            (page_id, block_type, order, json.dumps(defaults.get(block_type, {})))
        )
        block_id = cur.fetchone()[0]
        conn.commit()
        return ok({"block_id": block_id, "message": "Блок добавлен"})

    # POST ?action=delete-block
    if action == "delete-block" and method == "POST":
        block_id = body.get("block_id")
        if not block_id:
            return err("block_id обязателен")
        cur.execute(f"UPDATE {q('page_blocks')} SET sort_order = -1 WHERE id = %s RETURNING page_id", (block_id,))
        row = cur.fetchone()
        if not row:
            return err("Блок не найден", 404)
        cur.execute(f"SELECT COUNT(*) AS cnt FROM {q('page_blocks')} WHERE page_id = %s AND sort_order >= 0", (row["page_id"],))
        if cur.fetchone()["cnt"] < 1:
            return err("Нельзя удалить последний блок")
        cur.execute(f"UPDATE {q('page_blocks')} SET data = '{{}}'::jsonb WHERE id = %s AND sort_order = -1", (block_id,))
        conn.commit()
        return ok({"message": "Блок удалён"})

    # ── DRONE TYPES (CRUD, только для админов) ───────────────────────────────

    # POST ?action=drone-create
    if action == "drone-create" and method == "POST":
        d = body
        code = (d.get("code") or "").strip().upper()
        name = (d.get("name") or "").strip()
        if not code or not name:
            return err("code и name обязательны")
        cur.execute(f"SELECT id FROM {q('drone_types')} WHERE code = %s", (code,))
        if cur.fetchone():
            return err(f"Код {code} уже существует")
        cur.execute(f"SELECT COALESCE(MAX(sort_order),0)+1 FROM {q('drone_types')}")
        order = cur.fetchone()[0]
        cur.execute(f"""
            INSERT INTO {q('drone_types')} (code, name, category, range_val, payload, speed, endurance, emoji, color, description, tags, sort_order)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
        """, (code, name, d.get("category",""), d.get("range_val","—"), d.get("payload","—"),
              d.get("speed","—"), d.get("endurance","—"), d.get("emoji","🚁"),
              d.get("color","#00f5ff"), d.get("description",""),
              d.get("tags",[]), order))
        new_id = cur.fetchone()["id"]
        conn.commit()
        audit(cur, admin, "drone_create", "drone", new_id, name)
        conn.commit()
        return ok({"id": new_id, "message": f"Тип БпЛА «{name}» создан"})

    # POST ?action=drone-update
    if action == "drone-update" and method == "POST":
        drone_id = body.get("id")
        if not drone_id:
            return err("id обязателен")
        d = body
        fields, vals = [], []
        for col in ["name","category","range_val","payload","speed","endurance","emoji","color","description","sort_order"]:
            if col in d:
                fields.append(f"{col} = %s"); vals.append(d[col])
        if "tags" in d:
            fields.append("tags = %s"); vals.append(d["tags"])
        if "is_visible" in d:
            fields.append("is_visible = %s"); vals.append(bool(d["is_visible"]))
        if not fields:
            return err("Нет полей для обновления")
        fields.append("updated_at = NOW()")
        vals.append(drone_id)
        cur.execute(f"UPDATE {q('drone_types')} SET {', '.join(fields)} WHERE id = %s RETURNING name", vals)
        row = cur.fetchone()
        if not row:
            conn.commit(); return err("Тип не найден", 404)
        conn.commit()
        return ok({"message": f"Тип «{row['name']}» обновлён"})

    # POST ?action=drone-delete
    if action == "drone-delete" and method == "POST":
        drone_id = body.get("id")
        if not drone_id:
            return err("id обязателен")
        cur.execute(f"DELETE FROM {q('drone_types')} WHERE id = %s RETURNING name", (drone_id,))
        row = cur.fetchone()
        if not row:
            conn.commit(); return err("Тип не найден", 404)
        audit(cur, admin, "drone_delete", "drone", drone_id, row["name"])
        conn.commit()
        return ok({"message": f"Тип «{row['name']}» удалён"})

    return err("Не найдено", 404)


# ── DISCUSSIONS ──────────────────────────────────────────────────────────────

DISC_CATEGORIES = ["Общее", "Техника", "Тактика", "Настройка", "Разбор", "Вопросы"]


def get_any_user(event, cur):
    """Возвращает пользователя по токену (не обязательно admin)."""
    auth = event.get("headers", {}).get("X-Authorization") or event.get("headers", {}).get("x-authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur.execute(f"SELECT id, name, callsign, is_admin, role FROM {q('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    row = cur.fetchone()
    return dict(row) if row else None


def handle_discussions(event, method, action, body, conn, cur):
    topic_id = (event.get("queryStringParameters") or {}).get("topic_id")
    user = get_any_user(event, cur)

    # GET topics list
    if action == "disc-topics" and method == "GET":
        cur.execute(f"""
            SELECT t.id, t.title, t.category, t.views, t.created_at, t.updated_at,
                   t.is_pinned,
                   u.name as author_name, u.callsign as author_callsign,
                   COUNT(r.id) as replies_count
            FROM {q('topics')} t
            JOIN {q('users')} u ON t.author_id = u.id
            LEFT JOIN {q('topic_replies')} r ON r.topic_id = t.id
            GROUP BY t.id, u.name, u.callsign
            ORDER BY t.is_pinned DESC, t.updated_at DESC
        """)
        topics = [dict(t) for t in cur.fetchall()]
        return ok({"topics": topics, "categories": DISC_CATEGORIES})

    # GET single topic + replies (с лайками и цитатами)
    if action == "disc-topic" and method == "GET":
        if not topic_id:
            return err("Укажите topic_id")
        cur.execute(f"""
            SELECT t.id, t.title, t.category, t.views, t.created_at,
                   u.name as author_name, u.callsign as author_callsign
            FROM {q('topics')} t JOIN {q('users')} u ON t.author_id = u.id
            WHERE t.id = %s
        """, (topic_id,))
        topic = cur.fetchone()
        if not topic:
            return err("Топик не найден", 404)
        cur.execute(f"UPDATE {q('topics')} SET views = views + 1 WHERE id = %s", (topic_id,))
        conn.commit()
        cur.execute(f"""
            SELECT r.id, r.text, r.created_at, r.updated_at, r.likes_count,
                   r.quote_reply_id, r.author_id,
                   u.name as author_name, u.callsign as author_callsign,
                   qr.text as quote_text, qu.callsign as quote_callsign
            FROM {q('topic_replies')} r
            JOIN {q('users')} u ON r.author_id = u.id
            LEFT JOIN {q('topic_replies')} qr ON qr.id = r.quote_reply_id
            LEFT JOIN {q('users')} qu ON qu.id = qr.author_id
            WHERE r.topic_id = %s ORDER BY r.created_at ASC
        """, (topic_id,))
        replies = [dict(r) for r in cur.fetchall()]
        # Лайки текущего пользователя
        my_likes = set()
        if user:
            reply_ids = [r["id"] for r in replies]
            if reply_ids:
                cur.execute(f"SELECT reply_id FROM {q('topic_reply_likes')} WHERE user_id = %s AND reply_id = ANY(%s::int[])", (user["id"], reply_ids))
                my_likes = {row["reply_id"] for row in cur.fetchall()}
        for r in replies:
            r["i_liked"] = r["id"] in my_likes
        return ok({"topic": dict(topic), "replies": replies})

    # POST create topic
    if action == "disc-create" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        if not (user["is_admin"] or user.get("role") in INSTRUCTOR_ROLES):
            return err("Создавать темы могут только инструкторы", 403)
        title = body.get("title", "").strip()
        category = body.get("category", "Общее")
        text = body.get("text", "").strip()
        if not title:
            return err("Укажите заголовок")
        if category not in DISC_CATEGORIES:
            category = "Общее"
        cur.execute(f"INSERT INTO {q('topics')} (title, category, author_id) VALUES (%s, %s, %s) RETURNING id", (title, category, user["id"]))
        new_id = cur.fetchone()["id"]
        if text:
            cur.execute(f"INSERT INTO {q('topic_replies')} (topic_id, author_id, text) VALUES (%s, %s, %s)", (new_id, user["id"], text))
        conn.commit()
        return ok({"id": new_id})

    # POST delete topic (только для админов)
    if action == "disc-delete-topic" and method == "POST":
        if not user or not user["is_admin"]:
            return err("Доступ запрещён", 403)
        if not topic_id:
            return err("Укажите topic_id")
        cur.execute(f"SELECT id FROM {q('topics')} WHERE id = %s", (topic_id,))
        if not cur.fetchone():
            return err("Топик не найден", 404)
        cur.execute(f"DELETE FROM {q('topic_replies')} WHERE topic_id = %s", (topic_id,))
        cur.execute(f"DELETE FROM {q('topics')} WHERE id = %s", (topic_id,))
        conn.commit()
        return ok({"ok": True})

    # POST delete reply (только для админов)
    if action == "disc-delete-reply" and method == "POST":
        if not user or not user["is_admin"]:
            return err("Доступ запрещён", 403)
        reply_id = body.get("reply_id")
        if not reply_id:
            return err("Укажите reply_id")
        cur.execute(f"SELECT id, topic_id FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        row = cur.fetchone()
        if not row:
            return err("Ответ не найден", 404)
        cur.execute(f"DELETE FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        cur.execute(f"UPDATE {q('topics')} SET updated_at = NOW() WHERE id = %s", (row["topic_id"],))
        conn.commit()
        return ok({"ok": True})

    # POST edit reply (автор или админ)
    if action == "disc-edit-reply" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        reply_id = body.get("reply_id")
        text = (body.get("text") or "").strip()
        if not reply_id or not text:
            return err("Укажите reply_id и текст")
        cur.execute(f"SELECT id, author_id FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        row = cur.fetchone()
        if not row:
            return err("Ответ не найден", 404)
        if not user["is_admin"] and row["author_id"] != user["id"]:
            return err("Нет прав", 403)
        cur.execute(f"UPDATE {q('topic_replies')} SET text = %s, updated_at = NOW() WHERE id = %s", (text, reply_id))
        conn.commit()
        return ok({"ok": True})

    # POST pin/unpin topic (только для админов)
    if action == "disc-pin-topic" and method == "POST":
        if not user or not user["is_admin"]:
            return err("Доступ запрещён", 403)
        if not topic_id:
            return err("Укажите topic_id")
        cur.execute(f"SELECT is_pinned FROM {q('topics')} WHERE id = %s", (topic_id,))
        row = cur.fetchone()
        if not row:
            return err("Топик не найден", 404)
        cur.execute(f"UPDATE {q('topics')} SET is_pinned = %s WHERE id = %s", (not row["is_pinned"], topic_id))
        conn.commit()
        return ok({"is_pinned": not row["is_pinned"]})

    # POST add reply (с поддержкой цитирования)
    if action == "disc-reply" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        if not topic_id:
            return err("Укажите topic_id")
        text = body.get("text", "").strip()
        quote_reply_id = body.get("quote_reply_id")
        if not text:
            return err("Текст не может быть пустым")
        cur.execute(f"SELECT id FROM {q('topics')} WHERE id = %s", (topic_id,))
        if not cur.fetchone():
            return err("Топик не найден", 404)
        cur.execute(f"INSERT INTO {q('topic_replies')} (topic_id, author_id, text, quote_reply_id) VALUES (%s, %s, %s, %s) RETURNING id",
            (topic_id, user["id"], text, quote_reply_id or None))
        reply_id = cur.fetchone()["id"]
        cur.execute(f"UPDATE {q('topics')} SET updated_at = NOW() WHERE id = %s", (topic_id,))
        conn.commit()
        return ok({"id": reply_id})

    # POST лайк/снять лайк с ответа
    if action == "disc-like" and method == "POST":
        if not user:
            return err("Требуется авторизация", 401)
        reply_id = body.get("reply_id")
        if not reply_id:
            return err("Укажите reply_id")
        cur.execute(f"SELECT id FROM {q('topic_reply_likes')} WHERE reply_id = %s AND user_id = %s", (reply_id, user["id"]))
        existing = cur.fetchone()
        if existing:
            cur.execute(f"DELETE FROM {q('topic_reply_likes')} WHERE reply_id = %s AND user_id = %s", (reply_id, user["id"]))
            cur.execute(f"UPDATE {q('topic_replies')} SET likes_count = GREATEST(0, likes_count - 1) WHERE id = %s", (reply_id,))
            liked = False
        else:
            cur.execute(f"INSERT INTO {q('topic_reply_likes')} (reply_id, user_id) VALUES (%s, %s)", (reply_id, user["id"]))
            cur.execute(f"UPDATE {q('topic_replies')} SET likes_count = likes_count + 1 WHERE id = %s", (reply_id,))
            liked = True
        cur.execute(f"SELECT likes_count FROM {q('topic_replies')} WHERE id = %s", (reply_id,))
        count = cur.fetchone()["likes_count"]
        conn.commit()
        return ok({"liked": liked, "likes_count": count})

    return None