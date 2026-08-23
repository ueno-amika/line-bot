import { NextRequest, NextResponse } from 'next/server';
import { lineClient } from '@/lib/line/client';

/**
 * POST /api/admin/broadcast
 * 入力されたテキストを LINE 友だち全員に一斉配信する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: '配信内容を入力してください' }, { status: 400 });
    }

    // 300人規模への不可逆な一斉送信のため、確認済みリクエストであることを明示的に要求する
    // （UIのconfirm()はブラウザ側の防止策に過ぎず、APIを直接叩かれた場合の歯止めにはならないため）
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: '配信内容の確認が完了していません' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: '配信内容が長すぎます（5000文字以内）' },
        { status: 400 }
      );
    }

    await lineClient.broadcastMessage([{ type: 'text', text }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to broadcast message:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: '配信に失敗しました' }, { status: 500 });
  }
}
