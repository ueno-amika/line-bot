import { NextRequest, NextResponse } from 'next/server';
import { menuService } from '@/lib/menus/service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.name || !Number.isInteger(body.price) || body.price < 0) {
      return NextResponse.json(
        { error: 'メニュー名と料金（0円以上の整数）は必須です' },
        { status: 400 }
      );
    }

    const menu = await menuService.updateMenu(id, {
      name: body.name,
      price: body.price,
      description: body.description,
      is_active: body.is_active,
    });

    return NextResponse.json({ menu });
  } catch (error) {
    console.error('Failed to update menu:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'メニューの更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await menuService.deleteMenu(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete menu:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'メニューの削除に失敗しました' }, { status: 500 });
  }
}
