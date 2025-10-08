/**
 * Image Expiry Service
 * Handles image lifecycle management including expiry times and "save forever" functionality
 */

import { supabase } from '@/lib/supabase';

export interface ImageWithExpiry {
  id: number;
  url: string;
  created_at: string;
  expires_at: string | null;
  status: string;
}

/**
 * Calculate time remaining until image expires
 * @param expiresAt ISO timestamp when image expires
 * @returns Object with hours, minutes remaining, or null if saved forever
 */
export function getTimeUntilExpiry(expiresAt: string | null): {
  hours: number;
  minutes: number;
  expired: boolean;
} | null {
  if (!expiresAt) return null; // Image saved forever

  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, expired: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { hours, minutes, expired: false };
}

/**
 * Format expiry time for display
 * @param expiresAt ISO timestamp when image expires
 * @returns Human-readable expiry string
 */
export function formatExpiryTime(expiresAt: string | null): string {
  if (!expiresAt) return 'Saved forever';

  const timeRemaining = getTimeUntilExpiry(expiresAt);
  if (!timeRemaining) return 'Saved forever';
  if (timeRemaining.expired) return 'Expired';

  const { hours, minutes } = timeRemaining;

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`;
  }
  return `Expires in ${minutes}m`;
}

/**
 * Save an image forever (prevent automatic deletion)
 * @param imageId ID of the image to save
 * @returns true if successful, false otherwise
 */
export async function saveImageForever(imageId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('images')
      .update({ expires_at: null })
      .eq('id', imageId);

    if (error) {
      console.error('Error saving image forever:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception saving image forever:', error);
    return false;
  }
}

/**
 * Restore expiry for an image (set back to 24 hours from now)
 * @param imageId ID of the image to restore expiry
 * @returns true if successful, false otherwise
 */
export async function restoreImageExpiry(imageId: number): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase
      .from('images')
      .update({ expires_at: expiresAt.toISOString() })
      .eq('id', imageId);

    if (error) {
      console.error('Error restoring image expiry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception restoring image expiry:', error);
    return false;
  }
}

/**
 * Get all images with their expiry information
 * @param userId ID of the user
 * @returns Array of images with expiry data
 */
export async function getImagesWithExpiry(
  userId: string
): Promise<ImageWithExpiry[]> {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('id, url, created_at, expires_at, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images with expiry:', error);
      return [];
    }

    return data as ImageWithExpiry[];
  } catch (error) {
    console.error('Exception fetching images with expiry:', error);
    return [];
  }
}

/**
 * Check if an image is about to expire (less than 1 hour remaining)
 * @param expiresAt ISO timestamp when image expires
 * @returns true if image expires in less than 1 hour
 */
export function isImageAboutToExpire(expiresAt: string | null): boolean {
  if (!expiresAt) return false;

  const timeRemaining = getTimeUntilExpiry(expiresAt);
  if (!timeRemaining || timeRemaining.expired) return false;

  return timeRemaining.hours === 0;
}
