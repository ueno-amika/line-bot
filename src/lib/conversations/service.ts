import { supabase } from '@/lib/supabase';

export interface Conversation {
  id: string;
  line_user_id: string;
  message: string;
  response: string | null;
  confidence_level: string | null;
  confidence_score: number | null;
  escalated: boolean;
  created_at: string;
}

/**
 * 会話ログサービス
 * Bot とユーザーのやり取りを記録・取得する
 */
export class ConversationService {
  private supabase = supabase;

  /**
   * 会話を1件記録する
   */
  async log(entry: {
    lineUserId: string;
    message: string;
    response?: string;
    confidenceLevel?: string;
    confidenceScore?: number;
    escalated?: boolean;
  }): Promise<void> {
    const { error } = await this.supabase.from('conversations').insert({
      line_user_id: entry.lineUserId,
      message: entry.message,
      response: entry.response ?? null,
      confidence_level: entry.confidenceLevel ?? null,
      confidence_score: entry.confidenceScore ?? null,
      escalated: entry.escalated ?? false,
    });

    if (error) {
      // 会話ログの保存失敗は Bot の返信自体を止める理由にはしない
      console.error('Failed to log conversation:', error.message, error.details, error.hint);
    }
  }

  /**
   * 最新の会話ログを取得する（新しい順）
   */
  async getRecent(limit = 50): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch conversations:', error.message, error.details, error.hint);
      throw error;
    }

    return data || [];
  }
}

export const conversationService = new ConversationService();
