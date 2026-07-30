import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../common/decorators';
import { AuthUser, UserRole } from '../common/types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      if (isPublic) return true;
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = header.slice(7);
    const { data, error } = await this.supabase.db.auth.getUser(token);
    if (error || !data.user) {
      if (isPublic) return true;
      throw new UnauthorizedException('Invalid token');
    }

    const { data: profile, error: profileError } = await this.supabase.db
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      if (isPublic) return true;
      throw new UnauthorizedException('Profile not found');
    }

    const user: AuthUser = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      fullName: profile.full_name,
    };
    request.user = user;

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
