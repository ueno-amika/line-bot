import { NextRequest, NextResponse } from 'next/server';
import { menuService } from '@/lib/menus/service';

export async function GET() {
  try {
    const menus = await menuService.getAllMenus();
    return NextResponse.json({ menus });
  } catch (error) {
    console.error('Failed to list menus:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'メニューの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !Number.isInteger(body.price) || body.price < 0) {
      return NextResponse.json(
        { error: 'メニュー名と料金（0円以上の整数）は必須です' },
        { status: 400 }
      );
    }

    const menu = await menuService.createMenu({
      name: body.name,
      price: body.price,
      description: body.description,
      display_order: body.display_order,
    });

    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'メニューの追加に失敗しました' }, { status: 500 });
  }
}
