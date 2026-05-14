-- Папки инструкторов (поддержка вложенности через parent_id)
CREATE TABLE IF NOT EXISTS instructor_folders (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    parent_id INTEGER,
    color TEXT NOT NULL DEFAULT '#00f5ff',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_folders_instructor ON instructor_folders(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_folders_parent ON instructor_folders(parent_id);

-- Добавляем поля в instructor_documents
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS folder_id INTEGER;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS doc_type TEXT NOT NULL DEFAULT 'document';
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS file_original_name TEXT;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS file_mime TEXT;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS s3_key TEXT;
ALTER TABLE instructor_documents ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_instructor_documents_folder ON instructor_documents(folder_id);
