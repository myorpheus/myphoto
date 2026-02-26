import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTrainModelData } from '@/hooks/useTrainModelData';
import TrainModelForm from '@/components/TrainModelForm';
import TrainingResults from '@/components/TrainingResults';

const TrainModel = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    models, astriaModels, selectedExistingModel, useExistingModel,
    isLoading, isLoadingAstriaModels, isTraining, selectedFiles,
    modelName, trainingProgress, setSelectedExistingModel, setUseExistingModel,
    setModelName, setSelectedFiles, handleFileSelect, handleTrainModel,
    loadUserModels, loadAstriaModels,
  } = useTrainModelData();

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
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("train.backToAdmin")}
            </Button>
            <h1 className="text-2xl font-bold">{t("train.title")}</h1>
            <Badge variant="secondary" className="ml-3">{t("train.adminOnly")}</Badge>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new">{t("train.trainNew")}</TabsTrigger>
            <TabsTrigger value="existing">{t("train.existing")} ({models.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("train.trainTitle")}</CardTitle>
                <CardDescription>{t("train.trainDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <TrainModelForm
                  astriaModels={astriaModels} selectedExistingModel={selectedExistingModel}
                  setSelectedExistingModel={setSelectedExistingModel} useExistingModel={useExistingModel}
                  setUseExistingModel={setUseExistingModel} modelName={modelName}
                  setModelName={setModelName} selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles} isTraining={isTraining}
                  trainingProgress={trainingProgress} handleFileSelect={handleFileSelect}
                  handleTrainModel={handleTrainModel}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="existing" className="space-y-6">
            <TrainingResults
              models={models} isLoading={isLoading}
              isLoadingAstriaModels={isLoadingAstriaModels}
              loadUserModels={loadUserModels} loadAstriaModels={loadAstriaModels}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainModel;
