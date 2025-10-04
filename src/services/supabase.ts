import { supabase } from '@/integrations/supabase/client';

// Note: models, images, and credits tables don't exist in the current database schema
// These methods are disabled until those tables are created

export class SupabaseService {
  // User Roles
  async getUserRoles(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data?.map(r => r.role) || [];
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes(role);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    return roles.includes('admin') || roles.includes('super_admin');
  }

  // Models - DISABLED (table doesn't exist)
  /* async createModel(model: ModelInsert): Promise<Model> {
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
  } */

  /* async getModel(id: number): Promise<Model | null> {
...
  } */

  /* async getUserModels(userId: string): Promise<Model[]> {
...
  } */

  /* async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
...
  } */

  /* async deleteModel(id: number): Promise<boolean> {
...
  } */

  // Images - DISABLED (table doesn't exist)
  /* async createImage(image: ImageInsert): Promise<Image> {
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
  } */

  /* async getModelImages(modelId: number): Promise<Image[]> {
...
  } */

  // Credits - DISABLED (table doesn't exist)
  /* async getUserCredits(userId: string): Promise<number> {
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
  } */

  /* async updateUserCredits(userId: string, credits: number): Promise<boolean> {
...
  } */

  /* async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
...
  } */

  // Samples - DISABLED (table doesn't exist)
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

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }

    return data;
  }

  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }

    return data;
  }
}

export const supabaseService = new SupabaseService();