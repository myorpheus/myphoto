import { Badge } from '@/components/ui/badge';

interface GenerationOptionsProps {
  creditCost?: number;
  headshotCount?: number;
  quality?: string;
}

const GenerationOptions: React.FC<GenerationOptionsProps> = ({ 
  creditCost = 1, 
  headshotCount = 4, 
  quality = "High Quality" 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{creditCost} Credit</Badge>
        <span className="text-sm">Per generation</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{headshotCount} Headshots</Badge>
        <span className="text-sm">Different angles</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline">{quality}</Badge>
        <span className="text-sm">Professional results</span>
      </div>
    </div>
  );
};

export default GenerationOptions;