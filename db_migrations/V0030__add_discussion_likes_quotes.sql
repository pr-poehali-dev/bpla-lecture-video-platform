
-- Лайки на ответах
CREATE TABLE IF NOT EXISTS topic_reply_likes (
  id SERIAL PRIMARY KEY,
  reply_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply ON topic_reply_likes(reply_id);

-- Цитирование: ссылка на reply_id и author_id в ответах
ALTER TABLE topic_replies ADD COLUMN IF NOT EXISTS quote_reply_id INTEGER;
ALTER TABLE topic_replies ADD COLUMN IF NOT EXISTS author_id_check INTEGER;

-- Добавляем author_id если нет в replies (уже есть, просто на всякий случай)
-- Likes count cache column
ALTER TABLE topic_replies ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;
