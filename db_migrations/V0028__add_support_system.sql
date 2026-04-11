
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  content TEXT,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);

CREATE TABLE IF NOT EXISTS support_broadcasts (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
