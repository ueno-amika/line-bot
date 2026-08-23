'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Conversation {
  id: string;
  line_user_id: string;
  message: string;
  response: string | null;
  confidence_level: string | null;
  escalated: boolean;
  created_at: string;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function confidenceBadgeClass(level: string | null) {
  if (level === '高') return 'bg-green-100 text-green-700';
  if (level === '中') return 'bg-yellow-100 text-yellow-700';
  if (level === '低') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

export default function ConversationsAdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/conversations');
        const data = await res.json();
        setConversations(data.conversations || []);
      } catch {
        setError('会話ログの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/admin" className="text-blue-600 text-sm">
          ← 戻る
        </Link>
        <h1 className="text-lg font-bold">会話ログ</h1>
      </header>

      <main className="px-4 py-4">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">読み込み中...</p>
        ) : conversations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">まだ会話がありません</p>
        ) : (
          <ul className="space-y-3">
            {conversations.map((c) => (
              <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                  <div className="flex gap-1.5">
                    {c.escalated && (
                      <span className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                        要確認
                      </span>
                    )}
                    {c.confidence_level && (
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 ${confidenceBadgeClass(
                          c.confidence_level
                        )}`}
                      >
                        確信度: {c.confidence_level}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-1">質問</p>
                <p className="font-medium mb-3">{c.message}</p>
                <p className="text-sm text-gray-500 mb-1">回答</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {c.response ?? '（回答なし）'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
