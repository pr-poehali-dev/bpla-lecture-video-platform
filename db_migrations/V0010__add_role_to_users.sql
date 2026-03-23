ALTER TABLE t_p1589553_bpla_lecture_video_p.users
ADD COLUMN role character varying(50) NOT NULL DEFAULT 'курсант'
CHECK (role IN ('курсант', 'инструктор', 'администратор'));