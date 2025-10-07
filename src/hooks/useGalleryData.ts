import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { completeSupabaseService } from '@/services/supabase-complete';
import { calculateTimeLeft, imageLifecycleMonitor } from '@/services/image-lifecycle';
import { downloadImageWithResolution, isResolutionSupported, RESOLUTION_OPTIONS } from '@/services/image-resolution';
import { extendImageLife } from '@/services/image-lifecycle';

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
  expiryDate: Date;
}

interface UseGalleryDataResult {
  isLoading: boolean;
  images: GalleryImage[];
  filteredImages: GalleryImage[];
  pendingImages: GalleryImage[];
  imageExpiries: Record<string, ImageExpiry>;
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
  viewMode: 'grid' | 'list';
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (sortBy: string) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  loadGalleryData: () => Promise<void>;
  downloadWithResolution: (imageUrl: string, resolution: '4K' | '1080p' | '720p' | 'original') => Promise<void>;
  handleExtendImageLife: (imageId: string, userId: string) => Promise<void>;
}

export const useGalleryData = (): UseGalleryDataResult => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [pendingImages, setPendingImages] = useState<GalleryImage[]>([]);
  const [imageExpiries, setImageExpiries] = useState<Record<string, ImageExpiry>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load gallery data
  const loadGalleryData = async () => {
    try {
      const user = await completeSupabaseService.getCurrentUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      const userImages = await completeSupabaseService.getUserImages(user.id);
      
      const pending = userImages.filter((img: GalleryImage) => 
        img.status === 'generating' || img.status === 'pending'
      );
      
      setImages(userImages);
      setPendingImages(pending);
    } catch (error) {
      console.error('Error loading gallery:', error);
      toast({
        title: 'Error',
        description: 'Failed to load gallery images',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort images
  useEffect(() => {
    let filtered = images.filter((img: GalleryImage) => img.status === 'completed');

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((img: GalleryImage) =>
        img.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.id.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((img: GalleryImage) => img.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'prompt') {
      filtered.sort((a, b) => (a.prompt || '').localeCompare(b.prompt || ''));
    }

    setFilteredImages(filtered);
  }, [images, searchTerm, statusFilter, sortBy]);

  // Monitor image expiries
  useEffect(() => {
    const completedImages = images.filter((img: GalleryImage) => img.status === 'completed');
    const expiries: Record<string, ImageExpiry> = {};

    completedImages.forEach((img: GalleryImage) => {
      const expiry = calculateTimeLeft(img.created_at);
      expiries[img.id] = expiry;
    });

    setImageExpiries(expiries);

    const cleanup = imageLifecycleMonitor(completedImages, (updatedExpiries) => {
      setImageExpiries(updatedExpiries);
    });

    return cleanup;
  }, [images]);

  // Download with resolution
  const downloadWithResolution = async (imageUrl: string, resolution: '4K' | '1080p' | '720p' | 'original') => {
    try {
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

  // Extend image life
  const handleExtendImageLife = async (imageId: string, userId: string) => {
    try {
      await extendImageLife(imageId, userId);
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

  // Load data on mount
  useEffect(() => {
    loadGalleryData();
  }, []);

  return {
    isLoading,
    images,
    filteredImages,
    pendingImages,
    imageExpiries,
    searchTerm,
    statusFilter,
    sortBy,
    viewMode,
    setSearchTerm,
    setStatusFilter,
    setSortBy,
    setViewMode,
    loadGalleryData,
    downloadWithResolution,
    handleExtendImageLife,
  };
};
