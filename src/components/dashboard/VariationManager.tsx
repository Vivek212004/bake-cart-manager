import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

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
  const [jsonInput, setJsonInput] = useState("");

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

  const handleJsonImport = () => {
    if (!jsonInput.trim()) {
      toast.error("Please enter JSON data");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const variationsArray = Array.isArray(parsed) ? parsed : [parsed];
      
      const importedVariations: ProductVariation[] = variationsArray.map((v: any) => ({
        id: v.id || crypto.randomUUID(),
        name: v.name || "",
        price_adjustment: typeof v.price_adjustment === "number" ? v.price_adjustment : parseFloat(v.price_adjustment) || 0,
      })).filter((v: ProductVariation) => v.name);

      if (importedVariations.length === 0) {
        toast.error("No valid variations found in JSON");
        return;
      }

      onVariationsChange([...variations, ...importedVariations]);
      setJsonInput("");
      toast.success(`Imported ${importedVariations.length} variation(s)`);
    } catch (error) {
      toast.error("Invalid JSON format. Expected: [{\"name\": \"500g\", \"price_adjustment\": 50}]");
    }
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

        {/* JSON Import Section */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Import from JSON</Label>
          <Textarea
            placeholder='[{"name": "500g", "price_adjustment": 50}, {"name": "1kg", "price_adjustment": 150}]'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            rows={3}
            className="font-mono text-sm"
          />
          <Button type="button" onClick={handleJsonImport} className="w-full" variant="secondary">
            <Upload className="h-4 w-4 mr-2" />
            Import JSON Variations
          </Button>
        </div>

        {/* Manual Add Section */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-muted-foreground">Or add manually</Label>
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
