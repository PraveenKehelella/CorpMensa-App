PRAGMA foreign_keys = ON;

-- Core client profile and latest rolled-up values used by dashboard cards/table.
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  type TEXT NOT NULL CHECK (type IN ('Business', 'Athlete')),
  age_group TEXT NOT NULL CHECK (age_group IN ('Teen', 'Adult', 'Senior')),
  sport TEXT CHECK (sport IN ('Soccer', 'Cycle', 'Motorbike', 'Boxing', 'Tennis') OR sport IS NULL),

  -- Latest health state
  pain_level INTEGER NOT NULL CHECK (pain_level BETWEEN 1 AND 10),
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('Morning', 'Evening')),
  swelling INTEGER NOT NULL CHECK (swelling IN (0, 1)),
  internal_external TEXT NOT NULL CHECK (internal_external IN ('Internal', 'External')),
  headaches INTEGER NOT NULL CHECK (headaches IN (0, 1)),
  steps INTEGER NOT NULL DEFAULT 0,
  sleep REAL NOT NULL DEFAULT 0,
  heart_rate INTEGER NOT NULL DEFAULT 0,

  -- Latest cognitive rollup
  cognitive_last_session TEXT,
  cognitive_reaction_time REAL,
  cognitive_accuracy REAL,
  cognitive_memory_score REAL,
  cognitive_processing_speed REAL,

  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  last_updated TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pain locations are multi-select (Joint/Muscles/Ligament/etc), so store as child rows.
CREATE TABLE IF NOT EXISTS client_pain_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('Joint', 'Muscles', 'Ligament', 'Dorsal', 'Lumbar', 'Cervical')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  UNIQUE (client_id, location)
);

-- Historical pain trend used by pain chart.
CREATE TABLE IF NOT EXISTS pain_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  value INTEGER NOT NULL CHECK (value BETWEEN 1 AND 10),
  recorded_at TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'onboarding', 'session')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Persist every cognitive game session (chart + audit + analytics).
CREATE TABLE IF NOT EXISTS cognitive_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (
    game_type IN ('math', 'tap-order', 'sequence', 'stroop', 'reaction')
  ),
  score REAL NOT NULL,
  accuracy REAL NOT NULL,
  avg_reaction_time REAL NOT NULL DEFAULT 0,
  max_sequence REAL NOT NULL DEFAULT 0,
  completion_time REAL NOT NULL DEFAULT 0,
  processing_speed REAL NOT NULL DEFAULT 0,
  played_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Optional per-session detail metrics for advanced analysis per game.
CREATE TABLE IF NOT EXISTS cognitive_session_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  metric_key TEXT NOT NULL,
  metric_value REAL NOT NULL,
  FOREIGN KEY (session_id) REFERENCES cognitive_sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, metric_key)
);

-- Clinical notes version history (latest note is also denormalized on clients.notes).
CREATE TABLE IF NOT EXISTS client_notes_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  authored_at TEXT NOT NULL,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Generic event log for key application actions.
CREATE TABLE IF NOT EXISTS client_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'client_created',
      'client_updated',
      'pain_updated',
      'measurements_updated',
      'notes_saved',
      'cognitive_session_completed'
    )
  ),
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type_age_group ON clients(type, age_group);
CREATE INDEX IF NOT EXISTS idx_clients_last_updated ON clients(last_updated);

CREATE INDEX IF NOT EXISTS idx_pain_history_client_recorded_at
  ON pain_history(client_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_client_played_at
  ON cognitive_sessions(client_id, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_notes_history_client_authored_at
  ON client_notes_history(client_id, authored_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_events_client_created_at
  ON client_events(client_id, created_at DESC);

-- Keep updated_at fresh on row update.
CREATE TRIGGER IF NOT EXISTS trg_clients_updated_at
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
  UPDATE clients
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;
