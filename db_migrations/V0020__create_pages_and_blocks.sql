CREATE TABLE IF NOT EXISTS "t_p1589553_bpla_lecture_video_p".pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_system BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "t_p1589553_bpla_lecture_video_p".page_blocks (
  id SERIAL PRIMARY KEY,
  page_id INT NOT NULL REFERENCES "t_p1589553_bpla_lecture_video_p".pages(id),
  type VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO "t_p1589553_bpla_lecture_video_p".pages (slug, title, is_system, sort_order)
VALUES ('home', 'Главная', TRUE, 0)
ON CONFLICT (slug) DO NOTHING;
