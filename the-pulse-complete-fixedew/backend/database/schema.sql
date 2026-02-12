-- =============================================
-- 1. TEAM MOOD TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS team_mood (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ UUID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,    -- ⚠️ เช็คว่า users เป็น Int หรือ UUID
  sentiment_score INTEGER NOT NULL CHECK (sentiment_score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- (Index เหมือนเดิม)

-- =============================================
-- 2. INFRASTRUCTURE HEALTH MONITORING
-- =============================================
CREATE TABLE IF NOT EXISTS infrastructure_health (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  component_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'operational',
  last_check TIMESTAMP DEFAULT NOW(),
  uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_project_component UNIQUE (project_id, component_name)
);

CREATE TABLE IF NOT EXISTS infrastructure_health_log (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  component_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. RISK SENTINEL & ALERTS
-- =============================================
CREATE TABLE IF NOT EXISTS risk_alerts (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  risk_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  detected_at TIMESTAMP DEFAULT NOW(),
  detected_by INTEGER REFERENCES users(id), -- ⚠️ user เป็น Int
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id), -- ⚠️ user เป็น Int
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. PROJECT CYCLES / SPRINTS
-- =============================================
CREATE TABLE IF NOT EXISTS project_cycles (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  cycle_number INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_project_cycle UNIQUE (project_id, cycle_number)
);

-- (ข้อ 5 ALTER TABLE รันได้เลย ไม่มีปัญหา)

-- =============================================
-- 6. DECISION HUB
-- =============================================
CREATE TABLE IF NOT EXISTS project_decisions (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  title VARCHAR(255) NOT NULL,
  description TEXT,
  decision_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  proposed_by INTEGER REFERENCES users(id),
  decided_by INTEGER REFERENCES users(id),
  decided_at TIMESTAMP,
  impact_level VARCHAR(20),
  rationale TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decision_votes (
  id SERIAL PRIMARY KEY,
  decision_id INTEGER NOT NULL REFERENCES project_decisions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote VARCHAR(20) NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_decision_vote UNIQUE (decision_id, user_id)
);

-- =============================================
-- 7. PAYROLL TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  hours_worked DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 8. PROJECT CHAT MESSAGES
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  metadata JSONB,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 9. NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- ✅ แก้เป็น UUID
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  link VARCHAR(500),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);