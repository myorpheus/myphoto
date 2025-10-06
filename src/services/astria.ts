// ⚠️ DEPRECATED: This file is no longer used for security reasons
// Direct client-side API calls to Astria have been replaced with secure edge functions
// See /supabase/functions/generate-headshot/ for the new implementation
// This file is kept only for type definitions

import axios from 'axios';

const ASTRIA_API_BASE_URL = 'https://api.astria.ai/tunes/';
// ⚠️ SECURITY: API key moved to server-side edge functions
// const ASTRIA_API_KEY = import.meta.env.VITE_ASTRIA_API_KEY;

export interface AstriaModel {
  id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AstriaImage {
  id: number;
  url: string;
  created_at: string;
}

export interface TrainModelRequest {
  name: string;
  images: File[];
  steps?: number;
  face_crop?: boolean;
}

export interface GenerateImageRequest {
  modelId: number;
  prompt: string;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  seed?: number;
  num_images?: number;
}

class AstriaService {
  private apiKey: string;

  constructor() {
    this.apiKey = ASTRIA_API_KEY || '';
    
    // Enhanced debugging for API key configuration
    console.log('🔧 AstriaService initialization:');
    console.log('  - VITE_ASTRIA_API_KEY from env:', ASTRIA_API_KEY ? '[CONFIGURED]' : '[EMPTY]');
    console.log('  - API key loaded:', this.apiKey ? `[${this.apiKey.substring(0, 8)}...]` : '[EMPTY]');
    console.log('  - API key length:', this.apiKey?.length || 0);
    
    if (!this.apiKey) {
      console.error('❌ CRITICAL: ASTRIA_API_KEY is not configured or empty');
      console.error('   This will cause all Astria API calls to fail with 401 Unauthorized');
    } else {
      console.log('✅ Astria API key successfully loaded');
    }
  }

  async trainModel(request: TrainModelRequest): Promise<AstriaModel> {
    const formData = new FormData();
    formData.append('tune[title]', request.name);
    formData.append('tune[name]', request.name.toLowerCase().replace(/\\s+/g, '-'));
    formData.append('tune[steps]', (request.steps || 500).toString());
    formData.append('tune[face_crop]', (request.face_crop || true).toString());

    // Add images to form data
    request.images.forEach((image, index) => {
      formData.append(`tune[images][]`, image, `image_${index}.jpg`);
    });

    try {
      const response = await axios.post(`${ASTRIA_API_BASE_URL}`, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  }

  async getModel(modelId: number): Promise<AstriaModel> {
    try {
      const response = await axios.get(`${ASTRIA_API_BASE_URL}${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching model:', error);
      throw new Error('Failed to fetch model');
    }
  }

  async generateImages(request: GenerateImageRequest): Promise<AstriaImage[]> {
    const payload = {
      tune_id: request.modelId,
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || 'blurry, bad quality, distorted',
      steps: request.steps || 50,
      cfg_scale: request.cfg_scale || 7,
      seed: request.seed,
      num_images: request.num_images || 4,
    };

    try {
      const response = await axios.post(`${ASTRIA_API_BASE_URL}${request.modelId}/prompts`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error generating images:', error);
      throw new Error('Failed to generate images');
    }
  }

  async getImages(modelId: number): Promise<AstriaImage[]> {
    try {
      const response = await axios.get(`${ASTRIA_API_BASE_URL}${modelId}/prompts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw new Error('Failed to fetch images');
    }
  }

  async deleteModel(modelId: number): Promise<void> {
    try {
      await axios.delete(`${ASTRIA_API_BASE_URL}${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      throw new Error('Failed to delete model');
    }
  }
}

export const astriaService = new AstriaService();