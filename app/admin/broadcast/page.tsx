'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BroadcastAdminPage() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const send = async () => {
    if (!text.trim()) {
      setError('配信内容を入力してください');
      return;
    }

    const confirmed = confirm(
      `この内容を LINE 友だち全員に送信します。よろしいですか？\n\n${text}`
    );
    if (!confirmed) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, confirm: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '配信に失敗しました');
      }

      setSuccess(true);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '配信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/admin" className="text-blue-600 text-sm">
          ← 戻る
        </Link>
        <h1 className="text-lg font-bold">お知らせ一斉配信</h1>
      </header>

      <main className="px-4 py-4">
        <div className="mb-4 rounded-lg bg-amber-50 text-amber-800 text-sm px-4 py-3">
          ここで送信すると、LINE 友だち全員に届きます。取り消しはできません。
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 text-sm px-4 py-3">
            配信しました！
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="block text-sm text-gray-600 mb-1">配信内容</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：明日は臨時休業いたします"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{text.length} / 5000文字</p>

          <button
            onClick={send}
            disabled={sending}
            className="w-full mt-3 rounded-lg bg-blue-600 text-white py-3 font-medium disabled:opacity-50"
          >
            {sending ? '送信中...' : '全員に送信する'}
          </button>
        </div>
      </main>
    </div>
  );
}
