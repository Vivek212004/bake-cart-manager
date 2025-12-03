import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  display_order: number;
  parent_id?: string | null;
  has_egg_option?: boolean;
}

interface CategoryFormProps {
  categories: Category[];
  initialData?: {
    name: string;
    display_order: number;
    parent_id: string | null;
    has_egg_option: boolean;
  };
  onSubmit: (data: any) => void;
  submitLabel?: string;
  editingCategoryId?: string;
}

export function CategoryForm({
  categories,
  initialData,
  onSubmit,
  submitLabel = "Add Category",
  editingCategoryId,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    display_order: initialData?.display_order || 0,
    parent_id: initialData?.parent_id || null,
    has_egg_option: initialData?.has_egg_option || false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        display_order: initialData.display_order,
        parent_id: initialData.parent_id,
        has_egg_option: initialData.has_egg_option,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Filter categories to only show top-level (no parent) as potential parents
  // Also exclude the current category being edited to prevent circular references
  const topLevelCategories = categories.filter(
    (c) => !c.parent_id && c.id !== editingCategoryId
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Cakes, Regular Flavours"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent_id">Parent Category (Optional)</Label>
        <Select
          value={formData.parent_id || "none"}
          onValueChange={(value) =>
            setFormData({ ...formData, parent_id: value === "none" ? null : value })
          }
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select parent category (or leave empty for top-level)" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="none">No Parent (Top-level category)</SelectItem>
            {topLevelCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Leave empty for a main category, or select a parent to create a subcategory
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">Display Order</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
          }
          placeholder="0"
        />
        <p className="text-sm text-muted-foreground">
          Lower numbers appear first in the menu
        </p>
      </div>

      <div className="flex items-center justify-between space-x-2 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="has_egg_option">Has Egg/Eggless Options</Label>
          <p className="text-sm text-muted-foreground">
            Enable egg filter for products in this category
          </p>
        </div>
        <Switch
          id="has_egg_option"
          checked={formData.has_egg_option}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, has_egg_option: checked })
          }
        />
      </div>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
