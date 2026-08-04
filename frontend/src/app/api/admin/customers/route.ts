import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type CreateBody = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const message = (e as Error).message;
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ message }, { status });
  }

  const body = (await request.json().catch(() => ({}))) as CreateBody;
  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';
  const fullName = body.fullName?.trim() || null;
  const role = body.role === 'admin' ? 'admin' : 'customer';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ message: 'Valid email is required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { message: 'Password must be at least 6 characters' },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? '' },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { message: createError?.message ?? 'Failed to create user' },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        email,
      })
      .eq('id', created.user.id)
      .select('id, email, full_name, role, avatar_url, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 500 },
    );
  }
}
