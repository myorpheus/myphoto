import { supabase } from '@/integrations/supabase/client';

export interface Image {
  id: number;
  model_id: number;
  user_id: string;
  astria_image_id?: number;
  url: string;
  prompt?: string;
  status: string;
  created_at: string;
}

export interface ImageInsert {
  model_id: number;
  user_id: string;
  astria_image_id?: number;
  url: string;
  prompt?: string;
  status?: string;
}

export class ImageService {
  async createImage(image: ImageInsert): Promise<Image> {
    try {
      const { data, error } = await supabase
        .from('images')
        .insert({
          ...image,
          status: image.status || 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating image:', error);
        throw new Error(`Failed to create image: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create image: No data returned');
      }

      return data;
    } catch (error: any) {
      console.error('Error creating image:', error);
      throw error;
    }
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching model images:', error);
        throw new Error(`Failed to fetch model images: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching model images:', error);
      throw error;
    }
  }

  async getUserImages(userId: string): Promise<Image[]> {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user images:', error);
        throw new Error(`Failed to fetch user images: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error fetching user images:', error);
      throw error;
    }
  }

  async updateImageStatus(id: number, status: string, url?: string): Promise<Image | null> {
    try {
      const updates: any = { status };
      if (url) updates.url = url;

      const { data, error } = await supabase
        .from('images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating image status:', error);
        throw new Error(`Failed to update image status: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Error updating image status:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
