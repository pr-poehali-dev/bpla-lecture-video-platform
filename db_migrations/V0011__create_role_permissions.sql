CREATE TABLE t_p1589553_bpla_lecture_video_p.role_permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  page VARCHAR(100) NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, page)
);

INSERT INTO t_p1589553_bpla_lecture_video_p.role_permissions (role, page, allowed) VALUES
  ('курсант', 'home', true),
  ('курсант', 'lectures', true),
  ('курсант', 'videos', true),
  ('курсант', 'drone-types', true),
  ('курсант', 'materials', true),
  ('курсант', 'firmware', false),
  ('курсант', 'discussions', true),
  ('курсант', 'downloads', false),
  ('инструктор', 'home', true),
  ('инструктор', 'lectures', true),
  ('инструктор', 'videos', true),
  ('инструктор', 'drone-types', true),
  ('инструктор', 'materials', true),
  ('инструктор', 'firmware', true),
  ('инструктор', 'discussions', true),
  ('инструктор', 'downloads', true);