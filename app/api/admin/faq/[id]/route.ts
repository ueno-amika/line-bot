import { NextRequest, NextResponse } from 'next/server';
import { faqService } from '@/lib/faq/service';

/**
 * PUT /api/admin/faq/[id] - FAQ を更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.category || !body.question || !body.answer) {
      return NextResponse.json(
        { error: 'カテゴリ・質問・回答は必須です' },
        { status: 400 }
      );
    }

    const faq = await faqService.updateFAQ(id, {
      category: body.category,
      question: body.question,
      answer: body.answer,
      keywords: body.keywords,
    });

    return NextResponse.json({ faq });
  } catch (error) {
    console.error('Failed to update FAQ:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'FAQ の更新に失敗しました' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/faq/[id] - FAQ を削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await faqService.deleteFAQ(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete FAQ:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'FAQ の削除に失敗しました' }, { status: 500 });
  }
}
