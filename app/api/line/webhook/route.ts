import { NextRequest, NextResponse } from 'next/server';
import { lineClient } from '@/lib/line/client';
import { WebhookEvent, TextMessage } from '@/lib/line/types';

/**
 * LINE Webhook エンドポイント
 * POST /api/line/webhook
 *
 * LINE Bot が受け取ったメッセージをここで処理します。
 * 最小実装では、受け取ったテキストをそのまま返します（Echo）。
 */
export async function POST(request: NextRequest) {
  try {
    // リクエスト本体を取得
    const body = await request.text();

    // LINE からのリクエストヘッダーを取得
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      console.warn('Missing X-Line-Signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 署名を検証（LINE からの正規リクエストか確認）
    const isValid = lineClient.validateSignature(body, signature);
    if (!isValid) {
      console.warn('Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // JSON パース
    const events: WebhookEvent[] = JSON.parse(body).events || [];

    // イベントごとに処理
    for (const event of events) {
      await handleEvent(event);
    }

    // LINE には 200 OK をすぐ返す（3秒以内）
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * イベントハンドラー
 */
async function handleEvent(event: WebhookEvent): Promise<void> {
  // メッセージイベントのみ処理
  if (event.type !== 'message') {
    return;
  }

  // テキストメッセージのみ処理
  if (event.message.type !== 'text') {
    return;
  }

  const textMessage = event.message as TextMessage;

  try {
    // Echo: 受け取ったメッセージをそのまま返す
    await lineClient.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: textMessage.text,
      },
    ]);

    console.log(`Echo sent to user: ${textMessage.text}`);
  } catch (error) {
    console.error('Failed to reply message:', error);
  }
}
