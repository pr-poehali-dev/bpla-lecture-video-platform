CREATE TABLE IF NOT EXISTS admin_user_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, admin_id)
);
