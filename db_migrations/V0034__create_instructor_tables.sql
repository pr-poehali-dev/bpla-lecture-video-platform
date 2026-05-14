CREATE TABLE IF NOT EXISTS instructor_schedule (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    group_name TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    scheduled_date DATE NOT NULL,
    time_start TIME,
    time_end TIME,
    notes TEXT NOT NULL DEFAULT '',
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instructor_grade_sheets (
    id SERIAL PRIMARY KEY,
    instructor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    group_name TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL DEFAULT '',
    sheet_data JSONB NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instructor_schedule_instructor ON instructor_schedule(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_schedule_date ON instructor_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_instructor_grade_sheets_instructor ON instructor_grade_sheets(instructor_id);
