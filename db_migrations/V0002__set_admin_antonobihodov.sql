UPDATE t_p1589553_bpla_lecture_video_p.users
SET status = 'approved', is_admin = TRUE, approved_at = NOW()
WHERE email = 'antonobihodov@yandex.ru';
