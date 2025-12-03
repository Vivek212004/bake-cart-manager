import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReviewForm } from "@/components/reviews/ReviewForm";

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
  pricing_type?: "unit" | "per_kg" | "fixed_weight";
  price_display_unit?: string;
  egg_type?: "egg" | "eggless" | "both";
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
  eggFilter?: string;
}

type NormalizedVariation = {
  _id: string;
  name: string;
  price?: number;
  variations?: any[];
  [key: string]: any;
};

// Normalize all supported variation formats into a uniform array
const getVariationsArray = (product?: Product | null): NormalizedVariation[] => {
  if (!product?.variations) return [];

  const v = product.variations;
  let list: any[] = [];

  if (Array.isArray(v)) {
    // Case 1: already an array
    list = v;
  } else if (typeof v === "object") {
    // Case 2 & 3: { "Small": 50 } or { "1kg": 50 } or { "Egg": { ... } }
    list = Object.entries(v).map(([key, value]) => {
      if (typeof value === "number") {
        // { "Small": 50 } -> { name: "Small", price: 50 }
        return { name: key, price: value };
      }
      // { "Egg": { variations: [...] } } -> { name: "Egg", variations: [...] }
      return { name: key, ...(value as any) };
    });
  }

  return list.map((item, idx) => {
    const name =
      item.name ??
      item.type ??
      item.label ??
      item.title ??
      `Option ${idx + 1}`;

    return {
      ...item,
      name,
      _id: String(item.id ?? name ?? idx),
    };
  });
};

// Parse "250g", "500g", "1kg", "1.5kg" -> kg
const parseWeightToKg = (weight: string | undefined): number | null => {
  if (!weight) return null;
  const trimmed = weight.trim().toLowerCase();
  const match = trimmed.match(/([\d.]+)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (trimmed.includes("kg")) return value;
  if (trimmed.includes("g")) return value / 1000;
  return value; // assume kg if no unit
};

export const ProductCustomizationDialog = ({
  product,
  open,
  onClose,
  onAddToCart,
  eggFilter,
}: ProductCustomizationDialogProps) => {
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>("");
  const [customWeight, setCustomWeight] = useState<string>("1");
  const [useCustomWeight, setUseCustomWeight] = useState<boolean>(false);
  const [reviewsKey, setReviewsKey] = useState(0);
  const [selectedEggOption, setSelectedEggOption] = useState<string>("");

  const variationsArray = getVariationsArray(product);
  
  // Determine if we need to show egg/eggless selection
  const productEggType = product?.egg_type || "both";
  const showEggSelection = productEggType === "both";
  
  // If filter is applied and product has both, pre-select based on filter
  const getDefaultEggOption = () => {
    if (productEggType !== "both") return productEggType;
    if (eggFilter === "egg" || eggFilter === "eggless") return eggFilter;
    return "";
  };

  // Initialize egg option when dialog opens
  useEffect(() => {
    if (open && product) {
      setSelectedEggOption(getDefaultEggOption());
    }
  }, [open, product, eggFilter]);

  const resetDialog = () => {
    setSelectedVariation("");
    setSelectedWeightOption("");
    setCustomWeight("1");
    setUseCustomWeight(false);
    setSelectedEggOption(getDefaultEggOption());
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const selectedVar = variationsArray.find(
    (v) => v.name === selectedVariation
  );
  const hasNestedVariations =
    selectedVar?.variations && Array.isArray(selectedVar.variations);

  // Helper: get per-kg price based on selected option
  const getPerKgPrice = (): number | undefined => {
    if (!product?.is_sold_by_weight || !selectedVar) return undefined;

    if (hasNestedVariations && selectedWeightOption && selectedVar.variations) {
      const weightVar = selectedVar.variations.find(
        (w: any) => w.weight === selectedWeightOption
      );
      if (!weightVar) return undefined;
      const wKg = parseWeightToKg(weightVar.weight);
      if (!wKg) return undefined;
      return Number(weightVar.price) / wKg;
    }

    if (!hasNestedVariations && selectedVar.price != null) {
      // Here price is already per-kg
      return Number(selectedVar.price);
    }

    return undefined;
  };

  const calculateTotalPrice = () => {
    if (!product || !selectedVariation || !selectedVar)
      return product?.base_price || 0;

    const perKgPrice = getPerKgPrice();

    if (product.is_sold_by_weight && useCustomWeight && perKgPrice != null) {
      const weightNum = parseFloat(customWeight || "1");
      if (isNaN(weightNum) || weightNum <= 0) return product.base_price;
      return perKgPrice * weightNum;
    }

    if (hasNestedVariations && selectedWeightOption && selectedVar.variations) {
      const weightVar = selectedVar.variations.find(
        (w: any) => w.weight === selectedWeightOption
      );
      return weightVar ? Number(weightVar.price) : product.base_price;
    }

    if (!hasNestedVariations) {
      const basePrice = Number(selectedVar.price) || product.base_price;
      return basePrice;
    }

    return Number(selectedVar.price) || product.base_price;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate egg selection if needed
    if (showEggSelection && !selectedEggOption) {
      toast.error("Please select Egg or Eggless option");
      return;
    }

    if (variationsArray.length > 0 && (!selectedVariation || !selectedVar)) {
      toast.error("Please select a variation");
      return;
    }

    if (hasNestedVariations && !selectedWeightOption) {
      toast.error("Please select a weight option");
      return;
    }

    let finalPrice = product.base_price;
    let variationDetails: string | undefined = "";
    let finalWeight: number | undefined = undefined;

    // Add egg option to variation details
    const eggLabel = showEggSelection ? selectedEggOption : (product.egg_type === "egg" || product.egg_type === "eggless" ? product.egg_type : "");
    
    const perKgPrice = getPerKgPrice();

    if (product.is_sold_by_weight && useCustomWeight && perKgPrice != null) {
      const weightNum = parseFloat(customWeight);
      if (isNaN(weightNum) || weightNum <= 0) {
        toast.error("Please enter a valid weight");
        return;
      }
      finalWeight = weightNum;
      finalPrice = perKgPrice * weightNum;
      const parts = [eggLabel, selectedVariation, `Custom ${weightNum}kg`].filter(Boolean);
      variationDetails = parts.join(" - ");
    } else if (hasNestedVariations && selectedWeightOption && selectedVar?.variations) {
      const weightVar = selectedVar.variations.find(
        (w: any) => w.weight === selectedWeightOption
      );
      if (weightVar) {
        finalPrice = Number(weightVar.price);
        finalWeight = parseWeightToKg(weightVar.weight) ?? undefined;
        const parts = [eggLabel, selectedVariation, selectedWeightOption].filter(Boolean);
        variationDetails = parts.join(" - ");
      }
    } else if (variationsArray.length > 0 && selectedVar) {
      finalPrice = Number(selectedVar.price) || product.base_price;
      const parts = [eggLabel, selectedVariation].filter(Boolean);
      variationDetails = parts.join(" - ");
    } else {
      // No variations, just egg option
      variationDetails = eggLabel || undefined;
    }

    onAddToCart(product, variationDetails || undefined, finalPrice, finalWeight);
    handleClose();
  };

  if (!product) return null;

  const shouldShowCustomWeight =
    (product.pricing_type === "per_kg" || product.is_sold_by_weight) &&
    selectedVariation &&
    (!hasNestedVariations || (hasNestedVariations && !!selectedWeightOption));

  const perKgPriceForDisplay = getPerKgPrice();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="customize" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customize">Customize Order</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="customize" className="space-y-6 pt-4">
            {/* Egg/Eggless Selection */}
            {showEggSelection && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Select Egg/Eggless
                </Label>
                <RadioGroup
                  value={selectedEggOption}
                  onValueChange={setSelectedEggOption}
                >
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="egg" id="egg-option" />
                      <Label htmlFor="egg-option" className="cursor-pointer font-normal">
                        With Egg
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="eggless" id="eggless-option" />
                      <Label htmlFor="eggless-option" className="cursor-pointer font-normal">
                        Eggless
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 1: Type / Size / Weight label selection */}
            {variationsArray.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Step 1: Select Type
                </Label>
                <RadioGroup
                  value={selectedVariation}
                  onValueChange={(value) => {
                    setSelectedVariation(value);
                    setSelectedWeightOption("");
                    setUseCustomWeight(false);
                    setCustomWeight("1");
                  }}
                >
                  {variationsArray.map((variation) => {
                    const hasNested =
                      variation.variations &&
                      Array.isArray(variation.variations);
                    const displayPrice = hasNested
                      ? variation.variations[0]?.price
                      : variation.price;

                    return (
                      <div
                        key={variation._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem
                            value={variation.name}
                            id={variation._id}
                          />
                          <Label
                            htmlFor={variation._id}
                            className="cursor-pointer font-normal"
                          >
                            {variation.name}
                          </Label>
                        </div>
                        {displayPrice != null && (
                          <span className="font-semibold text-primary">
                            {hasNested ? "from " : ""}
                            {formatPrice(Number(displayPrice))}
                            {!hasNested && product.is_sold_by_weight && (
                              <span className="text-sm text-muted-foreground">
                                /kg
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Weight/Price selection for nested variations */}
            {selectedVariation && hasNestedVariations && selectedVar && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Step 2: Select Weight & Price
                </Label>
                <RadioGroup
                  value={selectedWeightOption}
                  onValueChange={(value) => {
                    setSelectedWeightOption(value);
                    // keep custom weight toggle as user set it
                  }}
                >
                  {selectedVar.variations!.map((weightVar: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem
                          value={`${weightVar.weight}`}
                          id={`weight-${idx}`}
                        />
                        <Label
                          htmlFor={`weight-${idx}`}
                          className="cursor-pointer font-normal"
                        >
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

            {/* Custom weight (for both nested & simple per-kg products) */}
            {shouldShowCustomWeight && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  {hasNestedVariations ? "Step 3: Customize Weight (Optional)" : "Step 2: Customize Weight (Optional)"}
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
                    <Label
                      htmlFor="customize-weight"
                      className="cursor-pointer"
                    >
                      Enter Custom Weight
                    </Label>
                  </div>

                  {useCustomWeight && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="weight"
                        className="text-sm text-muted-foreground"
                      >
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
                      {perKgPriceForDisplay != null && (
                        <p className="text-xs text-muted-foreground">
                          Price per kg (based on selected option):{" "}
                          {formatPrice(perKgPriceForDisplay)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total price */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm font-medium text-foreground">
                Total Price:
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(calculateTotalPrice())}
              </span>
            </div>

            {/* Add to cart */}
            <Button className="w-full" size="lg" onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6 pt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                <ReviewForm
                  productId={product.id}
                  productName={product.name}
                  onReviewSubmitted={() => setReviewsKey((prev) => prev + 1)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Customer Reviews</h3>
                <ReviewsList key={reviewsKey} productId={product.id} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
