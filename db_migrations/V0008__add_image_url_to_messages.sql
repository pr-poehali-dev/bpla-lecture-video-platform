ALTER TABLE "t_p1589553_bpla_lecture_video_p".messages
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text';