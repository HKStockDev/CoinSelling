import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PlatformType, Product } from '../common/types';

@Injectable()
export class ProductsService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(platform?: PlatformType) {
    let query = this.supabase.db
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (platform) query = query.eq('platform', platform);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Product[];
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.db
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Product not found');
    return data as Product;
  }

  async getBySlug(slug: string) {
    const { data, error } = await this.supabase.db
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Product not found');
    return data as Product;
  }
}
