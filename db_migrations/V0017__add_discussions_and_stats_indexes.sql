-- Индексы для дискуссий
CREATE INDEX IF NOT EXISTS idx_topics_created_at
    ON "t_p1589553_bpla_lecture_video_p".topics (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_topics_category
    ON "t_p1589553_bpla_lecture_video_p".topics (category);

CREATE INDEX IF NOT EXISTS idx_topic_replies_topic_id
    ON "t_p1589553_bpla_lecture_video_p".topic_replies (topic_id, created_at ASC);

-- Индекс на is_admin для подсчёта статистики
CREATE INDEX IF NOT EXISTS idx_users_is_admin
    ON "t_p1589553_bpla_lecture_video_p".users (is_admin) WHERE is_admin = TRUE;
