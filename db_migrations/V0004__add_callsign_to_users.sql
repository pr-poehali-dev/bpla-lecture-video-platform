ALTER TABLE t_p1589553_bpla_lecture_video_p.users
  ADD COLUMN callsign VARCHAR(100) NULL;

UPDATE t_p1589553_bpla_lecture_video_p.users
  SET callsign = name
  WHERE callsign IS NULL;

CREATE UNIQUE INDEX users_callsign_unique
  ON t_p1589553_bpla_lecture_video_p.users (callsign)
  WHERE callsign IS NOT NULL;