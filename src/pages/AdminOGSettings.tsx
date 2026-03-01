import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabaseService } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Image, Link, Type, FileText, Upload, X, Globe } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const STORAGE_KEY = 'admin_og_settings';

interface OGSettings {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  favicon: string;
}

const AdminOGSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  const [faviconSource, setFaviconSource] = useState<'url' | 'upload'>('url');
  const [settings, setSettings] = useState<OGSettings>({
    ogTitle: '', ogDescription: '', ogImage: '', ogUrl: '', favicon: ''
  });

  useEffect(() => { checkAuthorization(); }, []);

  useEffect(() => {
    // Apply favicon dynamically
    if (settings.favicon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        || document.createElement('link');
      link.rel = 'icon';
      link.href = settings.favicon;
      if (!document.querySelector("link[rel~='icon']")) {
        document.head.appendChild(link);
      }
    }
  }, [settings.favicon]);

  const checkAuthorization = async () => {
    try {
      const user = await supabaseService.getCurrentUser();
      if (!user) { navigate('/login'); return; }
      const roles = await supabaseService.getUserRoles(user.id);
      const hasAdminAccess = roles.includes('admin') || roles.includes('super_admin');
      setIsAuthorized(hasAdminAccess);
      if (!hasAdminAccess) {
        toast({ title: 'Access Denied', description: 'You do not have permission to access this page', variant: 'destructive' });
        navigate('/home');
      } else { loadSettings(); }
    } catch (error) {
      console.error('Authorization error:', error);
      toast({ title: 'Error', description: 'Failed to verify permissions', variant: 'destructive' });
      navigate('/home');
    } finally { setIsLoading(false); }
  };

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsed }));
        if (parsed.ogImage?.startsWith('data:')) setImageSource('upload');
        if (parsed.favicon?.startsWith('data:')) setFaviconSource('upload');
      }
    } catch (error) { console.error('Error loading settings:', error); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast({ title: 'Settings Saved', description: 'OG & Favicon settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handleChange = (field: keyof OGSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'ogImage' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    const maxSize = field === 'favicon' ? 1 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: 'File too large', description: `Max ${field === 'favicon' ? '1MB' : '5MB'} allowed`, variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') handleChange(field, reader.result); };
    reader.readAsDataURL(file);
  };

  const clearField = (field: 'ogImage' | 'favicon') => {
    handleChange(field, '');
    if (field === 'ogImage' && fileInputRef.current) fileInputRef.current.value = '';
    if (field === 'favicon' && faviconInputRef.current) faviconInputRef.current.value = '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" /> OG & Branding Settings</CardTitle>
          <CardDescription>Configure Open Graph meta tags and favicon. Saved to localStorage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OG Title */}
          <div className="space-y-2">
            <Label htmlFor="ogTitle" className="flex items-center gap-2"><Type className="h-4 w-4" /> OG Title</Label>
            <Input id="ogTitle" placeholder="Enter OG title" value={settings.ogTitle} onChange={(e) => handleChange('ogTitle', e.target.value)} />
          </div>

          {/* OG Description */}
          <div className="space-y-2">
            <Label htmlFor="ogDescription" className="flex items-center gap-2"><FileText className="h-4 w-4" /> OG Description</Label>
            <Textarea id="ogDescription" placeholder="Enter OG description" value={settings.ogDescription} onChange={(e) => handleChange('ogDescription', e.target.value)} rows={3} />
          </div>

          {/* OG Image */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="h-4 w-4" /> OG Image</Label>
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" variant={imageSource === 'url' ? 'default' : 'outline'} onClick={() => { setImageSource('url'); clearField('ogImage'); }}>
                <Link className="mr-1 h-3 w-3" /> URL
              </Button>
              <Button type="button" size="sm" variant={imageSource === 'upload' ? 'default' : 'outline'} onClick={() => { setImageSource('upload'); clearField('ogImage'); }}>
                <Upload className="mr-1 h-3 w-3" /> Upload
              </Button>
            </div>
            {imageSource === 'url' ? (
              <Input id="ogImage" type="url" placeholder="https://example.com/image.jpg" value={settings.ogImage} onChange={(e) => handleChange('ogImage', e.target.value)} />
            ) : (
              <div className="space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'ogImage')} className="hidden" />
                {settings.ogImage ? (
                  <div className="relative rounded-md border border-border overflow-hidden">
                    <img src={settings.ogImage} alt="OG Upload" className="w-full max-h-48 object-cover" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={() => clearField('ogImage')}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full h-20 border-dashed" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-5 w-5" /> Upload image (max 5MB)
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Recommended: 1200×630px</p>
          </div>

          {/* OG URL */}
          <div className="space-y-2">
            <Label htmlFor="ogUrl" className="flex items-center gap-2"><Link className="h-4 w-4" /> OG URL</Label>
            <Input id="ogUrl" type="url" placeholder="https://myphoto.com" value={settings.ogUrl} onChange={(e) => handleChange('ogUrl', e.target.value)} />
          </div>

          <Separator />

          {/* Favicon Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Favicon</Label>
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" variant={faviconSource === 'url' ? 'default' : 'outline'} onClick={() => { setFaviconSource('url'); clearField('favicon'); }}>
                <Link className="mr-1 h-3 w-3" /> URL
              </Button>
              <Button type="button" size="sm" variant={faviconSource === 'upload' ? 'default' : 'outline'} onClick={() => { setFaviconSource('upload'); clearField('favicon'); }}>
                <Upload className="mr-1 h-3 w-3" /> Upload
              </Button>
            </div>
            {faviconSource === 'url' ? (
              <Input type="url" placeholder="https://example.com/favicon.ico" value={settings.favicon} onChange={(e) => handleChange('favicon', e.target.value)} />
            ) : (
              <div className="space-y-2">
                <input ref={faviconInputRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} className="hidden" />
                {settings.favicon ? (
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <img src={settings.favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                    <span className="text-sm text-muted-foreground">Favicon uploaded</span>
                    <Button type="button" size="icon" variant="destructive" className="ml-auto h-7 w-7" onClick={() => clearField('favicon')}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full h-16 border-dashed" onClick={() => faviconInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload favicon (max 1MB)
                  </Button>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground">Recommended: 32×32px or 64×64px .ico/.png</p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {(settings.ogTitle || settings.ogDescription || settings.ogImage) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How your OG tags might appear on social media</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-card">
              {settings.ogImage && (
                <div className="aspect-[1.91/1] bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                  <img src={settings.ogImage} alt="OG Preview" className="max-w-full max-h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">myphoto.com</p>
                <p className="font-semibold text-sm">{settings.ogTitle || 'Your OG Title'}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{settings.ogDescription || 'Your OG description will appear here...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminOGSettings;
