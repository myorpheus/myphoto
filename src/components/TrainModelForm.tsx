import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Zap, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface TrainModelFormProps {
  astriaModels: any[];
  selectedExistingModel: any | null;
  setSelectedExistingModel: (model: any) => void;
  useExistingModel: boolean;
  setUseExistingModel: (use: boolean) => void;
  modelName: string;
  setModelName: (name: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  isTraining: boolean;
  trainingProgress: number;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleTrainModel: () => void;
}

const TrainModelForm: React.FC<TrainModelFormProps> = ({
  astriaModels,
  selectedExistingModel,
  setSelectedExistingModel,
  useExistingModel,
  setUseExistingModel,
  modelName,
  setModelName,
  selectedFiles,
  isTraining,
  trainingProgress,
  handleFileSelect,
  handleTrainModel,
}) => {
  return (
    <div className="space-y-6">
      {/* Model Selection Options */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Model Options</Label>
        <div className="flex gap-4">
          <Button
            variant={!useExistingModel ? 'default' : 'outline'}
            onClick={() => setUseExistingModel(false)}
            disabled={isTraining}
          >
            Create New Model
          </Button>
          <Button
            variant={useExistingModel ? 'default' : 'outline'}
            onClick={() => setUseExistingModel(true)}
            disabled={isTraining || astriaModels.length === 0}
          >
            Use Existing Model ({astriaModels.length})
          </Button>
        </div>
      </div>

      {/* Existing Model Selection */}
      {useExistingModel && astriaModels.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="existingModel" className="text-sm font-medium">
            Select Existing Model
          </Label>
          <Select
            value={selectedExistingModel?.id?.toString() || ''}
            onValueChange={(value) => {
              const model = astriaModels.find((m) => m.id?.toString() === value);
              setSelectedExistingModel(model);
            }}
            disabled={isTraining}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose an existing model..." />
            </SelectTrigger>
            <SelectContent>
              {astriaModels.map((model) => (
                <SelectItem key={model.id} value={model.id?.toString() || ''}>
                  <div className="flex items-center gap-2">
                    <span>{model.name || `Model ${model.id}`}</span>
                    {model.name && model.name.toLowerCase().includes('newheadhotman') && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedExistingModel && (
            <div className="text-xs text-muted-foreground">
              Status: {selectedExistingModel.status} • Last Updated:{' '}
              {selectedExistingModel.updated_at ? new Date(selectedExistingModel.updated_at).toLocaleDateString() : 'Unknown'}
            </div>
          )}
        </div>
      )}

      {/* Model Name - only show when creating new model */}
      {!useExistingModel && (
        <div className="space-y-2">
          <label htmlFor="modelName" className="text-sm font-medium">
            Model Name
          </label>
          <Input
            id="modelName"
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Enter model name (e.g., Professional Headshots v2)"
            disabled={isTraining}
          />
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Training Photos (4-20 images)</label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center space-y-4">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Upload Training Photos</p>
              <p className="text-sm text-muted-foreground">Select 4-20 high-quality photos for optimal results</p>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={isTraining}
            />
            <Button onClick={() => document.getElementById('photo-upload')?.click()} disabled={isTraining}>
              Choose Photos
            </Button>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Selected {selectedFiles.length} photos:</p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <Badge key={index} variant="outline">
                  {file.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Training Progress */}
      {isTraining && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Training Progress</span>
            <span>{trainingProgress}%</span>
          </div>
          <Progress value={trainingProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">Training your model... This may take several minutes.</p>
        </div>
      )}

      {/* Action Button */}
      <Button
        onClick={handleTrainModel}
        disabled={
          isTraining ||
          (useExistingModel
            ? !selectedExistingModel || (selectedExistingModel.status && selectedExistingModel.status !== 'trained' && selectedExistingModel.status !== 'finished')
            : !modelName.trim() || selectedFiles.length < 4)
        }
        className="w-full"
        size="lg"
      >
        {isTraining ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            {useExistingModel ? 'Adding Model...' : 'Training Model...'}
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            {useExistingModel ? 'Add Existing Model' : 'Start Training'}
          </>
        )}
      </Button>
    </div>
  );
};

export default TrainModelForm;
