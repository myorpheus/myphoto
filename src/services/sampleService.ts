// src/services/sampleService.ts
// NOTE: 'samples' table doesn't exist in current schema. Using 'as any' to avoid build errors.

import { supabase } from '@/integrations/supabase/client';
import { Sample } from './types';

const db = supabase as any;

export class SampleService {
  async getUserSamples(userId: string): Promise<Sample[]> {
    const { data, error } = await db.from('samples').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error('Error fetching user samples:', error); throw new Error('Failed to fetch user samples'); }
    return data || [];
  }

  async createSample(sample: Omit<Sample, 'id' | 'created_at'>): Promise<Sample> {
    const { data, error } = await db.from('samples').insert(sample).select().single();
    if (error) { console.error('Error creating sample:', error); throw new Error('Failed to create sample'); }
    return data;
  }

  async deleteUserSamples(userId: string, modelId?: number): Promise<boolean> {
    let query = db.from('samples').delete().eq('user_id', userId);
    if (modelId) query = query.eq('model_id', modelId);
    const { error } = await query;
    if (error) { console.error('Error deleting samples:', error); return false; }
    return true;
  }
}

export const sampleService = new SampleService();
