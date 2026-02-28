import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid, List } from 'lucide-react';
import { useGalleryData } from '@/hooks/useGalleryData';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import FilterBar from '@/components/FilterBar';
import ImageGrid from '@/components/ImageGrid';

const TEST_IMAGE = '/test_nano_banana.jpg';

const Gallery = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    isLoading, filteredImages, pendingImages, imageExpiries,
    searchTerm, statusFilter, sortBy, viewMode,
    setSearchTerm, setStatusFilter, setSortBy, setViewMode,
    downloadWithResolution, handleExtendImageLife,
  } = useGalleryData();

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
            <Button variant="ghost" onClick={() => navigate('/home')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>
            <h1 className="text-2xl font-bold">{t("gallery.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Test Image Display */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Test Image</h3>
            <div className="flex justify-center">
              <img 
                src={TEST_IMAGE} 
                alt="Test Nano Banana" 
                className="max-w-md rounded-lg shadow-lg"
              />
            </div>
          </CardContent>
        </Card>

        {pendingImages.length > 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">{t("gallery.pending")} ({pendingImages.length})</h3>
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

        <FilterBar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          sortBy={sortBy} setSortBy={setSortBy}
        />

        <ImageGrid
          images={filteredImages} viewMode={viewMode}
          imageExpiries={imageExpiries}
          downloadWithResolution={downloadWithResolution}
          handleExtendImageLife={handleExtendImageLife}
        />

        {filteredImages.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">{t("gallery.noImages")}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? t("gallery.noImagesHint")
                    : t("gallery.noImagesEmpty")
                  }
                </p>
                <Button onClick={() => navigate('/generate')}>
                  {t("gallery.generateHeadshots")}
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
