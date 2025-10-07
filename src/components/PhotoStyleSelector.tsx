import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface PhotoStyleSelectorProps {
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  selectedGender: string;
  setSelectedGender: (gender: string) => void;
}

const PhotoStyleSelector: React.FC<PhotoStyleSelectorProps> = ({
  selectedStyle,
  setSelectedStyle,
  selectedGender,
  setSelectedGender,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Choose Your Photo Style</h3>
      <RadioGroup
        value={selectedStyle}
        onValueChange={setSelectedStyle}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
          <RadioGroupItem value="professional" id="professional" />
          <Label htmlFor="professional" className="cursor-pointer flex-1">
            <div>
              <div className="font-medium">Professional/Corporate</div>
              <div className="text-sm text-muted-foreground">Full face frontal headshot, perfect for LinkedIn and business</div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
          <RadioGroupItem value="doctor" id="doctor" />
          <Label htmlFor="doctor" className="cursor-pointer flex-1">
            <div>
              <div className="font-medium">Doctor/Medical</div>
              <div className="text-sm text-muted-foreground">Professional medical headshot, ideal for healthcare professionals</div>
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
          <RadioGroupItem value="boudoir" id="boudoir" />
          <Label htmlFor="boudoir" className="cursor-pointer flex-1">
            <div>
              <div className="font-medium">Boudoir/Artistic</div>
              <div className="text-sm text-muted-foreground">Mid-body artistic shot with tasteful styling</div>
            </div>
          </Label>
        </div>
      </RadioGroup>

      {/* Gender Selection for Boudoir */}
      {selectedStyle === 'boudoir' && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Select Gender for Styling</h4>
          <RadioGroup
            value={selectedGender}
            onValueChange={setSelectedGender}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="man" id="man" />
              <Label htmlFor="man">Man (shirtless styling)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="woman" id="woman" />
              <Label htmlFor="woman">Woman (elegant lingerie)</Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
};

export default PhotoStyleSelector;