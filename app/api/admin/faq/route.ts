import { NextRequest, NextResponse } from 'next/server';
import { faqService } from '@/lib/faq/service';

/**
 * GET /api/admin/faq - FAQ 一覧を取得
 */
export async function GET() {
  try {
    const faqs = await faqService.getAllFAQs();
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Failed to list FAQs:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'FAQ の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * POST /api/admin/faq - FAQ を新規追加
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.category || !body.question || !body.answer) {
      return NextResponse.json(
        { error: 'カテゴリ・質問・回答は必須です' },
        { status: 400 }
      );
    }

    const faq = await faqService.createFAQ({
      category: body.category,
      question: body.question,
      answer: body.answer,
      keywords: body.keywords,
    });

    return NextResponse.json({ faq }, { status: 201 });
  } catch (error) {
    console.error('Failed to create FAQ:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'FAQ の追加に失敗しました' }, { status: 500 });
  }
}
