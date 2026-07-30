import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch (e) {
    const message = (e as Error).message;
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ message }, { status });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (body.role !== 'customer' && body.role !== 'admin') {
    return NextResponse.json(
      { message: 'role must be customer or admin' },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('profiles')
      .update({ role: body.role })
      .eq('id', id)
      .select('id, email, full_name, role, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 500 },
    );
  }
}
