import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabaseService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Image, Link, Type, FileText, Upload, X } from 'lucide-react';

const STORAGE_KEY = 'admin_og_settings';

interface OGSettings {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
}

const AdminOGSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [settings, setSettings] = useState<OGSettings>({
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogUrl: ''
  });

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const roles = await supabaseService.getUserRoles(user.id);
      const hasAdminAccess = roles.includes('admin') || roles.includes('super_admin');
      setIsAuthorized(hasAdminAccess);
      if (!hasAdminAccess) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive'
        });
        navigate('/home');
      } else {
        loadSettings();
      }
    } catch (error) {
      console.error('Authorization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify permissions',
        variant: 'destructive'
      });
      navigate('/home');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
        if (parsed.ogImage?.startsWith('data:')) {
          setImageSource('upload');
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({
        title: 'Settings Saved',
        description: 'OG settings have been saved to localStorage'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof OGSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB allowed', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleChange('ogImage', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    handleChange('ogImage', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Admin Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            OG Settings
          </CardTitle>
          <CardDescription>
            Configure Open Graph meta tags for social media sharing. These settings are saved to localStorage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OG Title */}
          <div className="space-y-2">
            <Label htmlFor="ogTitle" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              OG Title
            </Label>
            <Input
              id="ogTitle"
              placeholder="Enter OG title"
              value={settings.ogTitle}
              onChange={(e) => handleChange('ogTitle', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The title that appears when your site is shared on social media
            </p>
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <Label htmlFor="ogDescription" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              OG Description
            </Label>
            <Textarea
              id="ogDescription"
              placeholder="Enter OG description"
              value={settings.ogDescription}
              onChange={(e) => handleChange('ogDescription', e.target.value)}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              The description that appears when your site is shared on social media
            </p>
          </div>

          {/* OG Image - URL or Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              OG Image
            </Label>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                size="sm"
                variant={imageSource === 'url' ? 'default' : 'outline'}
                onClick={() => { setImageSource('url'); clearImage(); }}
              >
                <Link className="mr-1 h-3 w-3" /> URL
              </Button>
              <Button
                type="button"
                size="sm"
                variant={imageSource === 'upload' ? 'default' : 'outline'}
                onClick={() => { setImageSource('upload'); clearImage(); }}
              >
                <Upload className="mr-1 h-3 w-3" /> Upload
              </Button>
            </div>

            {imageSource === 'url' ? (
              <Input
                id="ogImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={settings.ogImage}
                onChange={(e) => handleChange('ogImage', e.target.value)}
              />
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {settings.ogImage ? (
                  <div className="relative rounded-md border border-border overflow-hidden">
                    <img src={settings.ogImage} alt="OG Upload" className="w-full max-h-48 object-cover" />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Click to upload image (max 5MB)
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Recommended: 1200×630px. Upload or paste a URL.
            </p>
          </div>

          {/* OG URL */}
          <div className="space-y-2">
            <Label htmlFor="ogUrl" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              OG URL
            </Label>
            <Input
              id="ogUrl"
              type="url"
              placeholder="https://myphoto.com"
              value={settings.ogUrl}
              onChange={(e) => handleChange('ogUrl', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The canonical URL of the page being shared
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {(settings.ogTitle || settings.ogDescription || settings.ogImage) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How your OG tags might appear on social media
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-card">
              {settings.ogImage && (
                <div className="aspect-[1.91/1] bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                  <img
                    src={settings.ogImage}
                    alt="OG Preview"
                    className="max-w-full max-h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">
                  myphoto.com
                </p>
                <p className="font-semibold text-sm">
                  {settings.ogTitle || 'Your OG Title'}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {settings.ogDescription || 'Your OG description will appear here...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOGSettings;
