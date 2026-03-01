// src/services/creditService.ts
// NOTE: 'credits' table doesn't exist in current schema. Using 'as any' to avoid build errors.
// Create the credits table in Supabase when ready.

import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export class CreditService {
  async getUserCredits(userId: string): Promise<number> {
    const { data, error } = await db
      .from('credits')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return 0;
      console.error('Error fetching user credits:', error);
      return 0;
    }
    return data?.credits || 0;
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    const { error } = await db
      .from('credits')
      .upsert({ user_id: userId, credits, updated_at: new Date().toISOString() });
    if (error) { console.error('Error updating user credits:', error); return false; }
    return true;
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    if (currentCredits < amount) throw new Error('Insufficient credits');
    const { error } = await db
      .from('credits')
      .update({ credits: currentCredits - amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) { console.error('Error decrementing user credits:', error); return false; }
    return true;
  }

  async incrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    const currentCredits = await this.getUserCredits(userId);
    const { error } = await db
      .from('credits')
      .upsert({ user_id: userId, credits: currentCredits + amount, updated_at: new Date().toISOString() });
    if (error) { console.error('Error incrementing user credits:', error); return false; }
    return true;
  }
}

export const creditService = new CreditService();
