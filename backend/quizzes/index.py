"""
Тесты после лекций: создание, прохождение, результаты.
Действия: quiz-get, quiz-submit, my-results, admin-quiz-create, admin-quiz-update, admin-quiz-delete
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
    """Тесты: получение вопросов, отправка ответов, результаты."""
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

    # ── Получить тест для лекции ──
    if action == "quiz-get" and method == "GET":
        lecture_id = params.get("lecture_id")
        if not lecture_id:
            return err("Укажите lecture_id")
        cur.execute(f"SELECT id, title FROM {t('quizzes')} WHERE lecture_id = %s", (lecture_id,))
        quiz = cur.fetchone()
        if not quiz:
            return ok({"quiz": None})
        cur.execute(f"SELECT id, question, options, sort_order FROM {t('quiz_questions')} WHERE quiz_id = %s ORDER BY sort_order", (quiz["id"],))
        questions = cur.fetchall()
        # Убираем correct_index из ответа
        cur.execute(f"SELECT id, score, total, passed, completed_at FROM {t('quiz_results')} WHERE user_id = %s AND quiz_id = %s", (user["id"], quiz["id"]))
        my_result = cur.fetchone()
        return ok({"quiz": {**quiz, "questions": questions}, "my_result": my_result})

    # ── Отправить ответы ──
    if action == "quiz-submit" and method == "POST":
        quiz_id = body.get("quiz_id")
        answers = body.get("answers", {})  # {question_id: chosen_index}
        if not quiz_id:
            return err("Укажите quiz_id")
        cur.execute(f"SELECT id FROM {t('quizzes')} WHERE id = %s", (quiz_id,))
        if not cur.fetchone():
            return err("Тест не найден", 404)
        cur.execute(f"SELECT id, correct_index FROM {t('quiz_questions')} WHERE quiz_id = %s", (quiz_id,))
        questions = cur.fetchall()
        if not questions:
            return err("Нет вопросов")
        score = sum(1 for q in questions if str(answers.get(str(q["id"]))) == str(q["correct_index"]))
        total = len(questions)
        passed = score >= round(total * 0.6)
        cur.execute(f"""
            INSERT INTO {t('quiz_results')} (user_id, quiz_id, score, total, passed, completed_at)
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT (user_id, quiz_id) DO UPDATE SET score = %s, total = %s, passed = %s, completed_at = NOW()
        """, (user["id"], quiz_id, score, total, passed, score, total, passed))
        conn.commit()
        # Показать правильные ответы
        cur.execute(f"SELECT id, correct_index FROM {t('quiz_questions')} WHERE quiz_id = %s", (quiz_id,))
        correct = {str(q["id"]): q["correct_index"] for q in cur.fetchall()}
        return ok({"score": score, "total": total, "passed": passed, "correct_answers": correct})

    # ── Мои результаты ──
    if action == "my-results" and method == "GET":
        cur.execute(f"""
            SELECT qr.*, qz.title, qz.lecture_id
            FROM {t('quiz_results')} qr
            JOIN {t('quizzes')} qz ON qz.id = qr.quiz_id
            WHERE qr.user_id = %s
            ORDER BY qr.completed_at DESC
        """, (user["id"],))
        return ok({"results": cur.fetchall()})

    # ─── ADMIN ───
    if not user.get("is_admin"):
        return err("Доступ запрещён", 403)

    # ── Создать тест ──
    if action == "admin-quiz-create" and method == "POST":
        lecture_id = body.get("lecture_id")
        title = (body.get("title") or "").strip()
        questions = body.get("questions", [])
        if not lecture_id or not title or not questions:
            return err("Укажите lecture_id, title и questions")
        cur.execute(f"SELECT id FROM {t('quizzes')} WHERE lecture_id = %s", (lecture_id,))
        if cur.fetchone():
            return err("Тест для этой лекции уже существует")
        cur.execute(f"INSERT INTO {t('quizzes')} (lecture_id, title, created_by) VALUES (%s, %s, %s) RETURNING id", (lecture_id, title, user["id"]))
        quiz_id = cur.fetchone()["id"]
        for i, q in enumerate(questions):
            cur.execute(f"INSERT INTO {t('quiz_questions')} (quiz_id, question, options, correct_index, sort_order) VALUES (%s, %s, %s, %s, %s)",
                (quiz_id, q["question"], json.dumps(q["options"], ensure_ascii=False), q["correct_index"], i))
        conn.commit()
        return ok({"quiz_id": quiz_id})

    # ── Удалить тест ──
    if action == "admin-quiz-delete" and method == "POST":
        quiz_id = body.get("quiz_id")
        cur.execute(f"DELETE FROM {t('quiz_questions')} WHERE quiz_id = %s", (quiz_id,))
        cur.execute(f"DELETE FROM {t('quiz_results')} WHERE quiz_id = %s", (quiz_id,))
        cur.execute(f"DELETE FROM {t('quizzes')} WHERE id = %s", (quiz_id,))
        conn.commit()
        return ok({"ok": True})

    # ── Список тестов (для AdminPage) ──
    if action == "admin-list" and method == "GET":
        cur.execute(f"""
            SELECT qz.id, qz.title, qz.lecture_id, qz.created_at,
                COUNT(DISTINCT qq.id) AS question_count,
                COUNT(DISTINCT qr.user_id) AS attempts
            FROM {t('quizzes')} qz
            LEFT JOIN {t('quiz_questions')} qq ON qq.quiz_id = qz.id
            LEFT JOIN {t('quiz_results')} qr ON qr.quiz_id = qz.id
            GROUP BY qz.id
            ORDER BY qz.created_at DESC
        """)
        return ok({"quizzes": cur.fetchall()})

    return err("Неизвестное действие", 404)
