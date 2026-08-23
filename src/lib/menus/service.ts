import { supabase } from '@/lib/supabase';

export interface Menu {
  id: string;
  name: string;
  price: number;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

/**
 * メニュー・料金サービス
 */
export class MenuService {
  private supabase = supabase;

  async getAllMenus(): Promise<Menu[]> {
    const { data, error } = await this.supabase
      .from('menus')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch menus:', error.message, error.details, error.hint);
      throw error;
    }

    return data || [];
  }

  async createMenu(input: {
    name: string;
    price: number;
    description?: string;
    display_order?: number;
  }): Promise<Menu> {
    const { data, error } = await this.supabase
      .from('menus')
      .insert({
        name: input.name,
        price: input.price,
        description: input.description ?? null,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create menu:', error.message, error.details, error.hint);
      throw error;
    }

    return data;
  }

  async updateMenu(
    id: string,
    input: { name: string; price: number; description?: string; is_active?: boolean }
  ): Promise<Menu> {
    const { data, error } = await this.supabase
      .from('menus')
      .update({
        name: input.name,
        price: input.price,
        description: input.description ?? null,
        is_active: input.is_active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update menu:', error.message, error.details, error.hint);
      throw error;
    }

    return data;
  }

  async deleteMenu(id: string): Promise<void> {
    const { error } = await this.supabase.from('menus').delete().eq('id', id);

    if (error) {
      console.error('Failed to delete menu:', error.message, error.details, error.hint);
      throw error;
    }
  }
}

export const menuService = new MenuService();
