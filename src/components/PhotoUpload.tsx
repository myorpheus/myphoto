import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onPhotosSelected: (files: File[]) => void;
}

export const PhotoUpload = ({ onPhotosSelected }: PhotoUploadProps) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length === 0) return;
    
    // Validate file types
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/')
    );
    
    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Please upload only image files",
        variant: "destructive",
      });
    }
    
    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (files.length === 0) {
      toast({
        title: "No photos selected",
        description: "Please upload at least one photo",
        variant: "destructive",
      });
      return;
    }
    onPhotosSelected(files);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Upload Your Photos</h2>
        <p className="text-muted-foreground">
          Upload 4-10 photos for best results. Include different angles and expressions.
        </p>
      </div>

      <Card className="p-8 bg-card border-border shadow-[var(--shadow-card)]">
        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors bg-muted/30 hover:bg-muted/50"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">Click to upload photos</p>
          <p className="text-sm text-muted-foreground">
            or drag and drop your images here
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Selected Photos ({previews.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        {files.length > 0 && (
          <div className="mt-8 text-center">
            <Button
              size="lg"
              onClick={handleGenerate}
              className="bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]"
            >
              Generate Headshots ({files.length} photos)
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
