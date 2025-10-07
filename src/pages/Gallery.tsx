import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { downloadImageWithResolution, RESOLUTION_OPTIONS, isResolutionSupported } from '@/services/image-resolution';
import { calculateTimeLeft, getExpiryStatusColor, needsUrgencyIndicator, extendImageLife, imageLifecycleMonitor } from '@/services/image-lifecycle';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, Filter, Grid, List, Clock, RefreshCw } from 'lucide-react';

const Gallery = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [filteredImages, setFilteredImages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [pendingImages, setPendingImages] = useState<any[]>([]);
  const [imageExpiries, setImageExpiries] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGalleryData();
  }, []);

  useEffect(() => {
    filterAndSortImages();
  }, [images, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    // Calculate expiry info for all images
    const expiries: Record<string, any> = {};
    images.forEach(image => {
      if (image.status === 'completed') {
        const timeInfo = calculateTimeLeft(image.created_at);
        expiries[image.id] = timeInfo;
      }
    });
    setImageExpiries(expiries);

    // Set up real-time monitoring for expiring images
    const monitoringImages = images.filter(img => 
      img.status === 'completed' && 
      expiries[img.id] && 
      !expiries[img.id].isExpired &&
      expiries[img.id].timeLeftMinutes <= 30 // Monitor images with 30 minutes or less
    );

    // Clean up previous monitoring
    imageLifecycleMonitor.stopAll();

    // Start monitoring expiring images
    monitoringImages.forEach(image => {
      imageLifecycleMonitor.startMonitoring(image.id, image.user_id, (info) => {
        setImageExpiries(prev => ({
          ...prev,
          [image.id]: {
            expiresAt: new Date(info.expires_at),
            timeLeftMs: info.time_left_minutes * 60 * 1000,
            timeLeftMinutes: info.time_left_minutes,
            isExpired: info.is_expired,
            timeLeftText: info.time_left_minutes <= 0 ? 'Expired' : 
                         info.time_left_minutes < 1 ? '<1m left' :
                         `${info.time_left_minutes}m left`
          }
        }));

        // Refresh gallery if image expired
        if (info.is_expired) {
          loadGalleryData();
        }
      });
    });

    // Cleanup monitoring when component unmounts
    return () => {
      imageLifecycleMonitor.stopAll();
    };
  }, [images]);

  const loadGalleryData = async () => {
    try {
      const user = await completeSupabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Load all user images
      const allImages = await completeSupabaseService.getUserImages(user.id);
      setImages(allImages);
      
      // Separate pending images
      const pending = allImages.filter(img => img.status === 'generating' || img.status === 'training');
      setPendingImages(pending);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your gallery',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortImages = () => {
    let filtered = [...images];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.id.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(img => img.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'prompt':
          return (a.prompt || '').localeCompare(b.prompt || '');
        default:
          return 0;
      }
    });

    setFilteredImages(filtered);
  };

  const downloadWithResolution = async (imageUrl: string, resolution: '4K' | '1080p' | '720p' | 'original') => {
    try {
      // Check if browser supports resolution processing
      if (!isResolutionSupported() && resolution !== 'original') {
        toast({
          title: 'Resolution Not Supported',
          description: 'Your browser does not support image processing. Downloading original quality.',
          variant: 'destructive',
        });
        resolution = 'original';
      }

      await downloadImageWithResolution(imageUrl, resolution);
      
      const resolutionInfo = RESOLUTION_OPTIONS[resolution];
      toast({
        title: 'Download Started',
        description: `${resolutionInfo.label} download started successfully`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download image',
        variant: 'destructive',
      });
    }
  };

  const handleExtendImageLife = async (imageId: string, userId: string) => {
    try {
      await extendImageLife(imageId, userId);
      
      // Refresh the gallery to get updated timestamps
      await loadGalleryData();
      
      toast({
        title: 'Life Extended',
        description: 'Image life extended by 1 hour',
      });
    } catch (error) {
      console.error('Error extending image life:', error);
      toast({
        title: 'Extension Failed',
        description: error instanceof Error ? error.message : 'Failed to extend image life',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/overview')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Gallery</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Pending Images Section */}
        {pendingImages.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Pending Images ({pendingImages.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {pendingImages.map((image) => (
                  <div key={image.id} className="relative">
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                      {image.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by prompt or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="generating">Generating</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="prompt">By Prompt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Images Grid */}
        <div className="grid grid-cols-1 gap-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredImages.map((image) => (
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
                            onClick={() => handleExtendImageLife(image.id, image.user_id)}
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
          ) : (
            <div className="space-y-4">
              {filteredImages.map((image) => (
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
                            onClick={() => handleExtendImageLife(image.id, image.user_id)}
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
          )}
        </div>

        {filteredImages.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No Images Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Generate some headshots to see them here'
                  }
                </p>
                <Button onClick={() => navigate('/generate')}>
                  Generate Headshots
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Gallery;