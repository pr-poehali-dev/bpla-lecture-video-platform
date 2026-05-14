-- Таблица приказов о присвоении/изменении звания
CREATE TABLE IF NOT EXISTS t_p1589553_bpla_lecture_video_p.rank_orders (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    old_rank    VARCHAR(100),
    new_rank    VARCHAR(100) NOT NULL,
    order_number VARCHAR(100),
    order_date  DATE,
    note        TEXT,
    file_url    VARCHAR(500),
    file_name   VARCHAR(255),
    file_size   INTEGER,
    s3_key      VARCHAR(500),
    issued_by   INTEGER NOT NULL,
    issued_by_name VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rank_orders_user_id ON t_p1589553_bpla_lecture_video_p.rank_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_rank_orders_created_at ON t_p1589553_bpla_lecture_video_p.rank_orders(created_at DESC);
