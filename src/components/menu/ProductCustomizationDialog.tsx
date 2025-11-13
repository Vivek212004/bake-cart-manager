import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  image_url_resolved?: string | null;
  is_available: boolean;
  variations: any;
  category_id: string;
  is_sold_by_weight: boolean;
}

interface ProductCustomizationDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    variation?: string,
    price?: number,
    weightInKg?: number
  ) => void;
}

export const ProductCustomizationDialog = ({
  product,
  open,
  onClose,
  onAddToCart,
}: ProductCustomizationDialogProps) => {
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>("");
  const [customWeight, setCustomWeight] = useState<string>("1");
  const [useCustomWeight, setUseCustomWeight] = useState<boolean>(false);

  const resetDialog = () => {
    setSelectedVariation("");
    setSelectedWeightOption("");
    setCustomWeight("1");
    setUseCustomWeight(false);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const calculateTotalPrice = () => {
    if (!product || !selectedVariation) return product?.base_price || 0;

    const selectedVar = product.variations?.find((v: any) => v.name === selectedVariation);
    if (!selectedVar) return product.base_price;

    const hasNestedVariations = selectedVar.variations && Array.isArray(selectedVar.variations);

    if (hasNestedVariations && selectedWeightOption) {
      const weightVar = selectedVar.variations.find((w: any) => w.weight === selectedWeightOption);
      return weightVar ? Number(weightVar.price) : product.base_price;
    }

    if (!hasNestedVariations) {
      const basePrice = Number(selectedVar.price) || product.base_price;
      const weightNum = useCustomWeight ? parseFloat(customWeight || "1") : 1;
      return basePrice * weightNum;
    }

    return Number(selectedVar.price) || product.base_price;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validation
    if (!selectedVariation) {
      toast.error("Please select a type (Egg/Eggless)");
      return;
    }

    const selectedVar = product.variations?.find((v: any) => v.name === selectedVariation);
    const hasNestedVariations = selectedVar?.variations && Array.isArray(selectedVar.variations);

    if (hasNestedVariations && !selectedWeightOption) {
      toast.error("Please select a weight option");
      return;
    }

    const weightNum = parseFloat(customWeight);
    if (!hasNestedVariations && useCustomWeight && weightNum <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    let finalPrice = product.base_price;
    let variationDetails = selectedVariation;
    let finalWeight = undefined;

    if (hasNestedVariations && selectedWeightOption) {
      const weightVar = selectedVar.variations.find((w: any) => w.weight === selectedWeightOption);
      if (weightVar) {
        finalPrice = Number(weightVar.price);
        variationDetails = `${selectedVariation} - ${selectedWeightOption}`;
      }
    } else if (!hasNestedVariations) {
      const basePrice = Number(selectedVar?.price) || product.base_price;
      if (useCustomWeight) {
        finalWeight = weightNum;
        finalPrice = basePrice * weightNum;
      } else {
        finalPrice = basePrice;
      }
    }

    onAddToCart(product, variationDetails, finalPrice, finalWeight);
    handleClose();
  };

  if (!product) return null;

  const selectedVar = product.variations?.find((v: any) => v.name === selectedVariation);
  const hasNestedVariations = selectedVar?.variations && Array.isArray(selectedVar.variations);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize {product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Step 1: Egg/Eggless Selection */}
          {product.variations && Array.isArray(product.variations) && product.variations.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Step 1: Select Type</Label>
              <RadioGroup
                value={selectedVariation}
                onValueChange={(value) => {
                  setSelectedVariation(value);
                  setSelectedWeightOption("");
                  setUseCustomWeight(false);
                  setCustomWeight("1");
                }}
              >
                {product.variations.map((variation: any) => {
                  const hasNested = variation.variations && Array.isArray(variation.variations);
                  const displayPrice = hasNested ? variation.variations[0]?.price : variation.price;

                  return (
                    <div
                      key={variation.name}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={variation.name} id={variation.name} />
                        <Label htmlFor={variation.name} className="cursor-pointer font-normal">
                          {variation.name}
                        </Label>
                      </div>
                      {displayPrice && (
                        <span className="font-semibold text-primary">
                          {hasNested ? "from " : ""}
                          {formatPrice(Number(displayPrice))}
                          {!hasNested && product.is_sold_by_weight && (
                            <span className="text-sm text-muted-foreground">/kg</span>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Weight/Price Selection (if nested variations exist) */}
          {selectedVariation && hasNestedVariations && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Step 2: Select Weight & Price</Label>
              <RadioGroup value={selectedWeightOption} onValueChange={setSelectedWeightOption}>
                {selectedVar.variations.map((weightVar: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={`${weightVar.weight}`} id={`weight-${idx}`} />
                      <Label htmlFor={`weight-${idx}`} className="cursor-pointer font-normal">
                        {weightVar.weight}
                      </Label>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatPrice(Number(weightVar.price))}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 3: Custom Weight Option (for products sold by weight without nested variations) */}
          {selectedVariation && !hasNestedVariations && product.is_sold_by_weight && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Step {hasNestedVariations ? "3" : "2"}: Customize Weight (Optional)
              </Label>
              <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customize-weight"
                    checked={useCustomWeight}
                    onCheckedChange={(checked) => {
                      setUseCustomWeight(checked as boolean);
                      if (!checked) setCustomWeight("1");
                    }}
                  />
                  <Label htmlFor="customize-weight" className="cursor-pointer">
                    Enter Custom Weight
                  </Label>
                </div>

                {useCustomWeight && (
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm text-muted-foreground">
                      Weight (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={customWeight}
                      onChange={(e) => setCustomWeight(e.target.value)}
                      placeholder="Enter weight in kg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Price per kg: {formatPrice(Number(selectedVar?.price) || product.base_price)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Price Display */}
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
            <span className="text-sm font-medium text-foreground">Total Price:</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(calculateTotalPrice())}
            </span>
          </div>

          {/* Add to Cart Button */}
          <Button className="w-full" size="lg" onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
