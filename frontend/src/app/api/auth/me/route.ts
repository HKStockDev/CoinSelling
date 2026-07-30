import { NextResponse } from 'next/server';
import { getSessionUser, maybeBootstrapAdmin } from '@/lib/auth-server';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await maybeBootstrapAdmin(user.email);
  const refreshed = await getSessionUser();

  return NextResponse.json({
    id: refreshed?.id ?? user.id,
    email: refreshed?.email ?? user.email,
    fullName: refreshed?.fullName ?? user.fullName,
    role: refreshed?.role ?? user.role,
  });
}
