ALTER TABLE t_p1589553_bpla_lecture_video_p.messages ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;
ALTER TABLE t_p1589553_bpla_lecture_video_p.messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
ALTER TABLE t_p1589553_bpla_lecture_video_p.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.typing_status (chat_id INTEGER NOT NULL, user_id INTEGER NOT NULL, updated_at TIMESTAMP DEFAULT NOW(), PRIMARY KEY (chat_id, user_id));