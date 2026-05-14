CREATE TABLE IF NOT EXISTS instructor_documents (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Конспект',
    content_html TEXT NOT NULL DEFAULT '',
    group_name TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    shared_by_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_documents_instructor ON instructor_documents(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_documents_shared ON instructor_documents(is_shared);
