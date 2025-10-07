// src/components/TrainingProgress.tsx
import { Progress } from '@/components/ui/progress';

interface TrainingProgressProps {
  trainingProgress: number;
}

const TrainingProgress = ({ trainingProgress }: TrainingProgressProps) => {
  if (trainingProgress === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Training Progress</span>
        <span>{trainingProgress}%</span>
      </div>
      <Progress value={trainingProgress} className="w-full" />
    </div>
  );
};

export default TrainingProgress;
