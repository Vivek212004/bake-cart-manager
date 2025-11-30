import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export interface ProductVariation {
  id: string;
  name: string;
  price_adjustment: number;
}

interface VariationManagerProps {
  variations: ProductVariation[];
  onVariationsChange: (variations: ProductVariation[]) => void;
}

export const VariationManager = ({ variations, onVariationsChange }: VariationManagerProps) => {
  const [newVariation, setNewVariation] = useState({ name: "", price_adjustment: "" });

  const handleAddVariation = () => {
    if (!newVariation.name || !newVariation.price_adjustment) return;

    const variation: ProductVariation = {
      id: crypto.randomUUID(),
      name: newVariation.name,
      price_adjustment: parseFloat(newVariation.price_adjustment),
    };

    onVariationsChange([...variations, variation]);
    setNewVariation({ name: "", price_adjustment: "" });
  };

  const handleRemoveVariation = (id: string) => {
    onVariationsChange(variations.filter((v) => v.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Product Variations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variations.length > 0 && (
          <div className="space-y-2">
            {variations.map((variation) => (
              <div key={variation.id} className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{variation.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {variation.price_adjustment >= 0 ? "+" : ""}₹{variation.price_adjustment}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveVariation(variation.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="var-name">Variation Name</Label>
            <Input
              id="var-name"
              placeholder="e.g., 500g, Medium, Chocolate"
              value={newVariation.name}
              onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="var-price">Price Adjustment (₹)</Label>
            <Input
              id="var-price"
              type="number"
              step="0.01"
              placeholder="e.g., 50 or -20"
              value={newVariation.price_adjustment}
              onChange={(e) => setNewVariation({ ...newVariation, price_adjustment: e.target.value })}
            />
          </div>
          <Button type="button" onClick={handleAddVariation} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Variation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
