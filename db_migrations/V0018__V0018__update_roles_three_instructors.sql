-- Шаг 1: переименовываем существующих инструкторов ДО смены constraint
UPDATE t_p1589553_bpla_lecture_video_p.users
  SET role = 'инструктор кт'
  WHERE role = 'инструктор';

-- Шаг 2: меняем CHECK constraint
ALTER TABLE t_p1589553_bpla_lecture_video_p.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE t_p1589553_bpla_lecture_video_p.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('курсант', 'инструктор кт', 'инструктор fpv', 'инструктор оператор-сапер', 'администратор'));

-- Шаг 3: добавляем права доступа для новых ролей
INSERT INTO t_p1589553_bpla_lecture_video_p.role_permissions (role, page, allowed) VALUES
  ('инструктор кт', 'home', true),
  ('инструктор кт', 'lectures', true),
  ('инструктор кт', 'videos', true),
  ('инструктор кт', 'drone-types', true),
  ('инструктор кт', 'materials', true),
  ('инструктор кт', 'firmware', true),
  ('инструктор кт', 'discussions', true),
  ('инструктор кт', 'downloads', true),
  ('инструктор fpv', 'home', true),
  ('инструктор fpv', 'lectures', true),
  ('инструктор fpv', 'videos', true),
  ('инструктор fpv', 'drone-types', true),
  ('инструктор fpv', 'materials', true),
  ('инструктор fpv', 'firmware', true),
  ('инструктор fpv', 'discussions', true),
  ('инструктор fpv', 'downloads', true),
  ('инструктор оператор-сапер', 'home', true),
  ('инструктор оператор-сапер', 'lectures', true),
  ('инструктор оператор-сапер', 'videos', true),
  ('инструктор оператор-сапер', 'drone-types', true),
  ('инструктор оператор-сапер', 'materials', true),
  ('инструктор оператор-сапер', 'firmware', true),
  ('инструктор оператор-сапер', 'discussions', true),
  ('инструктор оператор-сапер', 'downloads', true)
ON CONFLICT (role, page) DO NOTHING;
