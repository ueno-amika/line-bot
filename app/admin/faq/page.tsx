'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

const emptyForm = { category: '', question: '', answer: '' };

// フォームが「閉じている」「新規追加中」「編集中（どのFAQか）」のどれかを1つの状態で表す。
// editingId と showNewForm を別々の真偽値で管理すると、更新箇所が増えるたびに
// 両者を同期させ忘れるリスクがあるため、ここでは常にどちらか一方だけが真になるようまとめている。
type FormMode = { type: 'closed' } | { type: 'new' } | { type: 'edit'; id: string };

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadFAQs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faq');
      const data = await res.json();
      setFaqs(data.faqs || []);
    } catch {
      setError('FAQ の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  const startEdit = (faq: FAQ) => {
    setFormMode({ type: 'edit', id: faq.id });
    setForm({ category: faq.category, question: faq.question, answer: faq.answer });
  };

  const startNew = () => {
    setFormMode({ type: 'new' });
    setForm(emptyForm);
  };

  const cancelForm = () => {
    setFormMode({ type: 'closed' });
    setForm(emptyForm);
    setError('');
  };

  const submitForm = async () => {
    if (!form.category || !form.question || !form.answer) {
      setError('すべての項目を入力してください');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url =
        formMode.type === 'edit' ? `/api/admin/faq/${formMode.id}` : '/api/admin/faq';
      const method = formMode.type === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      cancelForm();
      await loadFAQs();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('この FAQ を削除しますか？')) return;

    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      await loadFAQs();
    } catch {
      setError('削除に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/admin" className="text-blue-600 text-sm">
          ← 戻る
        </Link>
        <h1 className="text-lg font-bold">FAQ 管理</h1>
      </header>

      <main className="px-4 py-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {formMode.type !== 'closed' && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-bold mb-3">
              {formMode.type === 'edit' ? 'FAQ を編集' : '新しい FAQ を追加'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">カテゴリ</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="例：営業情報"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">質問</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  placeholder="例：営業時間は？"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">回答</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  rows={3}
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  placeholder="例：9:00〜18:00です"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={submitForm}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-blue-600 text-white py-2.5 font-medium disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存する'}
                </button>
                <button
                  onClick={cancelForm}
                  className="rounded-lg bg-white border border-gray-300 text-gray-700 px-4 py-2.5"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">読み込み中...</p>
        ) : faqs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだ FAQ がありません</p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((faq) => (
              <li key={faq.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 mb-2">
                  {faq.category}
                </span>
                <p className="font-medium">{faq.question}</p>
                <p className="text-gray-600 text-sm mt-1 whitespace-pre-wrap">{faq.answer}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEdit(faq)}
                    className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteFAQ(faq.id)}
                    className="text-sm text-red-600 border border-red-200 rounded-lg px-3 py-1.5"
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {formMode.type === 'closed' && (
        <button
          onClick={startNew}
          className="fixed bottom-6 right-6 rounded-full bg-blue-600 text-white w-14 h-14 text-2xl shadow-lg flex items-center justify-center"
          aria-label="FAQ を追加"
        >
          +
        </button>
      )}
    </div>
  );
}
