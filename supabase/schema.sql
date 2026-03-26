-- ============================================================
-- Visual QA DS — Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla de reportes
CREATE TABLE IF NOT EXISTS reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de respuestas del cuestionario
CREATE TABLE IF NOT EXISTS report_responses (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id     UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  item_id       TEXT NOT NULL,
  resultado     TEXT CHECK (resultado IN ('aprobado', 'no_aprobado', 'na')) NOT NULL,
  observaciones TEXT DEFAULT '',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, item_id)
);

-- ============================================================
-- Row Level Security — cada usuario ve SOLO sus datos
-- ============================================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_responses ENABLE ROW LEVEL SECURITY;

-- Reports: solo el dueño
CREATE POLICY "reports: select own" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports: insert own" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports: update own" ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reports: delete own" ON reports
  FOR DELETE USING (auth.uid() = user_id);

-- Responses: solo a través de reports propios
CREATE POLICY "responses: select own" ON report_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_responses.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "responses: insert own" ON report_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_responses.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "responses: update own" ON report_responses
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_responses.report_id AND reports.user_id = auth.uid())
  );

CREATE POLICY "responses: delete own" ON report_responses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_responses.report_id AND reports.user_id = auth.uid())
  );
