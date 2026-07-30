import { createServerSupabase } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export type AppRole = 'customer' | 'admin';

export interface AuthProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
}

export async function getSessionUser(): Promise<AuthProfile | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return null;

    return {
      id: profile.id as string,
      email: profile.email as string,
      fullName: (profile.full_name as string | null) ?? null,
      role: profile.role as AppRole,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AuthProfile> {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');
  if (user.role !== 'admin') throw new Error('Admin access required');
  return user;
}

/** Promote ADMIN_BOOTSTRAP_EMAIL to admin (service role). */
export async function maybeBootstrapAdmin(email: string) {
  const bootstrap = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  if (!bootstrap || email.trim().toLowerCase() !== bootstrap) return false;

  try {
    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('email', bootstrap);
    return !error;
  } catch {
    return false;
  }
}
