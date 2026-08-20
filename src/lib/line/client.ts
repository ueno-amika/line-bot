import crypto from 'crypto';
import { ReplyMessageRequest, Message } from './types';

/**
 * LINE Messaging API クライアント
 * 公式 SDK の代わりにシンプルなラッパーを使用
 */
export class LineClient {
  private channelAccessToken: string;
  private channelSecret: string;
  private baseUrl = 'https://api.line.biz/v2';

  constructor(channelAccessToken: string, channelSecret: string) {
    this.channelAccessToken = channelAccessToken;
    this.channelSecret = channelSecret;
  }

  /**
   * Webhook 署名を検証
   * LINE から送られてきたリクエストが本物か確認
   */
  validateSignature(body: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.channelSecret)
      .update(body)
      .digest('base64');
    return hash === signature;
  }

  /**
   * メッセージをリプライ（返信）
   */
  async replyMessage(replyToken: string, messages: Message[]): Promise<void> {
    const payload: ReplyMessageRequest = {
      replyToken,
      messages,
    };

    const response = await fetch(`${this.baseUrl}/bot/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * プッシュメッセージ（一方的に送信）
   */
  async pushMessage(userId: string, messages: Message[]): Promise<void> {
    const payload = {
      to: userId,
      messages,
    };

    const response = await fetch(`${this.baseUrl}/bot/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`);
    }
  }

  /**
   * ユーザープロフィール取得
   */
  async getUserProfile(userId: string) {
    const response = await fetch(`${this.baseUrl}/bot/profile/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LINE API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }
}

// グローバルインスタンス
export const lineClient = new LineClient(
  process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  process.env.LINE_CHANNEL_SECRET!
);
