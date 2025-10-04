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

  // Models - TEMPORARILY DISABLED until migration is run
  async createModel(model: ModelInsert): Promise<Model> {
    console.warn('Models table not yet created. Please run the database migration first.');
    throw new Error('Models table not yet created. Please run the database migration first.');
  }

  async getModel(id: number): Promise<Model | null> {
    console.warn('Models table not yet created. Please run the database migration first.');
    return null;
  }

  async getUserModels(userId: string): Promise<Model[]> {
    console.warn('Models table not yet created. Please run the database migration first.');
    return [];
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    console.warn('Models table not yet created. Please run the database migration first.');
    return null;
  }

  async deleteModel(id: number): Promise<boolean> {
    console.warn('Models table not yet created. Please run the database migration first.');
    return false;
  }

  // Images - TEMPORARILY DISABLED until migration is run
  async createImage(image: ImageInsert): Promise<Image> {
    console.warn('Images table not yet created. Please run the database migration first.');
    throw new Error('Images table not yet created. Please run the database migration first.');
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    console.warn('Images table not yet created. Please run the database migration first.');
    return [];
  }

  async getUserImages(userId: string): Promise<Image[]> {
    console.warn('Images table not yet created. Please run the database migration first.');
    return [];
  }

  async updateImageStatus(id: number, status: string, url?: string): Promise<Image | null> {
    console.warn('Images table not yet created. Please run the database migration first.');
    return null;
  }

  // Credits - TEMPORARILY DISABLED until migration is run
  async getUserCredits(userId: string): Promise<number> {
    console.warn('Credits table not yet created. Please run the database migration first.');
    return 0;
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    console.warn('Credits table not yet created. Please run the database migration first.');
    return false;
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    console.warn('Credits table not yet created. Please run the database migration first.');
    return false;
  }

  async incrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    console.warn('Credits table not yet created. Please run the database migration first.');
    return false;
  }

  // Samples - TEMPORARILY DISABLED until migration is run
  async getUserSamples(userId: string): Promise<Sample[]> {
    console.warn('Samples table not yet created. Please run the database migration first.');
    return [];
  }

  async createSample(sample: Omit<Sample, 'id' | 'created_at'>): Promise<Sample> {
    console.warn('Samples table not yet created. Please run the database migration first.');
    throw new Error('Samples table not yet created. Please run the database migration first.');
  }

  async deleteUserSamples(userId: string, modelId?: number): Promise<boolean> {
    console.warn('Samples table not yet created. Please run the database migration first.');
    return false;
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
