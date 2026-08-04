import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let adminUser;
  try {
    adminUser = await requireAdmin();
  } catch (e) {
    const message = (e as Error).message;
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ message }, { status });
  }

  const { id } = await context.params;
  if (id === adminUser.id) {
    return NextResponse.json(
      { message: 'You cannot change your own role' },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (body.role !== 'customer' && body.role !== 'admin') {
    return NextResponse.json(
      { message: 'role must be customer or admin' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
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
