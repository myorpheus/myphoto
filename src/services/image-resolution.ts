/**
 * Image Resolution Service
 * Handles multi-resolution downloads (4K/1080p/720p)
 */

export interface ResolutionOption {
  name: string;
  width: number;
  height: number;
  quality: number;
  label: string;
}

export const RESOLUTION_OPTIONS: Record<string, ResolutionOption> = {
  '4K': {
    name: '4K',
    width: 3840,
    height: 2160,
    quality: 0.95,
    label: '4K Ultra HD'
  },
  '1080p': {
    name: '1080p',
    width: 1920,
    height: 1080,
    quality: 0.9,
    label: '1080p Full HD'
  },
  '720p': {
    name: '720p',
    width: 1280,
    height: 720,
    quality: 0.85,
    label: '720p HD'
  },
  'original': {
    name: 'original',
    width: 0, // Will use original dimensions
    height: 0,
    quality: 1.0,
    label: 'Original Quality'
  }
};

/**
 * Resize image to specified resolution using canvas
 */
function resizeImageToResolution(
  originalImage: HTMLImageElement,
  targetResolution: ResolutionOption
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Calculate target dimensions maintaining aspect ratio
    const originalWidth = originalImage.naturalWidth;
    const originalHeight = originalImage.naturalHeight;
    const originalAspectRatio = originalWidth / originalHeight;
    
    let targetWidth: number;
    let targetHeight: number;
    
    if (targetResolution.name === 'original') {
      targetWidth = originalWidth;
      targetHeight = originalHeight;
    } else {
      // Maintain aspect ratio while fitting within target resolution
      if (originalAspectRatio > 1) {
        // Landscape: fit to width
        targetWidth = Math.min(targetResolution.width, originalWidth);
        targetHeight = Math.round(targetWidth / originalAspectRatio);
      } else {
        // Portrait: fit to height
        targetHeight = Math.min(targetResolution.height, originalHeight);
        targetWidth = Math.round(targetHeight * originalAspectRatio);
      }
    }
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Use high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw resized image
    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);
    
    // Convert to blob with specified quality
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/jpeg',
      targetResolution.quality
    );
  });
}

/**
 * Load image from URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Download image with specified resolution
 */
export async function downloadImageWithResolution(
  imageUrl: string,
  resolutionKey: keyof typeof RESOLUTION_OPTIONS,
  filename?: string
): Promise<void> {
  try {
    const resolution = RESOLUTION_OPTIONS[resolutionKey];
    if (!resolution) {
      throw new Error(`Invalid resolution: ${resolutionKey}`);
    }

    // For original quality, just download directly
    if (resolutionKey === 'original') {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      downloadBlob(blob, filename || `headshot_original_${Date.now()}.jpg`);
      return;
    }

    // Load and resize image
    const originalImage = await loadImage(imageUrl);
    const resizedBlob = await resizeImageToResolution(originalImage, resolution);
    
    // Download the resized image
    const downloadFilename = filename || `headshot_${resolution.name}_${Date.now()}.jpg`;
    downloadBlob(resizedBlob, downloadFilename);
    
  } catch (error) {
    console.error('Error downloading image with resolution:', error);
    throw error;
  }
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

/**
 * Get estimated file size for resolution
 */
export function getEstimatedFileSize(
  originalSizeKB: number,
  targetResolution: keyof typeof RESOLUTION_OPTIONS
): string {
  const resolution = RESOLUTION_OPTIONS[targetResolution];
  if (!resolution || targetResolution === 'original') {
    return `~${Math.round(originalSizeKB)}KB`;
  }
  
  // Rough estimation based on resolution and quality
  const resolutionFactor = (resolution.width * resolution.height) / (1920 * 1080); // Relative to 1080p
  const qualityFactor = resolution.quality;
  const estimatedKB = originalSizeKB * resolutionFactor * qualityFactor;
  
  if (estimatedKB > 1024) {
    return `~${(estimatedKB / 1024).toFixed(1)}MB`;
  }
  return `~${Math.round(estimatedKB)}KB`;
}

/**
 * Check if resolution is supported by browser
 */
export function isResolutionSupported(): boolean {
  // Check if canvas and required APIs are available
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  return !!(ctx && canvas.toBlob && window.URL && window.URL.createObjectURL);
}