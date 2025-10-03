import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download } from "lucide-react";

interface HeadshotGalleryProps {
  images: string[];
  onDownload: (imageUrl: string) => void;
  onStartNew: () => void;
}

export const HeadshotGallery = ({ images, onDownload, onStartNew }: HeadshotGalleryProps) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Your Professional Headshots</h2>
        <p className="text-muted-foreground">
          Choose your favorites and download in high resolution
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {images.map((image, index) => (
          <Card key={index} className="overflow-hidden bg-card border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow)] transition-all group">
            <div className="relative">
              <img
                src={image}
                alt={`Headshot ${index + 1}`}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <Button
                  onClick={() => onDownload(image)}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          size="lg"
          onClick={onStartNew}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Generate More Headshots
        </Button>
      </div>
    </div>
  );
};
