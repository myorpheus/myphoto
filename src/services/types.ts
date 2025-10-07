// Shared types for Supabase services

export interface Model {
  id: number;
  user_id: string;
  astria_model_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ModelInsert {
  user_id: string;
  astria_model_id: number;
  name: string;
  status?: string;
}

export interface ModelUpdate {
  name?: string;
  status?: string;
  updated_at?: string;
}

export interface Image {
  id: number;
  model_id: number;
  user_id: string;
  astria_image_id?: number;
  url: string;
  prompt?: string;
  status: string;
  created_at: string;
}

export interface ImageInsert {
  model_id: number;
  user_id: string;
  astria_image_id?: number;
  url: string;
  prompt?: string;
  status?: string;
}

export interface Sample {
  id: string;
  user_id: string;
  model_id?: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  created_at: string;
}

export interface Credits {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}
