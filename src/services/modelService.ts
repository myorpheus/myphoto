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

export class ModelService {
  async createModel(model: ModelInsert): Promise<Model> {
    try {
      const { data, error } = await supabase
        .from('models')
        .insert(model)
        .select()
        .single();

      if (error) {
        console.error('Error creating model:', error);
        throw new Error(`Failed to create model: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create model: No data returned');
      }

      return data;
    } catch (error) {
      console.error('Error in createModel:', error);
      throw error;
    }
  }

  async getModel(id: number): Promise<Model | null> {
    try {
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
        throw new Error(`Failed to fetch model: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getModel:', error);
      throw error;
    }
  }

  async getUserModels(userId: string): Promise<Model[]> {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user models:', error);
        throw new Error(`Failed to fetch user models: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserModels:', error);
      throw error;
    }
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    try {
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
        throw new Error(`Failed to update model: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateModel:', error);
      throw error;
    }
  }

  async deleteModel(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting model:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteModel:', error);
      return false;
    }
  }
}

export const modelService = new ModelService();
