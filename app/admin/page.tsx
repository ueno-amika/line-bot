import Link from 'next/link';

const menuItems = [
  {
    href: '/admin/faq',
    icon: '💬',
    title: 'FAQ 管理',
    description: '質問と回答を追加・編集・削除',
  },
  {
    href: '/admin/menus',
    icon: '💰',
    title: 'メニュー・料金',
    description: 'メニュー一覧と料金を編集',
  },
  {
    href: '/admin/conversations',
    icon: '📋',
    title: '会話ログ',
    description: 'お客さんとのやり取りを確認',
  },
  {
    href: '/admin/broadcast',
    icon: '📢',
    title: 'お知らせ配信',
    description: '友だち全員にメッセージを一斉送信',
  },
];

export default function AdminHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold">管理画面</h1>
      </header>

      <main className="px-4 py-4">
        <ul className="space-y-3">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 active:bg-gray-50"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
