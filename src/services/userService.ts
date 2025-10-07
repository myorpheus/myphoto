// src/services/userService.ts

import { supabase } from '@/integrations/supabase/client';

export class UserService {
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
      .insert([{ user_id: userId, role: role as 'admin' | 'creator' | 'super_admin' | 'user' }]);

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
      .eq('role', role as 'admin' | 'creator' | 'super_admin' | 'user');

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
      const roleInserts = newRoles.map(role => ({
        user_id: userId,
        role: role as 'admin' | 'creator' | 'super_admin' | 'user'
      }));
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

export const userService = new UserService();
