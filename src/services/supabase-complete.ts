// src/services/supabase-complete.ts
// Refactored to delegate to individual service modules for better maintainability

// Re-export all types
export * from './types';

// Import individual services
import { userService } from './userService';
import { modelService } from './modelService';
import { imageService } from './imageService';
import { creditService } from './creditService';
import { sampleService } from './sampleService';
import type { Model, ModelInsert, ModelUpdate, Image, ImageInsert, Sample } from './types';

/**
 * Complete Supabase Service
 * Provides a unified interface to all database operations
 * Delegates to individual service modules for better code organization
 */
export class CompletSupabaseService {
  // ===== User & Role Methods (delegates to userService) =====
  async getUserRoles(userId: string): Promise<string[]> {
    return userService.getUserRoles(userId);
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    return userService.hasRole(userId, role);
  }

  async isAdmin(userId: string): Promise<boolean> {
    return userService.isAdmin(userId);
  }

  async getAllUsers(): Promise<any[]> {
    return userService.getAllUsers();
  }

  async assignRole(userId: string, role: string): Promise<boolean> {
    return userService.assignRole(userId, role);
  }

  async removeRole(userId: string, role: string): Promise<boolean> {
    return userService.removeRole(userId, role);
  }

  async updateUserRoles(userId: string, newRoles: string[]): Promise<boolean> {
    return userService.updateUserRoles(userId, newRoles);
  }

  async deleteUser(userId: string): Promise<boolean> {
    return userService.deleteUser(userId);
  }

  async createUser(email: string, password: string, roles: string[] = ['user']): Promise<any> {
    return userService.createUser(email, password, roles);
  }

  async getCurrentUser() {
    return userService.getCurrentUser();
  }

  async signOut() {
    return userService.signOut();
  }

  async signInWithEmail(email: string) {
    return userService.signInWithEmail(email);
  }

  // ===== Model Methods (delegates to modelService) =====
  async createModel(model: ModelInsert): Promise<Model> {
    return modelService.createModel(model);
  }

  async getModel(id: number): Promise<Model | null> {
    return modelService.getModel(id);
  }

  async getUserModels(userId: string): Promise<Model[]> {
    return modelService.getUserModels(userId);
  }

  async updateModel(id: number, updates: ModelUpdate): Promise<Model | null> {
    return modelService.updateModel(id, updates);
  }

  async deleteModel(id: number): Promise<boolean> {
    return modelService.deleteModel(id);
  }

  // ===== Image Methods (delegates to imageService) =====
  async createImage(image: ImageInsert): Promise<Image> {
    return imageService.createImage(image);
  }

  async getModelImages(modelId: number): Promise<Image[]> {
    return imageService.getModelImages(modelId);
  }

  async getUserImages(userId: string): Promise<Image[]> {
    return imageService.getUserImages(userId);
  }

  async updateImageStatus(id: number, status: string, url?: string): Promise<Image | null> {
    return imageService.updateImageStatus(id, status, url);
  }

  // ===== Credit Methods (delegates to creditService) =====
  async getUserCredits(userId: string): Promise<number> {
    return creditService.getUserCredits(userId);
  }

  async updateUserCredits(userId: string, credits: number): Promise<boolean> {
    return creditService.updateUserCredits(userId, credits);
  }

  async decrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    return creditService.decrementUserCredits(userId, amount);
  }

  async incrementUserCredits(userId: string, amount: number = 1): Promise<boolean> {
    return creditService.incrementUserCredits(userId, amount);
  }

  // ===== Sample Methods (delegates to sampleService) =====
  async getUserSamples(userId: string): Promise<Sample[]> {
    return sampleService.getUserSamples(userId);
  }

  async createSample(sample: Omit<Sample, 'id' | 'created_at'>): Promise<Sample> {
    return sampleService.createSample(sample);
  }

  async deleteUserSamples(userId: string, modelId?: number): Promise<boolean> {
    return sampleService.deleteUserSamples(userId, modelId);
  }
}

// Export singleton instance for backward compatibility
export const completeSupabaseService = new CompletSupabaseService();
