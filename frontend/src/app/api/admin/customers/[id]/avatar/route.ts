import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
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

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { message: 'Use a JPG, PNG, WEBP, or GIF image.' },
        { status: 400 },
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Image must be 2MB or smaller.' },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    const path = `${id}/avatar.png`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { data: existing } = await admin.storage.from('avatars').list(id);
    if (existing?.length) {
      await admin.storage
        .from('avatars')
        .remove(existing.map((f) => `${id}/${f.name}`));
    }

    const { error: uploadError } = await admin.storage.from('avatars').upload(path, bytes, {
      upsert: true,
      contentType: 'image/png',
      cacheControl: '3600',
    });
    if (uploadError) {
      return NextResponse.json({ message: uploadError.message }, { status: 400 });
    }

    const { data: pub } = admin.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

    const { data, error } = await admin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', id)
      .select('id, email, full_name, role, avatar_url, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await admin.auth.admin.updateUserById(id, {
      user_metadata: { avatar_url: avatarUrl },
    });

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
  try {
    await requireAdmin();
  } catch (e) {
    const message = (e as Error).message;
    const status = message === 'Unauthorized' ? 401 : 403;
    return NextResponse.json({ message }, { status });
  }

  const { id } = await context.params;

  try {
    const admin = getSupabaseAdmin();
    const { data: files } = await admin.storage.from('avatars').list(id);
    if (files?.length) {
      await admin.storage.from('avatars').remove(files.map((f) => `${id}/${f.name}`));
    }

    const { data, error } = await admin
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', id)
      .select('id, email, full_name, role, avatar_url, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    await admin.auth.admin.updateUserById(id, {
      user_metadata: { avatar_url: null },
    });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 500 },
    );
  }
}
