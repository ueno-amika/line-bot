import { NextRequest, NextResponse } from 'next/server';

/**
 * 管理画面（/admin, /api/admin）を Basic 認証で保護する。
 * 環境変数が未設定の場合は、意図せず全開放にならないよう認証失敗として扱う。
 */
export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    console.error('ADMIN_USERNAME / ADMIN_PASSWORD が設定されていません');
    return new NextResponse('Admin authentication is not configured', { status: 500 });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const decoded = atob(authHeader.slice('Basic '.length));
    const separatorIndex = decoded.indexOf(':');
    const user = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);

    if (user === expectedUser && password === expectedPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
