import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Model = Database['public']['Tables']['models']['Row'];
type ModelInsert = Database['public']['Tables']['models']['Insert'];
type ModelUpdate = Database['public']['Tables']['models']['Update'];

type Image = Database['public']['Tables']['images']['Row'];
type ImageInsert = Database['public']['Tables']['images']['Insert'];

type Credits = Database['public']['Tables']['credits']['Row'];
// type Sample = Database['public']['Tables']['samples']['Row']; // samples table doesn't exist yet

export class SupabaseService {
  // Models
  async createModel(model: ModelInsert): Promise<Model> {
    const { data, error } = await supabase
      .from('models')
      .insert([model])
      .select()
      .single();

    if (error) {
      console.error('Error creating model:', error);
      throw new Error('Failed to create model');
    }

    return data;
  }

  async getModel(id: number): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching model:', error);
      return null;
    }

    return data;
  }

  async getUserModels(userId: string): Promise<Model[]> {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user models:', error);
      return [];
    }

    return data || [];
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating model:', error);
      return null;
    }

    return data;
  }

  async deleteModel(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting model:', error);
      return false;
    }

    return true;
  }

  // Images
  async createImage(image: ImageInsert): Promise<Image> {
    const { data, error } = await supabase
      .from('images')
      .insert([image])
      .select()
      .single();

    if (error) {
      console.error('Error creating image:', error);
      throw new Error('Failed to create image');
    }

    return data;
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('modelId', modelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching model images:', error);
      return [];
    }

    return data || [];
  }

  // Credits
  async getUserCredits(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      return 0;
    }

    return data?.credits || 0;
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    const { error } = await supabase
      .from('credits')
      .upsert({ user_id: userId, credits })
      .select();

    if (error) {
      console.error('Error updating user credits:', error);
      return false;
    }

    return true;
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    const newCredits = Math.max(0, currentCredits - amount);
    return this.updateUserCredits(userId, newCredits);
  }

  // Samples
  // Note: 'samples' table doesn't exist in current database schema
  // This method is disabled until the table is created
  async getUserSamples(userId: string): Promise<any[]> {
    console.warn('getUserSamples: samples table not yet implemented');
    return [];
    
    /* Uncomment when 'samples' table is added to database:
    const { data, error } = await supabase
      .from('samples')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user samples:', error);
      return [];
    }

    return data || [];
    */
  }

  // Authentication helpers
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();