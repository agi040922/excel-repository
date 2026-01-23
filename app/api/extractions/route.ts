import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: extraction 레코드 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template_id, image_urls, status = 'pending' } = body;

    const { data, error } = await supabase
      .from('extractions')
      .insert({
        user_id: user.id,
        template_id: template_id || null,
        image_urls: image_urls || [],
        status,
        credits_used: 0,
        result_data: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create extraction:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Extraction API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: 사용자의 extraction 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('extractions')
      .select('*, templates(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Extraction API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
