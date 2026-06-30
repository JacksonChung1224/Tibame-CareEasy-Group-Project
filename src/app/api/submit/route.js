import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req) {
  try {
    const data = await req.json();

    const { error } = await supabaseAdmin.from('assessment_records').insert([
      {
        has_applied_cms: data.has_applied_cms,
        calculated_cms_level: data.calculated_cms_level,
        actual_cms_level: data.actual_cms_level,
        answers: data.answers,
        is_dementia_path: data.is_dementia_path,
        created_at: data.created_at
      }
    ]);

    if (error) {
      console.error('Supabase Admin Insert Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
