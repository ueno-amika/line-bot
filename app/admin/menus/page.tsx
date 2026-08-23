'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Menu {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
}

const emptyForm = { name: '', price: '', description: '' };

// フォームが「閉じている」「新規追加中」「編集中（どのメニューか）」のどれかを1つの状態で表す。
type FormMode = { type: 'closed' } | { type: 'new' } | { type: 'edit'; id: string };

export default function MenuAdminPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>({ type: 'closed' });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      setMenus(data.menus || []);
    } catch {
      setError('メニューの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const startEdit = (menu: Menu) => {
    setFormMode({ type: 'edit', id: menu.id });
    setForm({
      name: menu.name,
      price: String(menu.price),
      description: menu.description ?? '',
    });
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
    const price = Number(form.price);

    if (!form.name || !form.price || Number.isNaN(price)) {
      setError('メニュー名と料金（数字）を入力してください');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url =
        formMode.type === 'edit' ? `/api/admin/menus/${formMode.id}` : '/api/admin/menus';
      const method = formMode.type === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, price, description: form.description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存に失敗しました');
      }

      cancelForm();
      await loadMenus();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const deleteMenu = async (id: string) => {
    if (!confirm('このメニューを削除しますか？')) return;

    try {
      const res = await fetch(`/api/admin/menus/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      await loadMenus();
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
        <h1 className="text-lg font-bold">メニュー・料金管理</h1>
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
              {formMode.type === 'edit' ? 'メニューを編集' : '新しいメニューを追加'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">メニュー名</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例：カット"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">料金（円）</label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="例：4000"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">説明（任意）</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="例：シャンプー込み"
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
        ) : menus.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだメニューがありません</p>
        ) : (
          <ul className="space-y-3">
            {menus.map((menu) => (
              <li key={menu.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium">{menu.name}</p>
                  <p className="font-bold text-lg">¥{menu.price.toLocaleString()}</p>
                </div>
                {menu.description && (
                  <p className="text-gray-600 text-sm mt-1">{menu.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => startEdit(menu)}
                    className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteMenu(menu.id)}
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
          aria-label="メニューを追加"
        >
          +
        </button>
      )}
    </div>
  );
}
