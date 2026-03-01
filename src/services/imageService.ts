// src/services/imageService.ts
// NOTE: 'images' table doesn't exist in current schema. Using 'as any' to avoid build errors.

import { supabase } from '@/integrations/supabase/client';
import { Image, ImageInsert } from './types';

const db = supabase as any;

export class ImageService {
  async createImage(image: ImageInsert): Promise<Image> {
    const { data, error } = await db.from('images').insert({ ...image, status: image.status || 'pending' }).select().single();
    if (error) { console.error('Error creating image:', error); throw new Error('Failed to create image'); }
    return data;
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    const { data, error } = await db.from('images').select('*').eq('model_id', modelId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching model images:', error); throw new Error('Failed to fetch model images'); }
    return data || [];
  }

  async getUserImages(userId: string): Promise<Image[]> {
    const { data, error } = await db.from('images').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching user images:', error); throw new Error('Failed to fetch user images'); }
    return data || [];
  }

  async updateImageStatus(id: number, status: string, url?: string): Promise<Image | null> {
    const updates: any = { status };
    if (url) updates.url = url;
    const { data, error } = await db.from('images').update(updates).eq('id', id).select().single();
    if (error) { console.error('Error updating image status:', error); throw new Error('Failed to update image status'); }
    return data;
  }
}

export const imageService = new ImageService();
