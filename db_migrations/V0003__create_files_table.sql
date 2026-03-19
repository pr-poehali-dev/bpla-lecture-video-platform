CREATE TABLE t_p1589553_bpla_lecture_video_p.files (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(20) NOT NULL, -- 'video' or 'document'
  category VARCHAR(100),
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  s3_key VARCHAR(500) NOT NULL,
  cdn_url VARCHAR(500) NOT NULL,
  uploaded_by INTEGER REFERENCES t_p1589553_bpla_lecture_video_p.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);