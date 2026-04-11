"""
Прогресс обучения, заметки, рейтинг участников.
Действия: mark-done, mark-undone, my-progress, my-notes, note-save, note-delete, leaderboard
"""
import json, os, psycopg2
from psycopg2.extras import RealDictCursor

CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization"}

def get_conn(): return psycopg2.connect(os.environ["DATABASE_URL"])
def schema(): return os.environ.get("MAIN_DB_SCHEMA", "public")
def t(n): return f'"{schema()}".{n}'
def ok(d, s=200): return {"statusCode": s, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(d, ensure_ascii=False, default=str)}
def err(m, s=400): return {"statusCode": s, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": m}, ensure_ascii=False)}

def get_user(cur, token):
    cur.execute(f"SELECT id, name, callsign, rank, is_admin FROM {t('users')} WHERE session_token = %s AND status = 'approved'", (token,))
    return cur.fetchone()

def extract_token(event):
    h = event.get("headers") or {}
    auth = h.get("X-Authorization") or h.get("x-authorization") or h.get("Authorization") or h.get("authorization") or ""
    return auth.replace("Bearer ", "").strip()

def handler(event: dict, context) -> dict:
    """Прогресс обучения: отметки просмотра, заметки, рейтинг."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        try: body = json.loads(event["body"])
        except: pass

    token = extract_token(event)
    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    user = get_user(cur, token) if token else None
    if not user:
        return err("Не авторизован", 401)

    # ── Отметить как просмотрено ──
    if action == "mark-done" and method == "POST":
        item_type = body.get("item_type", "")
        item_id = body.get("item_id")
        if item_type not in ("lecture", "video") or not item_id:
            return err("Укажите item_type и item_id")
        cur.execute(f"""
            INSERT INTO {t('user_progress')} (user_id, item_type, item_id, completed, completed_at)
            VALUES (%s, %s, %s, TRUE, NOW())
            ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET completed = TRUE, completed_at = NOW()
        """, (user["id"], item_type, item_id))
        conn.commit()
        return ok({"ok": True})

    # ── Убрать отметку ──
    if action == "mark-undone" and method == "POST":
        item_type = body.get("item_type", "")
        item_id = body.get("item_id")
        cur.execute(f"DELETE FROM {t('user_progress')} WHERE user_id = %s AND item_type = %s AND item_id = %s", (user["id"], item_type, item_id))
        conn.commit()
        return ok({"ok": True})

    # ── Мой прогресс ──
    if action == "my-progress" and method == "GET":
        cur.execute(f"SELECT item_type, item_id, completed_at FROM {t('user_progress')} WHERE user_id = %s", (user["id"],))
        rows = cur.fetchall()
        return ok({"progress": rows})

    # ── Сохранить заметку ──
    if action == "note-save" and method == "POST":
        item_type = body.get("item_type", "")
        item_id = body.get("item_id")
        content = (body.get("content") or "").strip()
        if not content or not item_id or item_type not in ("lecture", "video"):
            return err("Укажите item_type, item_id и content")
        cur.execute(f"""
            INSERT INTO {t('user_notes')} (user_id, item_type, item_id, content, updated_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT DO NOTHING
        """, (user["id"], item_type, item_id, content))
        if cur.rowcount == 0:
            cur.execute(f"UPDATE {t('user_notes')} SET content = %s, updated_at = NOW() WHERE user_id = %s AND item_type = %s AND item_id = %s",
                (content, user["id"], item_type, item_id))
        conn.commit()
        return ok({"ok": True})

    # ── Мои заметки ──
    if action == "my-notes" and method == "GET":
        item_type = params.get("item_type")
        item_id = params.get("item_id")
        if item_id:
            cur.execute(f"SELECT * FROM {t('user_notes')} WHERE user_id = %s AND item_type = %s AND item_id = %s", (user["id"], item_type, item_id))
        else:
            cur.execute(f"SELECT * FROM {t('user_notes')} WHERE user_id = %s ORDER BY updated_at DESC", (user["id"],))
        return ok({"notes": cur.fetchall()})

    # ── Удалить заметку ──
    if action == "note-delete" and method == "POST":
        note_id = body.get("note_id")
        cur.execute(f"DELETE FROM {t('user_notes')} WHERE id = %s AND user_id = %s", (note_id, user["id"]))
        conn.commit()
        return ok({"ok": True})

    # ── Рейтинг ──
    if action == "leaderboard" and method == "GET":
        cur.execute(f"""
            SELECT
                u.id, u.callsign, u.name, u.rank, u.avatar_url,
                COUNT(DISTINCT p.id) AS completed_count,
                COUNT(DISTINCT CASE WHEN p.item_type = 'lecture' THEN p.id END) AS lectures_done,
                COUNT(DISTINCT CASE WHEN p.item_type = 'video' THEN p.id END) AS videos_done,
                COUNT(DISTINCT qr.id) AS quizzes_passed,
                (COUNT(DISTINCT p.id) * 10 + COUNT(DISTINCT qr.id) * 25) AS score
            FROM {t('users')} u
            LEFT JOIN {t('user_progress')} p ON p.user_id = u.id AND p.completed = TRUE
            LEFT JOIN {t('quiz_results')} qr ON qr.user_id = u.id AND qr.passed = TRUE
            WHERE u.status = 'approved'
            GROUP BY u.id, u.callsign, u.name, u.rank, u.avatar_url
            ORDER BY score DESC
            LIMIT 50
        """)
        rows = cur.fetchall()
        # Найти позицию текущего пользователя
        my_pos = next((i+1 for i, r in enumerate(rows) if r["id"] == user["id"]), None)
        return ok({"leaderboard": rows, "my_position": my_pos})

    return err("Неизвестное действие", 404)
