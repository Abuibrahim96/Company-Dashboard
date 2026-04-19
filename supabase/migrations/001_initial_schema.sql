-- ============================================================
-- Elite Truck Lines – Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- 1. Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Helper: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. Tables
-- ============================================================

-- applications – public form submissions
CREATE TABLE applications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  cdl_class       TEXT,
  truck_year      TEXT,
  truck_make      TEXT,
  truck_model     TEXT,
  num_trucks      INTEGER,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewed', 'onboarded', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- operators – owner-operators
CREATE TABLE operators (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  cdl_class       TEXT,
  cdl_number      TEXT,
  commission_rate DECIMAL(4,2) NOT NULL DEFAULT 0.12
                    CHECK (commission_rate >= 0.05 AND commission_rate <= 0.30),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'inactive')),
  onboarded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trucks – vehicles
CREATE TABLE trucks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id     UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  year            TEXT,
  make            TEXT,
  model           TEXT,
  vin             TEXT UNIQUE,
  license_plate   TEXT,
  license_state   TEXT,
  color           TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'out_of_service', 'maintenance')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- documents – compliance docs
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id     UUID REFERENCES operators(id) ON DELETE CASCADE,
  truck_id        UUID REFERENCES trucks(id) ON DELETE CASCADE,
  type            TEXT NOT NULL
                    CHECK (type IN (
                      'cdl', 'medical_card', 'insurance', 'registration',
                      'drug_test', 'annual_inspection', 'w9', 'operating_authority'
                    )),
  document_number TEXT,
  issued_date     DATE,
  expiration_date DATE,
  status          TEXT NOT NULL DEFAULT 'valid'
                    CHECK (status IN ('valid', 'expiring_soon', 'expired')),
  file_url        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT documents_owner_check
    CHECK (operator_id IS NOT NULL OR truck_id IS NOT NULL)
);

-- clients – shippers / brokers
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name    TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'shipper'
                    CHECK (type IN ('shipper', 'broker')),
  contact_name    TEXT,
  phone           TEXT,
  email           TEXT,
  mc_number       TEXT,
  dot_number      TEXT,
  payment_terms   TEXT
                    CHECK (payment_terms IN (
                      'net_30', 'net_15', 'net_7', 'quick_pay', 'factoring', 'other'
                    )),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- loads – jobs
CREATE TABLE loads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_number     TEXT UNIQUE NOT NULL,
  operator_id     UUID REFERENCES operators(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  origin_city     TEXT,
  origin_state    TEXT,
  destination_city  TEXT,
  destination_state TEXT,
  pickup_date     DATE,
  delivery_date   DATE,
  rate            DECIMAL(10,2),
  miles           INTEGER,
  commission_rate DECIMAL(4,2),
  elite_cut       DECIMAL(10,2),
  operator_pay    DECIMAL(10,2),
  status          TEXT NOT NULL DEFAULT 'booked'
                    CHECK (status IN (
                      'booked', 'in_transit', 'delivered', 'invoiced', 'paid'
                    )),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- chat_messages – AI chat history
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX idx_operators_status        ON operators(status);
CREATE INDEX idx_trucks_operator_id      ON trucks(operator_id);
CREATE INDEX idx_trucks_status           ON trucks(status);
CREATE INDEX idx_documents_operator_id   ON documents(operator_id);
CREATE INDEX idx_documents_truck_id      ON documents(truck_id);
CREATE INDEX idx_documents_expiration    ON documents(expiration_date);
CREATE INDEX idx_documents_status        ON documents(status);
CREATE INDEX idx_loads_operator_id       ON loads(operator_id);
CREATE INDEX idx_loads_client_id         ON loads(client_id);
CREATE INDEX idx_loads_status            ON loads(status);
CREATE INDEX idx_chat_messages_user_id   ON chat_messages(user_id);

-- ============================================================
-- 4. Auto-update triggers for updated_at
-- ============================================================
CREATE TRIGGER trg_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_trucks_updated_at
  BEFORE UPDATE ON trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_loads_updated_at
  BEFORE UPDATE ON loads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. Row-Level Security
-- ============================================================

-- applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_applications" ON applications
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "auth_select_applications" ON applications
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_update_applications" ON applications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- operators
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_operators" ON operators
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- trucks
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_trucks" ON trucks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_documents" ON documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_clients" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- loads
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_loads" ON loads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_all_chat_messages" ON chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE operators;
ALTER PUBLICATION supabase_realtime ADD TABLE trucks;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE loads;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
