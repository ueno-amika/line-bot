-- FAQ テーブル
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);
CREATE INDEX IF NOT EXISTS idx_faq_keywords ON faq USING GIN(keywords);

-- RLS (Row Level Security)
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON faq
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert" ON faq
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON faq
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- サンプルデータ
INSERT INTO faq (category, question, answer, keywords) VALUES
  ('営業情報', '営業時間は？', '営業時間は9:00～18:00です。土日祝は休業です。', ARRAY['営業時間', '営業', '時間']),
  ('営業情報', 'いつ営業していますか？', '平日の9:00～18:00に営業しています。', ARRAY['営業', '時間']),
  ('商品', '商品の種類は？', '当店では以下の商品を取り扱っています：A、B、C', ARRAY['商品', '種類']),
  ('配送', '配送料金は？', '配送料金は一律500円です。', ARRAY['配送', '料金', '送料']);
