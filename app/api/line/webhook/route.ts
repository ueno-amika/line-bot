import { NextRequest, NextResponse } from 'next/server';
import { lineClient } from '@/lib/line/client';
import { claudeClient } from '@/lib/claude/client';
import { faqService } from '@/lib/faq/service';
import { conversationService } from '@/lib/conversations/service';
import { WebhookEvent, TextMessage } from '@/lib/line/types';

/**
 * LINE Webhook エンドポイント
 * POST /api/line/webhook
 *
 * LINE Bot が受け取ったメッセージを Claude API で処理
 * 確信度が低い場合、オーナーに通知
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
    // 1件のイベント処理が失敗しても、同じ Webhook 内の他のイベントの
    // 処理・返信が止まらないようにする
    for (const event of events) {
      try {
        await handleEvent(event);
      } catch (eventError) {
        console.error(
          'Failed to process one event in the batch:',
          eventError instanceof Error ? eventError.message : eventError
        );
      }
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
 * Claude API で質問に回答し、確信度に基づいてオーナーに通知
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
  const userQuestion = textMessage.text;
  const lineUserId = event.source.userId ?? 'unknown';

  try {
    console.log(`Received question from user: ${userQuestion}`);

    // FAQ 件数が少ないため、全件を Claude に渡して判断させる
    // （キーワード検索は日本語のスペース無し文章だと精度が低いため）
    const relatedFaqs = await faqService.getAllFAQs();

    // Claude に質問して回答を生成
    const aiResponse = await claudeClient.generateAnswer(
      userQuestion,
      relatedFaqs.map(f => ({ question: f.question, answer: f.answer }))
    );

    // ユーザーに回答を返信
    await lineClient.replyMessage(event.replyToken, [
      {
        type: 'text',
        text: aiResponse.answer,
      },
    ]);

    console.log(`Answer sent to user (confidence: ${aiResponse.confidence_level})`);

    // 会話ログを記録（管理画面で確認できるように）
    // ユーザーへの返信は既に送信済みなので、ログ保存の完了は待たない
    conversationService.log({
      lineUserId,
      message: userQuestion,
      response: aiResponse.answer,
      confidenceLevel: aiResponse.confidence_level,
      confidenceScore: aiResponse.confidence_score,
      escalated: aiResponse.should_escalate,
    });

    // 確信度が低い場合、オーナーに通知
    if (aiResponse.should_escalate) {
      await notifyOwner({
        userQuestion,
        botAnswer: aiResponse.answer,
        confidenceLevel: aiResponse.confidence_level,
        confidenceScore: aiResponse.confidence_score,
      });
    }
  } catch (error) {
    console.error('Failed to handle message:', error instanceof Error ? error.message : error);

    // エラー時はユーザーに通知（この返信自体が失敗しても＝replyToken 期限切れ等でも、
    // 呼び出し元のループが他のイベント処理を続けられるよう、ここで握りつぶす）
    try {
      await lineClient.replyMessage(event.replyToken, [
        {
          type: 'text',
          text: '申し訳ありません。問い合わせの処理中にエラーが発生しました。',
        },
      ]);
    } catch (replyError) {
      console.error(
        'Failed to send error notice to user:',
        replyError instanceof Error ? replyError.message : replyError
      );
    }

    // エラーが起きたことも会話ログに残す
    conversationService.log({
      lineUserId,
      message: userQuestion,
      response: '（エラーのため回答できませんでした）',
    });
  }
}

/**
 * オーナーに通知（確信度が低い場合）
 */
async function notifyOwner(data: {
  userQuestion: string;
  botAnswer: string;
  confidenceLevel: string;
  confidenceScore: number;
}): Promise<void> {
  const ownerUserId = process.env.LINE_OWNER_USER_ID;

  if (!ownerUserId) {
    console.warn('LINE_OWNER_USER_ID not configured');
    return;
  }

  try {
    const message = `
【エスカレーション通知】

質問: ${data.userQuestion}

Bot の回答: ${data.botAnswer}

確信度: ${data.confidenceLevel} (${(data.confidenceScore * 100).toFixed(1)}%)

人間による確認が必要です。
    `.trim();

    await lineClient.pushMessage(ownerUserId, [
      {
        type: 'text',
        text: message,
      },
    ]);

    console.log('Owner notified about low confidence response');
  } catch (error) {
    console.error('Failed to notify owner:', error);
  }
}
