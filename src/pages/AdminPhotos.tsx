import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSupabaseService } from '@/services/supabase-complete';
import { ArrowLeft, Loader2, RefreshCw, ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// Configure the base URL where nginx serves /var/www/myphoto/
const PHOTO_SERVER_BASE_URL = import.meta.env.VITE_PHOTO_SERVER_URL || 'https://myphoto.lovable.app/photos';

const AdminPhotos = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [baseUrl, setBaseUrl] = useState(PHOTO_SERVER_BASE_URL);
  const [manualUrls, setManualUrls] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const user = await completeSupabaseService.getCurrentUser();
    if (!user) { navigate('/login'); return; }
    const admin = await completeSupabaseService.isAdmin(user.id);
    if (!admin) { navigate('/home'); return; }
    setIsLoading(false);
  };

  const loadPhotosFromIndex = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch an index.json or directory listing from the server
      const res = await fetch(`${baseUrl}/index.json`);
      if (res.ok) {
        const data = await res.json();
        const urls = (data.files || data || []).map((f: string) =>
          f.startsWith('http') ? f : `${baseUrl}/${f}`
        );
        setPhotos(urls);
        toast({ title: `Loaded ${urls.length} photos` });
      } else {
        toast({ title: 'No index.json found', description: 'Add photo URLs manually or create an index.json on your server.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to connect to photo server', description: 'Check the server URL and CORS settings.', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [baseUrl]);

  const addManualUrls = () => {
    const urls = manualUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length) {
      setPhotos(prev => [...prev, ...urls]);
      setManualUrls('');
      toast({ title: `Added ${urls.length} photos` });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-lg font-bold text-foreground">Server Photos</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Config section */}
        <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Photo Server</h2>
          <div className="flex gap-3 flex-wrap">
            <Input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="https://yourserver.com/myphoto"
              className="flex-1 min-w-[250px]"
            />
            <Button onClick={loadPhotosFromIndex} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Load from server
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Or paste photo URLs (one per line):</label>
            <textarea
              value={manualUrls}
              onChange={e => setManualUrls(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-input/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://yourserver.com/myphoto/photo1.jpg"
            />
            <Button variant="secondary" size="sm" onClick={addManualUrls}>Add URLs</Button>
          </div>
        </Card>

        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">No photos loaded</p>
            <p className="text-sm">Load from server or add URLs manually above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {photos.map((url, i) => (
              <div
                key={`${url}-${i}`}
                onClick={() => setSelectedPhoto(url)}
                className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border/30 hover:border-primary/50 transition-all duration-200"
              >
                <img
                  src={url}
                  alt={`Server photo ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <img
                src={selectedPhoto}
                alt="Full size"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 hover:bg-card transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-foreground" />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPhoto(null)}
                  className="bg-card/80 backdrop-blur-sm border border-border/50"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPhotos;
