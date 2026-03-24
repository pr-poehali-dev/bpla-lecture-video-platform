-- Кэш прав доступа прямо в таблице пользователя
ALTER TABLE "t_p1589553_bpla_lecture_video_p".users
    ADD COLUMN IF NOT EXISTS permissions_cache JSONB DEFAULT NULL;
