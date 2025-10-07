// src/services/trainModelService.ts
import { completeSupabaseService } from '@/services/supabase-complete';
import { supabase } from '@/integrations/supabase/client';
import { filesToBase64 } from '@/utils/file-utils';

export const trainModelService = {
  /**
   * Load user's models from database
   */
  loadUserModels: async () => {
    const user = await completeSupabaseService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🔄 Loading user models...');
    const userModels = await completeSupabaseService.getUserModels(user.id);
    console.log('📊 Loaded models:', userModels);
    return userModels;
  },

  /**
   * Load Astria models via edge function
   */
  loadAstriaModels: async () => {
    console.log('🔄 Starting Astria models loading process...');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }

    if (!session) {
      console.warn('⚠️ No session available for loading Astria models');
      throw new Error('Authentication required');
    }

    console.log('✅ Session valid, user ID:', session.user?.id);
    console.log('🔍 Session expires at:', new Date(session.expires_at! * 1000));
    console.log('🔄 Calling edge function for model list...');

    const apiUrl = `https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`;
    console.log('🌐 API URL:', apiUrl);

    const requestPayload = { action: 'list_models' };
    console.log('📤 Request payload:', requestPayload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');

      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const textResponse = await response.text();
          console.error('❌ Non-JSON error response:', textResponse);
          errorData = { error: textResponse, rawResponse: textResponse };
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        errorData = { error: 'Failed to parse error response', parseError: (parseError as Error).message };
      }

      console.error('❌ Detailed API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: apiUrl
      });

      const errorMessage = `API Error ${response.status}: ${errorData?.error || response.statusText}${
        errorData?.apiKeyConfigured === false ? ' (API Key not configured)' : ''
      }${errorData?.details ? ` - ${errorData.details}` : ''}`;

      throw new Error(errorMessage);
    }

    let result;
    try {
      result = await response.json();
      console.log('✅ Raw API response:', result);
    } catch (parseError) {
      console.error('❌ Failed to parse successful response:', parseError);
      throw new Error('Invalid response format from API');
    }

    if (!result.success) {
      console.error('❌ API returned failure:', result);
      throw new Error(result.error || 'API returned unsuccessful response');
    }

    if (!result.models) {
      console.warn('⚠️ No models property in response:', result);
      return [];
    }

    if (!Array.isArray(result.models)) {
      console.warn('⚠️ Models is not an array:', typeof result.models, result.models);
      return [];
    }

    console.log('📊 Model count:', result.models.length);
    console.log('📋 Model details:', result.models.map((m: any, i: number) => ({
      index: i,
      id: m.id,
      name: m.name || m.title,
      status: m.status,
      created_at: m.created_at
    })));

    return result.models;
  },

  /**
   * Find default model from Astria models list
   */
  findDefaultModel: (models: any[]) => {
    console.log('🔍 Searching for default model...');

    // Strategy 1: Look for specific name patterns
    let defaultModel = models.find((model: any) => {
      const name = (model.name || model.title || '').toLowerCase();
      const matches = name.includes('newheadhotman') || name.includes('newheadshot');
      if (matches) {
        console.log('🎯 Found model by name pattern:', model);
      }
      return matches;
    });

    // Strategy 2: Look for any headshot-related models if specific not found
    if (!defaultModel) {
      defaultModel = models.find((model: any) => {
        const name = (model.name || model.title || '').toLowerCase();
        const matches = name.includes('headshot') || name.includes('head');
        if (matches) {
          console.log('🎯 Found model by headshot pattern:', model);
        }
        return matches;
      });
    }

    // Strategy 3: Use first trained model as fallback (handle undefined status)
    if (!defaultModel) {
      defaultModel = models.find((model: any) => {
        const isTrained = model.status === 'trained' || model.status === 'finished' || !model.status;
        if (isTrained) {
          console.log('🎯 Found trained/available model as fallback:', model);
        }
        return isTrained;
      });
    }

    // Strategy 4: Use any available model
    if (!defaultModel && models.length > 0) {
      defaultModel = models[0];
      console.log('🎯 Using first available model:', defaultModel);
    }

    if (defaultModel) {
      console.log('✅ Selected default model:', {
        id: defaultModel.id,
        name: defaultModel.name || defaultModel.title,
        status: defaultModel.status
      });
    } else {
      console.log('⚠️ No suitable default model found');
    }

    return defaultModel;
  },

  /**
   * Train new model or link existing Astria model
   */
  trainModel: async (params: {
    useExistingModel: boolean;
    modelName?: string;
    selectedFiles?: File[];
    selectedExistingModel?: any;
  }) => {
    const { useExistingModel, modelName, selectedFiles, selectedExistingModel } = params;

    const user = await completeSupabaseService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    if (useExistingModel && selectedExistingModel) {
      // Use existing Astria model - save to database for user access
      console.log('💾 Saving existing model for user access:', selectedExistingModel.name);

      const newModel = await completeSupabaseService.createModel({
        user_id: user.id,
        astria_model_id: selectedExistingModel.id,
        name: selectedExistingModel.name || `Existing Model ${selectedExistingModel.id}`,
        status: 'trained'
      });

      console.log('✅ Existing model saved to database:', newModel);

      return {
        success: true,
        model: newModel,
        message: `Existing model "${selectedExistingModel.name}" is now available for use.`
      };
    } else {
      // Create new model with training
      if (!modelName || !selectedFiles || selectedFiles.length < 4) {
        throw new Error('Model name and at least 4 photos required');
      }

      console.log('🚀 Starting model training:', modelName);

      const imageBase64 = await filesToBase64(selectedFiles);

      const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/generate-headshot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'train_model',
          name: modelName,
          images: imageBase64,
          steps: 500,
          face_crop: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start training');
      }

      const astriaModel = await response.json();
      console.log('✅ Astria model created via edge function:', astriaModel);

      const dbModel = astriaModel.model;
      console.log('✅ Database model saved via edge function:', dbModel);

      return {
        success: true,
        model: dbModel,
        message: `Model "${modelName}" is now training. This may take 10-15 minutes.`
      };
    }
  }
};
