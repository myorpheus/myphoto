// src/services/sampleService.ts

import { supabase } from '@/integrations/supabase/client';
import { Sample } from './types';

export class SampleService {
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
      console.error('Error deleting samples:', error);
      return false;
    }

    return true;
  }
}

export const sampleService = new SampleService();
