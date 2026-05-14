-- Таблица персонального доступа к документу (вместо глобального is_shared)
CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.doc_access (
    id          SERIAL PRIMARY KEY,
    doc_id      INTEGER NOT NULL,
    grantee_id  INTEGER NOT NULL,
    granted_by  INTEGER NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(doc_id, grantee_id)
);

CREATE INDEX IF NOT EXISTS idx_doc_access_doc_id ON t_p1589553_bpla_lecture_video_p.doc_access(doc_id);
CREATE INDEX IF NOT EXISTS idx_doc_access_grantee ON t_p1589553_bpla_lecture_video_p.doc_access(grantee_id);
