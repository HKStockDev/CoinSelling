import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthUser } from '../common/types';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async me(user: AuthUser) {
    return user;
  }

  async register(email: string, password: string, fullName?: string) {
    const { data, error } = await this.supabase.db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? '' },
    });
    if (error) throw new BadRequestException(error.message);
    return {
      id: data.user?.id,
      email: data.user?.email,
      message: 'Account created. You can sign in now.',
    };
  }

  async updateProfile(userId: string, fullName: string) {
    const { data, error } = await this.supabase.db
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', userId)
      .select('id, email, full_name, role')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
