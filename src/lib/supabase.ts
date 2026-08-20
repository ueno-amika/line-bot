import { createClient } from '@supabase/supabase-js';

// Supabase クライアント（サーバー側）
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export type Database = {
  public: {
    Tables: {
      faq: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['faq']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      menus: {
        Row: {
          id: string;
          label: string;
          action_type: string;
          action_value: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menus']['Row'], 'id' | 'created_at' | 'updated_at'>;
      };
      conversations: {
        Row: {
          id: string;
          line_user_id: string;
          message_text: string;
          message_type: string;
          response_text: string | null;
          response_type: string;
          matched_faq_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>;
      };
    };
  };
};
