/**
 * Image Lifecycle Service
 * Handles 1-hour image expiration and cleanup
 */

import { supabase } from '@/integrations/supabase/client';

export interface ImageExpiryInfo {
  image_id: string;
  created_at: string;
  expires_at: string;
  time_left_minutes: number;
  is_expired: boolean;
  status: string;
}

export interface ExpiringImage {
  id: string;
  url: string;
  user_id: string;
  created_at: string;
  prompt?: string;
  expires_at: string;
  time_left_minutes: number;
}

export interface CleanupResult {
  success: boolean;
  cleaned: number;
  errors?: string[];
  message: string;
}

/**
 * Call the image lifecycle edge function
 */
async function callLifecycleFunction(action: string, params?: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`https://imzlzufdujhcbebibgpj.supabase.co/functions/v1/image-lifecycle`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Lifecycle function failed');
  }

  return await response.json();
}

/**
 * Get expiry information for a specific image
 */
export async function getImageExpiryInfo(imageId: string, userId: string): Promise<ImageExpiryInfo> {
  const result = await callLifecycleFunction('get_image_expiry', {
    image_id: imageId,
    user_id: userId
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get image expiry info');
  }
  
  return {
    image_id: result.image_id,
    created_at: result.created_at,
    expires_at: result.expires_at,
    time_left_minutes: result.time_left_minutes,
    is_expired: result.is_expired,
    status: result.status
  };
}

/**
 * Get images that are expiring soon (within 10 minutes)
 */
export async function getExpiringSoonImages(): Promise<ExpiringImage[]> {
  const result = await callLifecycleFunction('get_expiring_soon');
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get expiring images');
  }
  
  return result.expiring_images || [];
}

/**
 * Extend an image's life by 1 hour
 */
export async function extendImageLife(imageId: string, userId: string): Promise<void> {
  const result = await callLifecycleFunction('extend_image_life', {
    image_id: imageId,
    user_id: userId
  });
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to extend image life');
  }
}

/**
 * Trigger cleanup of expired images (admin function)
 */
export async function cleanupExpiredImages(): Promise<CleanupResult> {
  const result = await callLifecycleFunction('cleanup_expired');
  
  return {
    success: result.success,
    cleaned: result.cleaned || 0,
    errors: result.errors,
    message: result.message || 'Cleanup completed'
  };
}

/**
 * Calculate time left for an image
 */
export function calculateTimeLeft(createdAt: string): {
  expiresAt: Date;
  timeLeftMs: number;
  timeLeftMinutes: number;
  isExpired: boolean;
  timeLeftText: string;
} {
  const created = new Date(createdAt);
  const expires = new Date(created.getTime() + 60 * 60 * 1000); // 1 hour later
  const now = new Date();
  const timeLeftMs = expires.getTime() - now.getTime();
  const timeLeftMinutes = Math.max(0, Math.floor(timeLeftMs / (60 * 1000)));
  const isExpired = timeLeftMs <= 0;
  
  let timeLeftText: string;
  if (isExpired) {
    timeLeftText = 'Expired';
  } else if (timeLeftMinutes < 1) {
    const seconds = Math.max(0, Math.floor(timeLeftMs / 1000));
    timeLeftText = `${seconds}s left`;
  } else if (timeLeftMinutes < 60) {
    timeLeftText = `${timeLeftMinutes}m left`;
  } else {
    const hours = Math.floor(timeLeftMinutes / 60);
    const mins = timeLeftMinutes % 60;
    timeLeftText = `${hours}h ${mins}m left`;
  }
  
  return {
    expiresAt: expires,
    timeLeftMs,
    timeLeftMinutes,
    isExpired,
    timeLeftText
  };
}

/**
 * Get expiry status color for UI
 */
export function getExpiryStatusColor(timeLeftMinutes: number): string {
  if (timeLeftMinutes <= 0) return 'text-red-600'; // Expired
  if (timeLeftMinutes <= 10) return 'text-orange-600'; // Expiring soon
  if (timeLeftMinutes <= 30) return 'text-yellow-600'; // Warning
  return 'text-green-600'; // Safe
}

/**
 * Check if image needs urgency indicator
 */
export function needsUrgencyIndicator(timeLeftMinutes: number): boolean {
  return timeLeftMinutes <= 10 && timeLeftMinutes > 0;
}

/**
 * Auto-refresh handler for real-time updates
 */
export class ImageLifecycleMonitor {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, (info: ImageExpiryInfo) => void> = new Map();

  /**
   * Start monitoring an image's lifecycle
   */
  startMonitoring(imageId: string, userId: string, callback: (info: ImageExpiryInfo) => void): void {
    // Stop existing monitoring for this image
    this.stopMonitoring(imageId);
    
    this.callbacks.set(imageId, callback);
    
    // Update every 30 seconds
    const interval = setInterval(async () => {
      try {
        const info = await getImageExpiryInfo(imageId, userId);
        callback(info);
        
        // Stop monitoring if expired
        if (info.is_expired) {
          this.stopMonitoring(imageId);
        }
      } catch (error) {
        console.error(`Error monitoring image ${imageId}:`, error);
        // Continue monitoring despite errors
      }
    }, 30000);
    
    this.intervals.set(imageId, interval);
  }

  /**
   * Stop monitoring an image
   */
  stopMonitoring(imageId: string): void {
    const interval = this.intervals.get(imageId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(imageId);
    }
    this.callbacks.delete(imageId);
  }

  /**
   * Stop all monitoring
   */
  stopAll(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
    this.callbacks.clear();
  }
}

// Export a singleton monitor instance
export const imageLifecycleMonitor = new ImageLifecycleMonitor();