CREATE TABLE IF NOT EXISTS "t_p1589553_bpla_lecture_video_p".site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "t_p1589553_bpla_lecture_video_p".site_settings (key, value) VALUES ('site_enabled', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO "t_p1589553_bpla_lecture_video_p".site_settings (key, value) VALUES ('maintenance_message', 'Сайт временно недоступен. Ведутся технические работы.') ON CONFLICT (key) DO NOTHING;
