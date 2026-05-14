-- Добавляем номер жетона и подразделение в таблицу пользователей
ALTER TABLE t_p1589553_bpla_lecture_video_p.users
  ADD COLUMN IF NOT EXISTS dog_tag VARCHAR(50),
  ADD COLUMN IF NOT EXISTS unit VARCHAR(255);

-- Уникальный индекс для номера жетона (не NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_dog_tag
  ON t_p1589553_bpla_lecture_video_p.users (dog_tag)
  WHERE dog_tag IS NOT NULL AND dog_tag != '';
