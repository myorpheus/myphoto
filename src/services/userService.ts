import { supabase } from '@/integrations/supabase/client';

export class UserService {
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return data?.map(r => r.role) || [];
    } catch (error) {
      console.error('Error in getUserRoles:', error);
      return [];
    }
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.includes(role);
    } catch (error) {
      console.error('Error in hasRole:', error);
      return false;
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.includes('admin') || roles.includes('super_admin');
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          updated_at,
          appsource,
          user_roles(role)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all users:', error);
        throw new Error('Failed to fetch users');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  }

  async assignRole(userId: string, role: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as 'admin' | 'creator' | 'super_admin' | 'user' }]);

      if (error) {
        console.error('Error assigning role:', error);
        throw new Error('Failed to assign role');
      }

      return true;
    } catch (error) {
      console.error('Error in assignRole:', error);
      throw error;
    }
  }

  async removeRole(userId: string, role: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as 'admin' | 'creator' | 'super_admin' | 'user');

      if (error) {
        console.error('Error removing role:', error);
        throw new Error('Failed to remove role');
      }

      return true;
    } catch (error) {
      console.error('Error in removeRole:', error);
      throw error;
    }
  }

  async updateUserRoles(userId: string, newRoles: string[]): Promise<boolean> {
    try {
      // Remove all existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing user roles:', deleteError);
        throw new Error('Failed to update user roles');
      }

      // Add new roles
      if (newRoles.length > 0) {
        const roleInserts = newRoles.map(role => ({
          user_id: userId,
          role: role as 'admin' | 'creator' | 'super_admin' | 'user'
        }));
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (insertError) {
          console.error('Error inserting new user roles:', insertError);
          throw new Error('Failed to update user roles');
        }
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserRoles:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting user from auth:', authError);
        throw new Error('Failed to delete user account');
      }

      return true;
    } catch (error) {
      console.error('Error in deleteUser:', error);
      throw error;
    }
  }

  async createUser(email: string, password: string, roles: string[] = ['user']): Promise<any> {
    try {
      const { data, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          appsource: 'PRu'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        throw new Error('Failed to create user');
      }

      if (!data.user) {
        throw new Error('Failed to create user: No user returned');
      }

      // Assign roles
      if (roles.length > 0) {
        await this.updateUserRoles(data.user.id, roles);
      }

      return data.user;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out');
    }
  }

  async signInWithEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      console.error('Error signing in with email:', error);
      throw new Error('Failed to sign in');
    }
  }
}

export const userService = new UserService();
