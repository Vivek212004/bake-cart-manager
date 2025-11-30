import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { VariationManager, ProductVariation } from "./VariationManager";

interface ProductFormData {
  name: string;
  description: string;
  base_price: string;
  category_id: string;
  is_sold_by_weight: boolean;
  egg_type: "egg" | "eggless" | "both";
  variations?: ProductVariation[];
  is_available?: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  categories: any[];
  onSubmit: (data: ProductFormData) => Promise<void>;
  submitLabel: string;
}

export const ProductForm = ({ initialData, categories, onSubmit, submitLabel }: ProductFormProps) => {
  const [formData, setFormData] = useState<ProductFormData>(
    initialData || {
      name: "",
      description: "",
      base_price: "",
      category_id: "",
      is_sold_by_weight: false,
      egg_type: "both",
      variations: [],
      is_available: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">
          {formData.is_sold_by_weight ? "Price per kg (₹)" : "Base Price (₹)"}
        </Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={formData.base_price}
          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="egg_type">Product Type</Label>
        <select
          id="egg_type"
          value={formData.egg_type}
          onChange={(e) => setFormData({ ...formData, egg_type: e.target.value as "egg" | "eggless" | "both" })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          <option value="both">Both (Egg & Eggless)</option>
          <option value="egg">Egg Only</option>
          <option value="eggless">Eggless Only</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="weight"
          checked={formData.is_sold_by_weight}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_sold_by_weight: checked as boolean })
          }
        />
        <Label htmlFor="weight" className="cursor-pointer">
          Sold by weight (per kg)
        </Label>
      </div>

      {initialData && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="available"
            checked={formData.is_available}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_available: checked as boolean })
            }
          />
          <Label htmlFor="available" className="cursor-pointer">
            Available for purchase
          </Label>
        </div>
      )}

      <VariationManager
        variations={formData.variations || []}
        onVariationsChange={(variations) => setFormData({ ...formData, variations })}
      />

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
};
