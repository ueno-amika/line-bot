-- 管理画面に認証機能がまだ無いため、一時的に匿名キーでの書き込みを許可する
-- TODO: 管理画面にログイン機能を追加したら、このポリシーを authenticated 限定に戻す

DROP POLICY IF EXISTS "Allow authenticated insert" ON faq;
DROP POLICY IF EXISTS "Allow authenticated update" ON faq;

CREATE POLICY "Allow anonymous insert faq" ON faq
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update faq" ON faq
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous delete faq" ON faq
  FOR DELETE
  USING (true);
