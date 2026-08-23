import { NextResponse } from 'next/server';
import { conversationService } from '@/lib/conversations/service';

export async function GET() {
  try {
    const conversations = await conversationService.getRecent(100);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Failed to list conversations:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: '会話ログの取得に失敗しました' }, { status: 500 });
  }
}
