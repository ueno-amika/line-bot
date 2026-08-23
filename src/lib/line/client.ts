import crypto from 'crypto';
import { ReplyMessageRequest, Message } from './types';

/**
 * LINE Messaging API クライアント
 * 公式 SDK の代わりにシンプルなラッパーを使用
 */
export class LineClient {
  private channelAccessToken: string;
  private channelSecret: string;
  private baseUrl = 'https://api.line.me/v2';

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

    const hashBuffer = Buffer.from(hash);
    const signatureBuffer = Buffer.from(signature);

    // 長さが違うと timingSafeEqual が例外を投げるため、先に弾く
    // （長さの違い自体は攻撃者に有用な情報を与えないため問題ない）
    if (hashBuffer.length !== signatureBuffer.length) {
      return false;
    }

    // タイミング攻撃対策として、文字列の早期不一致で処理時間が変わらない比較を使う
    return crypto.timingSafeEqual(hashBuffer, signatureBuffer);
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
   * 友だち全員に一斉配信（Broadcast API）
   * LINE 公式アカウントを友だち追加している全員にメッセージを送る
   */
  async broadcastMessage(messages: Message[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bot/message/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.channelAccessToken}`,
      },
      body: JSON.stringify({ messages }),
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
