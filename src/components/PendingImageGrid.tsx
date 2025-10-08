/**
 * PendingImageGrid Component
 * Displays a grid of images with their current generation status
 * Shows completed images, skeleton loaders for pending images, and error states for failed images
 */

import { GeneratedImage } from '@/hooks/useHeadshotGenerator';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface PendingImageGridProps {
  images: GeneratedImage[];
  expectedCount?: number;
}

export const PendingImageGrid = ({ images, expectedCount = 4 }: PendingImageGridProps) => {
  // Create placeholders for images not yet started
  const placeholderCount = Math.max(0, expectedCount - images.length);
  const placeholders = Array(placeholderCount).fill(null);

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Generating Images ({images.filter(img => img.status === 'completed').length}/{expectedCount})
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image) => (
          <ImageCard key={image.id} image={image} />
        ))}

        {placeholders.map((_, index) => (
          <PlaceholderCard key={`placeholder-${index}`} />
        ))}
      </div>
    </div>
  );
};

interface ImageCardProps {
  image: GeneratedImage;
}

const ImageCard = ({ image }: ImageCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {image.status === 'completed' && image.url ? (
            <>
              <img
                src={image.url}
                alt="Generated headshot"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                <CheckCircle className="h-4 w-4" />
              </div>
            </>
          ) : image.status === 'generating' ? (
            <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating...</p>
            </div>
          ) : image.status === 'failed' ? (
            <div className="w-full h-full bg-destructive/10 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">Generation failed</p>
            </div>
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const PlaceholderCard = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
