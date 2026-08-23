import Anthropic from '@anthropic-ai/sdk';

const CONFIDENCE_LEVELS = ['高', '中', '低'] as const;
type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

function isConfidenceLevel(value: unknown): value is ConfidenceLevel {
  return typeof value === 'string' && (CONFIDENCE_LEVELS as readonly string[]).includes(value);
}

/**
 * Claude API クライアント
 */
export class ClaudeClient {
  private client: Anthropic;
  private model = 'claude-sonnet-4-6';

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * FAQ コンテキストを使って回答を生成
   */
  async generateAnswer(
    userQuestion: string,
    faqData: Array<{ question: string; answer: string }>
  ): Promise<{
    answer: string;
    confidence_level: '高' | '中' | '低';
    confidence_score: number;
    should_escalate: boolean;
  }> {
    // FAQ データをテキスト形式に変換
    const faqText = faqData
      .map((item, i) => `${i + 1}. Q: ${item.question}\n   A: ${item.answer}`)
      .join('\n\n');

    // 回答生成と確信度判定を1回の呼び出しにまとめる
    // （LINE は数秒以内の返信を要求するため、Claude への往復は1回に抑える）
    const systemPrompt = `あなたはカスタマーサポートチャットボットです。
ユーザーの質問に対して、提供された FAQ データをもとに回答してください。

FAQ データ：
${faqText}

回答する際は、以下のルールに従ってください：
1. FAQ にある情報は、正確にその内容を回答する
2. FAQ にない情報については、慎重に回答する
3. 不確実な場合は、その旨を伝える

さらに、あなたの回答の確信度を自己判定してください。
【判定基準】
- 高：FAQ に完全にマッチ、複数ソースで確認可能
- 中：部分的に関連、推論や解釈を含む
- 低：FAQ にない、複雑で人間の判断が必要

必ず以下の JSON 形式のみで返してください（説明文やマークダウンのコードブロックは付けない）：
{
  "answer": "ユーザーへの回答本文",
  "confidence_level": "高 | 中 | 低",
  "confidence_score": 0.0〜1.0,
  "should_escalate": true または false
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userQuestion,
          },
        ],
      });

      // Claude が空の content 配列を返すケースに備え、存在チェックしてからアクセスする
      const firstBlock = response.content[0];
      const rawText = firstBlock?.type === 'text' ? firstBlock.text : '{}';

      // Claude がマークダウンのコードブロック（```json ... ```）で返すことがあるため除去
      const jsonText = rawText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      let result: Record<string, unknown>;
      try {
        result = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse Claude JSON response:', jsonText);
        // パース失敗時は回答本文だけでも返す（確信度は「低」扱いでエスカレーション）
        result = { answer: rawText };
      }

      // Claude が想定外の値を返す可能性があるため、使う前に型を確認する
      // （ここで弾かれた値は確信度「低」＝エスカレーション扱いにフォールバックする）
      const confidenceLevel = isConfidenceLevel(result.confidence_level)
        ? result.confidence_level
        : '低';
      const confidenceScore =
        typeof result.confidence_score === 'number' ? result.confidence_score : 0.3;

      return {
        answer: typeof result.answer === 'string' && result.answer ? result.answer : '回答を生成できませんでした。',
        confidence_level: confidenceLevel,
        confidence_score: confidenceScore,
        should_escalate: typeof result.should_escalate === 'boolean' ? result.should_escalate : true,
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }
}

// グローバルインスタンス
export const claudeClient = new ClaudeClient(
  process.env.ANTHROPIC_API_KEY || ''
);
