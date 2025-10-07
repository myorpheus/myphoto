import { supabase } from '@/integrations/supabase/client';

export interface Credits {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export class CreditService {
  async getUserCredits(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return 0; // No credits row exists
        }
        console.error('Error fetching user credits:', error);
        throw new Error('Failed to fetch user credits');
      }

      return data?.credits || 0;
    } catch (error) {
      console.error('Error in getUserCredits:', error);
      throw error;
    }
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Error in updateUserCredits:', error);
      return false;
    }
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Error in decrementUserCredits:', error);
      throw error;
    }
  }

  async incrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    try {
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
    } catch (error) {
      console.error('Error in incrementUserCredits:', error);
      return false;
    }
  }
}

const creditService = new CreditService();
export default creditService;
