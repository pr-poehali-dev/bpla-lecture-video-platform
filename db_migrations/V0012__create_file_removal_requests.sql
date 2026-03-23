CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.file_removal_requests (
    id SERIAL PRIMARY KEY,
    file_id INTEGER NOT NULL,
    requested_by INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);