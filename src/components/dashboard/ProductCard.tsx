import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Trash2 } from "lucide-react";

interface ProductCardProps {
  product: any;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard = ({ product, isSelected, onSelect, onEdit, onDelete }: ProductCardProps) => {
  return (
    <Card className={isSelected ? "ring-2 ring-primary" : ""}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} className="mt-1" />
          <div className="flex-1">
            <CardTitle className="text-lg">{product.name}</CardTitle>
            <CardDescription>{product.categories?.name}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">
          ₹{product.base_price}{product.is_sold_by_weight ? "/kg" : ""}
        </p>
        <div className="flex gap-2 mt-2">
          {product.is_sold_by_weight && <Badge variant="secondary">Sold by weight</Badge>}
          {!product.is_available && <Badge variant="destructive">Unavailable</Badge>}
          {product.variations && product.variations.length > 0 && (
            <Badge variant="outline">{product.variations.length} variation{product.variations.length > 1 ? "s" : ""}</Badge>
          )}
        </div>
        {product.description && (
          <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
        )}
      </CardContent>
    </Card>
  );
};
