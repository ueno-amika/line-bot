import { supabase } from '@/lib/supabase';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

/**
 * FAQ サービス
 * Supabase から FAQ データを取得・検索
 */
export class FAQService {
  private supabase = supabase;

  /**
   * 全ての FAQ を取得
   */
  async getAllFAQs(): Promise<FAQ[]> {
    const { data, error } = await this.supabase
      .from('faq')
      .select('id, category, question, answer, keywords');

    if (error) {
      console.error('Failed to fetch FAQs:', error.message, error.details, error.hint);
      throw error;
    }

    return data || [];
  }

  /**
   * FAQ を1件追加
   */
  async createFAQ(input: {
    category: string;
    question: string;
    answer: string;
    keywords?: string[];
  }): Promise<FAQ> {
    const { data, error } = await this.supabase
      .from('faq')
      .insert({
        category: input.category,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords ?? [],
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create FAQ:', error.message, error.details, error.hint);
      throw error;
    }

    return data;
  }

  /**
   * FAQ を1件更新
   */
  async updateFAQ(
    id: string,
    input: { category: string; question: string; answer: string; keywords?: string[] }
  ): Promise<FAQ> {
    const { data, error } = await this.supabase
      .from('faq')
      .update({
        category: input.category,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update FAQ:', error.message, error.details, error.hint);
      throw error;
    }

    return data;
  }

  /**
   * FAQ を1件削除
   */
  async deleteFAQ(id: string): Promise<void> {
    const { error } = await this.supabase.from('faq').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete FAQ:', error.message, error.details, error.hint);
      throw error;
    }
  }

  /**
   * カテゴリ別に FAQ を取得
   */
  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    const { data, error } = await this.supabase
      .from('faq')
      .select('id, category, question, answer, keywords')
      .eq('category', category);

    if (error) {
      console.error('Failed to fetch FAQs by category:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * キーワードで FAQ を検索
   * ユーザーの質問に関連する FAQ を見つける
   */
  async searchFAQsByKeywords(keywords: string[]): Promise<FAQ[]> {
    // キーワードに `,` `{` `}` `)` などが含まれると .or() のフィルタ構文を
    // 壊す（意図しない条件を注入できてしまう）ため、安全な文字だけに絞り込む
    const safeKeywords = keywords
      .map((keyword) => keyword.replace(/[^\p{L}\p{N}ー]/gu, ''))
      .filter((keyword) => keyword.length > 0);

    if (safeKeywords.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('faq')
      .select('id, category, question, answer, keywords')
      .or(
        safeKeywords
          .map((keyword) => `keywords.cs.{${keyword}}`)
          .join(',')
      );

    if (error) {
      console.error('Failed to search FAQs:', error);
      return [];
    }

    return data || [];
  }

  /**
   * ユーザーの質問文から関連する FAQ を取得
   * 簡易的なキーワード抽出と検索
   */
  async findRelevantFAQs(userQuestion: string): Promise<FAQ[]> {
    // 簡易的なキーワード抽出（日本語対応）
    const keywords = this.extractKeywords(userQuestion);

    if (keywords.length === 0) {
      // キーワード抽出に失敗した場合は全 FAQ を返す
      return this.getAllFAQs();
    }

    // キーワードで検索
    const results = await this.searchFAQsByKeywords(keywords);

    return results;
  }

  /**
   * 質問文からキーワードを抽出
   */
  private extractKeywords(text: string): string[] {
    // 簡易的なキーワード抽出
    // より高度な自然言語処理が必要な場合は、別のライブラリを使用
    const keywords = text
      .split(/\s|、|。|？/)
      .filter(
        (word) =>
          word.length > 1 && !['は', 'が', 'を', 'に', 'の', 'で', 'や'].includes(word)
      )
      .slice(0, 5);

    return keywords;
  }
}

// グローバルインスタンス
export const faqService = new FAQService();
