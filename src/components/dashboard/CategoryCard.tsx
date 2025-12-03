import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FolderTree, Egg } from "lucide-react";

interface Category {
  id: string;
  name: string;
  display_order: number;
  parent_id?: string | null;
  has_egg_option?: boolean;
}

interface CategoryCardProps {
  category: Category;
  parentName?: string;
  subcategoriesCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({
  category,
  parentName,
  subcategoriesCount,
  onEdit,
  onDelete,
}: CategoryCardProps) {
  return (
    <Card className="hover-lift transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{category.name}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {parentName ? (
            <Badge variant="secondary" className="gap-1">
              <FolderTree className="h-3 w-3" />
              Subcategory of {parentName}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <FolderTree className="h-3 w-3" />
              Top-level
            </Badge>
          )}
          
          {category.has_egg_option && (
            <Badge variant="default" className="gap-1">
              <Egg className="h-3 w-3" />
              Egg Options
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Order: {category.display_order}</span>
          {subcategoriesCount > 0 && (
            <span>{subcategoriesCount} subcategories</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
