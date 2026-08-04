import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

type UpdateBody = {
  email?: string;
  password?: string;
  fullName?: string | null;
  role?: string;
};

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
  const body = (await request.json().catch(() => ({}))) as UpdateBody;

  if (id === adminUser.id && body.role === 'customer') {
    return NextResponse.json(
      { message: 'You cannot demote your own account' },
      { status: 400 },
    );
  }

  const profilePatch: {
    full_name?: string | null;
    role?: 'customer' | 'admin';
    email?: string;
  } = {};

  if (body.fullName !== undefined) {
    profilePatch.full_name =
      typeof body.fullName === 'string' ? body.fullName.trim() || null : null;
  }
  if (body.role === 'customer' || body.role === 'admin') {
    profilePatch.role = body.role;
  }

  const authPatch: { email?: string; password?: string; user_metadata?: object } =
    {};
  if (typeof body.email === 'string' && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (!email.includes('@')) {
      return NextResponse.json({ message: 'Valid email is required' }, { status: 400 });
    }
    authPatch.email = email;
    profilePatch.email = email;
  }
  if (typeof body.password === 'string' && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }
    authPatch.password = body.password;
  }
  if (body.fullName !== undefined) {
    authPatch.user_metadata = {
      full_name: profilePatch.full_name ?? '',
    };
  }

  if (
    Object.keys(profilePatch).length === 0 &&
    !authPatch.email &&
    !authPatch.password
  ) {
    return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
  }

  try {
    if (authPatch.email || authPatch.password || authPatch.user_metadata) {
      const admin = getSupabaseAdmin();
      const { error: authError } = await admin.auth.admin.updateUserById(id, authPatch);
      if (authError) {
        return NextResponse.json({ message: authError.message }, { status: 400 });
      }
    }

    if (Object.keys(profilePatch).length > 0) {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .update(profilePatch)
        .eq('id', id)
        .select('id, email, full_name, role, avatar_url, created_at')
        .single();

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
      return NextResponse.json(data);
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, avatar_url, created_at')
      .eq('id', id)
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

export async function DELETE(
  _request: Request,
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
      { message: 'You cannot delete your own account' },
      { status: 400 },
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 500 },
    );
  }
}
