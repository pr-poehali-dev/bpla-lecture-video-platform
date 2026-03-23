CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.topics (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Общее',
    author_id INTEGER NOT NULL REFERENCES t_p1589553_bpla_lecture_video_p.users(id),
    views INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.topic_replies (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES t_p1589553_bpla_lecture_video_p.topics(id),
    author_id INTEGER NOT NULL REFERENCES t_p1589553_bpla_lecture_video_p.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);