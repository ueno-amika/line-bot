-- Initialize LINE Bot Database Tables

-- FAQ テーブル
CREATE TABLE IF NOT EXISTS faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- メニュー（リッチメニュー選択肢など）
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'faq', 'url', 'postback' など
  action_value TEXT, -- FAQ ID、URL、カスタム値など
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 会話ログ
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video' など
  response_text TEXT,
  response_type VARCHAR(50) DEFAULT 'text',
  matched_faq_id UUID REFERENCES faq(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_conversations_line_user_id ON conversations(line_user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faq_category ON faq(category);

-- Row Level Security (RLS) を有効化（必要に応じて）
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー：管理画面以外は読み取り専用
CREATE POLICY "FAQ is readable by all" ON faq FOR SELECT USING (true);
CREATE POLICY "Menus are readable by all" ON menus FOR SELECT USING (true);
CREATE POLICY "Conversations are insertable" ON conversations FOR INSERT WITH CHECK (true);
