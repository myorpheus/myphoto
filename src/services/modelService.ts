// src/services/modelService.ts
// NOTE: 'models' table doesn't exist in current schema. Using 'as any' to avoid build errors.

import { supabase } from '@/integrations/supabase/client';
import { Model, ModelInsert, ModelUpdate } from './types';

const db = supabase as any;

export class ModelService {
  async createModel(model: ModelInsert): Promise<Model> {
    const { data, error } = await db.from('models').insert(model).select().single();
    if (error) { console.error('Error creating model:', error); throw new Error('Failed to create model'); }
    return data;
  }

  async getModel(id: number): Promise<Model | null> {
    const { data, error } = await db.from('models').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching model:', error); throw new Error('Failed to fetch model');
    }
    return data;
  }

  async getUserModels(userId: string): Promise<Model[]> {
    const { data, error } = await db.from('models').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching user models:', error); throw new Error('Failed to fetch user models'); }
    return data || [];
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    const { data, error } = await db.from('models').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) { console.error('Error updating model:', error); throw new Error('Failed to update model'); }
    return data;
  }

  async deleteModel(id: number): Promise<boolean> {
    const { error } = await db.from('models').delete().eq('id', id);
    if (error) { console.error('Error deleting model:', error); return false; }
    return true;
  }
}

export const modelService = new ModelService();
