import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST: 템플릿 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, columns, original_file_url, description } = body;

    if (!name || !columns || columns.length === 0) {
      return NextResponse.json({ error: 'Name and columns are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name,
        columns,
        original_file_url: original_file_url || null,
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Template API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: 사용자의 템플릿 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Template API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
