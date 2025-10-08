import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Download, Clock, RefreshCw } from 'lucide-react';
import { getExpiryStatusColor, needsUrgencyIndicator } from '@/services/image-lifecycle';

interface GalleryImage {
  id: number;
  url: string;
  prompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  created_at: string;
  user_id: string;
  model_id?: number;
}

interface ImageExpiry {
  timeLeftMinutes: number;
  timeLeftText: string;
  isExpired: boolean;
  expiresAt: Date;
  timeLeftMs: number;
}

interface ImageGridProps {
  images: GalleryImage[];
  viewMode: 'grid' | 'list';
  imageExpiries: Record<string, ImageExpiry>;
  downloadWithResolution: (imageUrl: string, resolution: '4K' | '1080p' | '720p' | 'original') => Promise<void>;
  handleExtendImageLife: (imageId: string, userId: string) => Promise<void>;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  viewMode,
  imageExpiries,
  downloadWithResolution,
  handleExtendImageLife,
}) => {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="group">
            <CardContent className="p-2">
              <div className="relative">
                <img
                  src={image.url}
                  alt={image.prompt || `Image ${image.id}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <Select>
                    <SelectTrigger asChild>
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original" onClick={() => downloadWithResolution(image.url, 'original')}>
                        Original Quality
                      </SelectItem>
                      <SelectItem value="4K" onClick={() => downloadWithResolution(image.url, '4K')}>
                        4K Ultra HD (3840x2160)
                      </SelectItem>
                      <SelectItem value="1080p" onClick={() => downloadWithResolution(image.url, '1080p')}>
                        1080p Full HD (1920x1080)
                      </SelectItem>
                      <SelectItem value="720p" onClick={() => downloadWithResolution(image.url, '720p')}>
                        720p HD (1280x720)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {image.prompt && (
                <p className="text-xs text-muted-foreground mt-2 truncate" title={image.prompt}>
                  {image.prompt}
                </p>
              )}
              {/* Expiry Information */}
              {imageExpiries[image.id] && (
                <div className="flex items-center justify-between mt-2">
                  <div className={`flex items-center gap-1 text-xs ${getExpiryStatusColor(imageExpiries[image.id].timeLeftMinutes)}`}>
                    <Clock className="w-3 h-3" />
                    <span>{imageExpiries[image.id].timeLeftText}</span>
                  </div>
                  {needsUrgencyIndicator(imageExpiries[image.id].timeLeftMinutes) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExtendImageLife(image.id.toString(), image.user_id)}
                      className="h-6 px-2 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      +1h
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {images.map((image) => (
        <Card key={image.id}>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={image.url}
                alt={image.prompt || `Image ${image.id}`}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-medium">Image #{image.id}</h4>
                <p className="text-sm text-muted-foreground">{image.prompt}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(image.created_at).toLocaleDateString()} •
                    Status: {image.status}
                  </p>
                  {imageExpiries[image.id] && (
                    <div className={`flex items-center gap-1 text-xs ${getExpiryStatusColor(imageExpiries[image.id].timeLeftMinutes)}`}>
                      <Clock className="w-3 h-3" />
                      <span>{imageExpiries[image.id].timeLeftText}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {imageExpiries[image.id] && needsUrgencyIndicator(imageExpiries[image.id].timeLeftMinutes) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExtendImageLife(image.id.toString(), image.user_id)}
                    className="h-8"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Extend +1h
                  </Button>
                )}
                <Select>
                  <SelectTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original" onClick={() => downloadWithResolution(image.url, 'original')}>
                      Original Quality
                    </SelectItem>
                    <SelectItem value="4K" onClick={() => downloadWithResolution(image.url, '4K')}>
                      4K Ultra HD (3840x2160)
                    </SelectItem>
                    <SelectItem value="1080p" onClick={() => downloadWithResolution(image.url, '1080p')}>
                      1080p Full HD (1920x1080)
                    </SelectItem>
                    <SelectItem value="720p" onClick={() => downloadWithResolution(image.url, '720p')}>
                      720p HD (1280x720)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ImageGrid;
