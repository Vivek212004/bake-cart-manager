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
  pricing_type: "unit" | "per_kg" | "fixed_weight";
  price_display_unit: string;
  egg_type: "egg" | "eggless" | "both" | "none";
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
      pricing_type: "unit",
      price_display_unit: "",
      egg_type: "both",
      variations: [],
      is_available: true,
    }
  );

  const handlePricingTypeChange = (value: "unit" | "per_kg" | "fixed_weight") => {
    const isSoldByWeight = value === "per_kg";
    let defaultDisplayUnit = "";
    
    switch (value) {
      case "unit":
        defaultDisplayUnit = "per piece";
        break;
      case "per_kg":
        defaultDisplayUnit = "per kg";
        break;
      case "fixed_weight":
        defaultDisplayUnit = "per pack";
        break;
    }
    
    setFormData({ 
      ...formData, 
      pricing_type: value, 
      is_sold_by_weight: isSoldByWeight,
      price_display_unit: formData.price_display_unit || defaultDisplayUnit
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const getPriceLabel = () => {
    switch (formData.pricing_type) {
      case "unit":
        return "Price per Unit (₹)";
      case "per_kg":
        return "Price per kg (₹)";
      case "fixed_weight":
        return "Base Price (₹)";
      default:
        return "Price (₹)";
    }
  };

  const getPriceHint = () => {
    switch (formData.pricing_type) {
      case "unit":
        return "Price for a single item (e.g., 1 cookie, 1 burger)";
      case "per_kg":
        return "Price per kilogram - customers can order custom weights";
      case "fixed_weight":
        return "Use variations below to set prices for different weight options (e.g., 250g, 500g, 1kg)";
      default:
        return "";
    }
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
        <Label htmlFor="pricing_type">Pricing Type</Label>
        <Select
          value={formData.pricing_type}
          onValueChange={(value) => handlePricingTypeChange(value as "unit" | "per_kg" | "fixed_weight")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select pricing type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unit">Per Unit (e.g., per piece, per item)</SelectItem>
            <SelectItem value="per_kg">Per Kilogram (custom weight orders)</SelectItem>
            <SelectItem value="fixed_weight">Fixed Weight Packages (e.g., 250g, 500g packs)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{getPriceHint()}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">{getPriceLabel()}</Label>
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
        <Label htmlFor="price_display_unit">Price Display Label (Optional)</Label>
        <Input
          id="price_display_unit"
          value={formData.price_display_unit}
          onChange={(e) => setFormData({ ...formData, price_display_unit: e.target.value })}
          placeholder={formData.pricing_type === "unit" ? "per piece" : formData.pricing_type === "per_kg" ? "per kg" : "per 250g pack"}
        />
        <p className="text-xs text-muted-foreground">
          How the price unit will be shown (e.g., "per piece", "per 250g", "per pack")
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          required
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            {/* Top-level categories */}
            {categories
              .filter((c) => !c.parent_id)
              .sort((a, b) => a.display_order - b.display_order)
              .map((category) => {
                const subcategories = categories.filter((c) => c.parent_id === category.id);
                return (
                  <div key={category.id}>
                    <SelectItem value={category.id} className="font-semibold">
                      {category.name}
                    </SelectItem>
                    {subcategories
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((sub) => (
                        <SelectItem key={sub.id} value={sub.id} className="pl-8">
                          ↳ {sub.name}
                        </SelectItem>
                      ))}
                  </div>
                );
              })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="egg_type">Egg/Eggless Option</Label>
        <Select
          value={formData.egg_type}
          onValueChange={(value) => setFormData({ ...formData, egg_type: value as "egg" | "eggless" | "both" | "none" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select egg type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Not applicable)</SelectItem>
            <SelectItem value="both">Both (Egg & Eggless available)</SelectItem>
            <SelectItem value="egg">Egg Only</SelectItem>
            <SelectItem value="eggless">Eggless Only</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select "None" for products where egg/eggless option is not relevant
        </p>
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