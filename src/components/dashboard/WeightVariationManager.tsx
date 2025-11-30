import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export interface WeightVariation {
  id: string;
  weight_grams: number;
  price: number;
}

interface WeightVariationManagerProps {
  pricePerKg: number;
  variations: WeightVariation[];
  minWeightGrams: number;
  allowCustomWeight: boolean;
  onVariationsChange: (variations: WeightVariation[]) => void;
  onMinWeightChange: (minWeight: number) => void;
  onAllowCustomWeightChange: (allow: boolean) => void;
}

export const WeightVariationManager = ({
  pricePerKg,
  variations,
  minWeightGrams,
  allowCustomWeight,
  onVariationsChange,
  onMinWeightChange,
  onAllowCustomWeightChange,
}: WeightVariationManagerProps) => {
  const [newWeight, setNewWeight] = useState("");

  const calculatePrice = (grams: number) => {
    return ((grams / 1000) * pricePerKg).toFixed(2);
  };

  const handleAddWeight = () => {
    const grams = parseFloat(newWeight);
    if (!grams || grams <= 0) return;

    const variation: WeightVariation = {
      id: crypto.randomUUID(),
      weight_grams: grams,
      price: parseFloat(calculatePrice(grams)),
    };

    onVariationsChange([...variations, variation].sort((a, b) => a.weight_grams - b.weight_grams));
    setNewWeight("");
  };

  const handleRemoveWeight = (id: string) => {
    onVariationsChange(variations.filter((v) => v.id !== id));
  };

  const formatWeight = (grams: number) => {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)}kg`;
    }
    return `${grams}g`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weight Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="min-weight">Minimum Weight (grams)</Label>
          <Input
            id="min-weight"
            type="number"
            step="1"
            value={minWeightGrams}
            onChange={(e) => onMinWeightChange(parseFloat(e.target.value) || 0)}
            placeholder="e.g., 250"
          />
          <p className="text-xs text-muted-foreground">
            Starting weight for custom selections
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="custom-weight"
            checked={allowCustomWeight}
            onCheckedChange={(checked) => onAllowCustomWeightChange(checked as boolean)}
          />
          <Label htmlFor="custom-weight" className="cursor-pointer">
            Allow customers to select custom weight
          </Label>
        </div>

        {variations.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <Label className="text-sm font-medium">Predefined Weight Options</Label>
            {variations.map((variation) => (
              <div key={variation.id} className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{formatWeight(variation.weight_grams)}</p>
                  <p className="text-sm text-muted-foreground">₹{variation.price.toFixed(2)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveWeight(variation.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="weight-input">Add Weight Option (grams)</Label>
            <div className="flex gap-2">
              <Input
                id="weight-input"
                type="number"
                step="1"
                placeholder="e.g., 250, 500, 1000"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
              />
              <Button type="button" onClick={handleAddWeight} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {newWeight && parseFloat(newWeight) > 0 && (
              <p className="text-xs text-muted-foreground">
                Price: ₹{calculatePrice(parseFloat(newWeight))} for {formatWeight(parseFloat(newWeight))}
              </p>
            )}
          </div>
        </div>

        <div className="bg-muted p-3 rounded-md text-xs space-y-1">
          <p className="font-medium">Quick Add Common Weights:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {[250, 500, 750, 1000, 1500, 2000].map((weight) => (
              <Button
                key={weight}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const variation: WeightVariation = {
                    id: crypto.randomUUID(),
                    weight_grams: weight,
                    price: parseFloat(calculatePrice(weight)),
                  };
                  onVariationsChange([...variations, variation].sort((a, b) => a.weight_grams - b.weight_grams));
                }}
                disabled={variations.some((v) => v.weight_grams === weight)}
              >
                {formatWeight(weight)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
