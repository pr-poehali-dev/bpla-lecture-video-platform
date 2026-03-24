-- Индекс на session_token — самый частый запрос (каждый вызов auth/me)
CREATE INDEX IF NOT EXISTS idx_users_session_token
    ON "t_p1589553_bpla_lecture_video_p".users (session_token)
    WHERE session_token IS NOT NULL;

-- Индекс на status — фильтрация одобренных пользователей
CREATE INDEX IF NOT EXISTS idx_users_status
    ON "t_p1589553_bpla_lecture_video_p".users (status);

-- Индекс на chat_members(chat_id, user_id) — JOIN в списке чатов
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_user
    ON "t_p1589553_bpla_lecture_video_p".chat_members (chat_id, user_id);

-- Индекс на chat_members(user_id) — поиск чатов пользователя
CREATE INDEX IF NOT EXISTS idx_chat_members_user
    ON "t_p1589553_bpla_lecture_video_p".chat_members (user_id);

-- Индекс на messages(chat_id, created_at) — последнее сообщение в чате
CREATE INDEX IF NOT EXISTS idx_messages_chat_created
    ON "t_p1589553_bpla_lecture_video_p".messages (chat_id, created_at DESC);

-- Индекс на role_permissions(role) — получение прав пользователя при входе
CREATE INDEX IF NOT EXISTS idx_role_permissions_role
    ON "t_p1589553_bpla_lecture_video_p".role_permissions (role);

-- Индекс на files(created_at) — сортировка списка файлов
CREATE INDEX IF NOT EXISTS idx_files_created
    ON "t_p1589553_bpla_lecture_video_p".files (created_at DESC);

-- Индекс на file_removal_requests(status) — фильтр pending заявок
CREATE INDEX IF NOT EXISTS idx_removal_requests_status
    ON "t_p1589553_bpla_lecture_video_p".file_removal_requests (status);
