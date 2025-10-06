import { supabase } from '@/integrations/supabase/client';

export interface Model {
  id: number;
  user_id: string;
  astria_model_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModelInsert {
  user_id: string;
  astria_model_id: number;
  name: string;
  status?: string;
}

export interface ModelUpdate {
  name?: string;
  status?: string;
  updated_at?: string;
}

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

export interface Sample {
  id: string;
  user_id: string;
  model_id?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  created_at: string;
}

export interface Credits {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export class CompletSupabaseService {
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

  // Models - ENABLED (Migration completed)
  async createModel(model: ModelInsert): Promise<Model> {
    const { data, error } = await supabase
      .from('models')
      .insert(model)
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
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      console.error('Error fetching model:', error);
      throw new Error('Failed to fetch model');
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
      throw new Error('Failed to fetch user models');
    }

    return data || [];
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    const { data, error } = await supabase
      .from('models')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating model:', error);
      throw new Error('Failed to update model');
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

  // Images - ENABLED (Migration completed)
  async createImage(image: ImageInsert): Promise<Image> {
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
      throw new Error('Failed to create image');
    }

    return data;
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching model images:', error);
      throw new Error('Failed to fetch model images');
    }

    return data || [];
  }

  async getUserImages(userId: string): Promise<Image[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user images:', error);
      throw new Error('Failed to fetch user images');
    }

    return data || [];
  }

  async updateImageStatus(id: number, status: string, url?: string): Promise<Image | null> {
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
      throw new Error('Failed to update image status');
    }

    return data;
  }

  // Credits - ENABLED (Migration completed)
  async getUserCredits(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No credits row exists, return 0
        return 0;
      }
      console.error('Error fetching user credits:', error);
      throw new Error('Failed to fetch user credits');
    }

    return data?.credits || 0;
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    const { error } = await supabase
      .from('credits')
      .upsert({
        user_id: userId,
        credits: credits,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user credits:', error);
      return false;
    }

    return true;
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    const { error } = await supabase
      .from('credits')
      .update({
        credits: currentCredits - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error decrementing user credits:', error);
      return false;
    }

    return true;
  }

  async incrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);

    const { error } = await supabase
      .from('credits')
      .upsert({
        user_id: userId,
        credits: currentCredits + amount,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error incrementing user credits:', error);
      return false;
    }

    return true;
  }

  // Samples - ENABLED (Migration completed)
  async getUserSamples(userId: string): Promise<Sample[]> {
    const { data, error } = await supabase
      .from('samples')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user samples:', error);
      throw new Error('Failed to fetch user samples');
    }

    return data || [];
  }

  async createSample(sample: Omit<Sample, 'id' | 'created_at'>): Promise<Sample> {
    const { data, error } = await supabase
      .from('samples')
      .insert(sample)
      .select()
      .single();

    if (error) {
      console.error('Error creating sample:', error);
      throw new Error('Failed to create sample');
    }

    return data;
  }

  async deleteUserSamples(userId: string, modelId?: number): Promise<boolean> {
    let query = supabase
      .from('samples')
      .delete()
      .eq('user_id', userId);

    if (modelId) {
      query = query.eq('model_id', modelId);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting user samples:', error);
      return false;
    }

    return true;
  }

  // User Management - ADMIN ONLY
  async getAllUsers(): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        updated_at,
        appsource,
        user_roles!inner(role)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  async assignRole(userId: string, role: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role })
      .select()
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      throw new Error('Failed to assign role');
    }

    return true;
  }

  async removeRole(userId: string, role: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      console.error('Error removing role:', error);
      throw new Error('Failed to remove role');
    }

    return true;
  }

  async updateUserRoles(userId: string, newRoles: string[]): Promise<boolean> {
    // First remove all existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // Then add new roles
    if (newRoles.length > 0) {
      const roleInserts = newRoles.map(role => ({ user_id: userId, role }));
      const { error } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (error) {
        console.error('Error updating user roles:', error);
        throw new Error('Failed to update user roles');
      }
    }

    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    // Delete from auth.users table (requires service role key)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting user from auth:', authError);
      throw new Error('Failed to delete user account');
    }

    // The triggers should handle cleanup of related data (profiles, user_roles, etc)
    return true;
  }

  async createUser(email: string, password: string, roles: string[] = ['user']): Promise<any> {
    // Create user in auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for admin-created users
      user_metadata: {
        appsource: 'PRu'
      }
    });

    if (authError) {
      console.error('Error creating user:', authError);
      throw new Error('Failed to create user account');
    }

    if (data.user) {
      // Assign specified roles
      await this.updateUserRoles(data.user.id, roles);
    }

    return data.user;
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

export const completeSupabaseService = new CompletSupabaseService();
