// src/services/creditService.ts

import { supabase } from '@/integrations/supabase/client';

export class CreditService {
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
}

export const creditService = new CreditService();
