INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'rules-header', 0, '{"intro":"Платформа «Беспилотные Пилотируемые Системы» является закрытым учебным ресурсом. Доступ предоставляется только уполномоченным лицам. Регистрируясь, вы принимаете следующие обязательства:","footer":"Администрация платформы оставляет за собой право изменять правила без предварительного уведомления. Актуальная версия всегда доступна при регистрации."}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'rules';

UPDATE "t_p1589553_bpla_lecture_video_p".page_blocks
SET sort_order = 1
WHERE page_id = (SELECT id FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'rules')
  AND type = 'rules';
