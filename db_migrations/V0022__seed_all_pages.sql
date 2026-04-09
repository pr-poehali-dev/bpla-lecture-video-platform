INSERT INTO "t_p1589553_bpla_lecture_video_p".pages (slug, title, is_system, sort_order)
VALUES
  ('lectures',    'Лекции',          TRUE, 1),
  ('videos',      'Видео',           TRUE, 2),
  ('materials',   'Материалы',       TRUE, 3),
  ('drone-types', 'Типы БпЛА',       TRUE, 4),
  ('firmware',    'Прошивки',        TRUE, 5),
  ('discussions', 'Обсуждения',      TRUE, 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"ЛЕКЦИИ","subtitle":"// УЧЕБНЫЙ ЦЕНТР","categories":["Все","Регламенты","Технические","Учебные","Схемы","Карты"]}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'lectures';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"ВИДЕОМАТЕРИАЛЫ","subtitle":"УЧЕБНЫЕ И БОЕВЫЕ ЗАПИСИ","categories":["Все","Боевые","Учебные","Технические","Разбор миссий"]}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'videos';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"МАТЕРИАЛЫ","subtitle":"ДОКУМЕНТЫ И РЕГЛАМЕНТЫ","categories":["Все","Регламенты","Технические","Учебные","Схемы","Карты"]}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'materials';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"ТИПЫ БпЛА","subtitle":"// КЛАССИФИКАЦИЯ"}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'drone-types';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'drone-list', 1, '[{"id":1,"code":"TYPE-01","name":"FPV Камикадзе","category":"Ударный","range":"5-10 км","payload":"0.3-1.5 кг","speed":"120-200 км/ч","endurance":"8-20 мин","emoji":"💥","color":"#ff2244","description":"Высокоскоростные одноразовые дроны для точечных ударов. Оснащаются боевой частью с осколочным или кумулятивным действием. Эффективны против живой силы, техники, укреплений.","tags":["Ударный","Одноразовый","FPV","Высокая скорость"]},{"id":2,"code":"TYPE-02","name":"Квадрокоптер разведчик","category":"Разведка","range":"3-15 км","payload":"до 0.5 кг","speed":"60-100 км/ч","endurance":"25-40 мин","emoji":"🔍","color":"#00f5ff","description":"Многороторные платформы для воздушной разведки, корректировки огня и наблюдения. Оснащаются оптическими и тепловизионными камерами.","tags":["Разведка","Корректировка","Многоразовый","Сенсоры"]},{"id":3,"code":"TYPE-03","name":"Гексакоптер носитель","category":"Транспортный","range":"2-8 км","payload":"3-10 кг","speed":"40-80 км/ч","endurance":"15-30 мин","emoji":"📦","color":"#00ff88","description":"Тяжёлые мультироторные платформы для доставки боеприпасов, снаряжения, сброса взрывных устройств на позиции противника.","tags":["Транспорт","Сброс","Тяжёлый","Многороторный"]},{"id":4,"code":"TYPE-04","name":"БпЛА самолётного типа","category":"Разведка / Ударный","range":"50-300 км","payload":"1-5 кг","speed":"100-180 км/ч","endurance":"2-8 ч","emoji":"✈️","color":"#ff6b00","description":"Самолётные БПЛА с большой дальностью и продолжительностью полёта. Применяются для глубокой разведки и стратегических ударов по тыловым объектам.","tags":["Дальний","Самолётный","Стратегический","Долгий полёт"]},{"id":5,"code":"TYPE-05","name":"Мини FPV разведчик","category":"Разведка","range":"1-3 км","payload":"до 0.1 кг","speed":"80-150 км/ч","endurance":"5-12 мин","emoji":"👁️","color":"#a855f7","description":"Малогабаритные FPV дроны для разведки в городских условиях, зданиях и узких пространствах. Минимальная тепловая и акустическая сигнатура.","tags":["Малый","Городской","Разведка","Стелс"]},{"id":6,"code":"TYPE-06","name":"Дрон-ретранслятор","category":"Связь","range":"10-50 км","payload":"до 1 кг","speed":"60-90 км/ч","endurance":"40-90 мин","emoji":"📡","color":"#f59e0b","description":"Дроны для обеспечения связи и ретрансляции сигналов на большие расстояния. Создают воздушные узлы связи в условиях радиопомех.","tags":["Связь","Ретранслятор","Долгий полёт","Поддержка"]}]'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'drone-types';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"ПРОШИВКИ И ПО","subtitle":"// ЗАГРУЗКИ И ОБНОВЛЕНИЯ","categories":["Все","Betaflight","ArduPilot","ExpressLRS","OpenTX/EdgeTX","Инструкции"]}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'firmware';

INSERT INTO "t_p1589553_bpla_lecture_video_p".page_blocks (page_id, type, sort_order, data)
SELECT id, 'header', 0, '{"title":"ОБСУЖДЕНИЯ","subtitle":"// ФОРУМ СООБЩЕСТВА","categories":["Общее","Техника","Тактика","Настройка","Разбор","Вопросы"]}'::jsonb
FROM "t_p1589553_bpla_lecture_video_p".pages WHERE slug = 'discussions';
