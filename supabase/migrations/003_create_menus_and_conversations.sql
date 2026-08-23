-- メニュー・料金テーブル
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menus_display_order ON menus(display_order);

ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read menus" ON menus
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert menus" ON menus
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update menus" ON menus
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous delete menus" ON menus
  FOR DELETE
  USING (true);

-- 会話ログテーブル
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT,
  confidence_level VARCHAR(10),
  confidence_score NUMERIC,
  escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_line_user_id ON conversations(line_user_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read conversations" ON conversations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous insert conversations" ON conversations
  FOR INSERT
  WITH CHECK (true);

-- サンプルメニューデータ
INSERT INTO menus (name, price, description, display_order) VALUES
  ('カット', 4000, '通常カット', 1),
  ('カラー', 6000, '全体カラー', 2),
  ('パーマ', 8000, 'デジタルパーマ', 3);
