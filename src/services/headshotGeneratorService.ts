// src/services/headshotGeneratorService.ts
// Service layer for headshot generation API interactions

import { supabase } from '@/integrations/supabase/client';
import { completeSupabaseService } from './supabase-complete';

interface TrainModelParams {
  images: File[];
  modelName: string;
  userId: string;
  accessToken: string;
}

interface TrainModelResponse {
  success: boolean;
  tune_id?: number;
  db_model_id?: number;
  message?: string;
  error?: string;
}

interface CheckStatusResponse {
  success: boolean;
  status?: string;
  message?: string;
  error?: string;
}

interface GenerateImageParams {
  tuneId: number;
  prompt: string;
  style?: string;
  gender?: string;
  numImages?: number;
  accessToken: string;
}

interface GenerateImageResponse {
  success: boolean;
  images?: Array<{
    id: number;
    url: string;
  }>;
  message?: string;
  error?: string;
}

export class HeadshotGeneratorService {
  private edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-headshot`;

  /**
   * Train a new AI model with user-provided images
   */
  async trainModel(params: TrainModelParams): Promise<TrainModelResponse> {
    const { images, modelName, userId, accessToken } = params;

    // Convert images to base64
    const imagePromises = images.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    const base64Images = await Promise.all(imagePromises);

    // Call edge function to train model
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: 'train_model',
        images: base64Images,
        title: modelName,
        name: modelName.toLowerCase().replace(/\s+/g, '_'),
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Training failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create a model record in the database
   */
  async createModelRecord(userId: string, astriaModelId: number, modelName: string) {
    return completeSupabaseService.createModel({
      user_id: userId,
      astria_model_id: astriaModelId,
      name: modelName,
      status: 'training',
    });
  }

  /**
   * Create sample records for uploaded images
   */
  async createSampleRecords(images: File[], userId: string, modelId: number) {
    const samplePromises = images.map((file) =>
      completeSupabaseService.createSample({
        user_id: userId,
        model_id: modelId,
        file_name: file.name,
        file_path: '',
        file_size: file.size,
      })
    );

    return Promise.all(samplePromises);
  }

  /**
   * Check the training status of a model
   */
  async checkModelStatus(tuneId: number, accessToken: string): Promise<CheckStatusResponse> {
    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: 'check_status',
        tune_id: tuneId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Status check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Update model status in database
   */
  async updateModelStatus(modelId: number, status: string) {
    return completeSupabaseService.updateModel(modelId, { status });
  }

  /**
   * Generate headshot images using a trained model
   */
  async generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
    const { tuneId, prompt, style, gender, numImages = 4, accessToken } = params;

    const response = await fetch(this.edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: 'generate_image',
        tune_id: tuneId,
        prompt,
        style,
        gender,
        num_images: numImages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get model details by ID
   */
  async getModel(modelId: number) {
    return completeSupabaseService.getModel(modelId);
  }

  /**
   * Get images associated with a model
   */
  async getModelImages(modelId: number) {
    return completeSupabaseService.getModelImages(modelId);
  }

  /**
   * Download an image from URL
   */
  async downloadImage(imageUrl: string, filename: string = 'headshot.jpg'): Promise<void> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error('Failed to download image');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return completeSupabaseService.getCurrentUser();
  }

  /**
   * Get user credits
   */
  async getUserCredits(userId: string) {
    return completeSupabaseService.getUserCredits(userId);
  }

  /**
   * Get current session and access token
   */
  async getAccessToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error('No active session');
    }

    return session.access_token;
  }
}

// Export singleton instance
export const headshotGeneratorService = new HeadshotGeneratorService();
