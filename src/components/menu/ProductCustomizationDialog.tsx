import { useState } from "react";
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
  min_weight_grams?: number;
  allow_custom_weight?: boolean;
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

type NormalizedVariation = {
  _id: string;
  name: string;
  price?: number;
  weight_grams?: number;
  variations?: any[];
  [key: string]: any;
};

// Check if variations are weight-based (new format with weight_grams)
const isWeightBasedVariations = (variations: any[]): boolean => {
  return variations.length > 0 && variations[0]?.weight_grams !== undefined;
};

// Format weight from grams to display string
const formatWeightFromGrams = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)}kg`;
  }
  return `${grams}g`;
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
      _id: String(item.id ?? item.weight_grams ?? name ?? idx),
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
}: ProductCustomizationDialogProps) => {
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>("");
  const [customWeight, setCustomWeight] = useState<string>("");
  const [useCustomWeight, setUseCustomWeight] = useState<boolean>(false);
  const [reviewsKey, setReviewsKey] = useState(0);

  const variationsArray = getVariationsArray(product);
  const isWeightBased = product?.is_sold_by_weight && variationsArray.length > 0 && isWeightBasedVariations(variationsArray);
  const minWeightKg = product?.min_weight_grams ? product.min_weight_grams / 1000 : 0.25;

  const resetDialog = () => {
    setSelectedVariation("");
    setSelectedWeightOption("");
    setCustomWeight("");
    setUseCustomWeight(false);
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
    if (!product) return 0;

    // New weight-based format
    if (isWeightBased) {
      if (useCustomWeight && customWeight) {
        const weightKg = parseFloat(customWeight);
        if (!isNaN(weightKg) && weightKg > 0) {
          return product.base_price * weightKg;
        }
      } else if (selectedWeightOption) {
        const weightVar = variationsArray.find((v) => v._id === selectedWeightOption);
        if (weightVar?.price) return weightVar.price;
      }
      return product.base_price * minWeightKg;
    }

    // Original variation format
    if (!selectedVariation || !selectedVar)
      return product.base_price;

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

    // New weight-based format
    if (isWeightBased) {
      let finalPrice = product.base_price * minWeightKg;
      let variationDetails: string | undefined;
      let finalWeight: number | undefined;

      if (useCustomWeight && customWeight) {
        const weightKg = parseFloat(customWeight);
        if (isNaN(weightKg) || weightKg <= 0 || weightKg < minWeightKg) {
          toast.error(`Please enter a valid weight (minimum ${minWeightKg}kg)`);
          return;
        }
        finalWeight = weightKg;
        finalPrice = product.base_price * weightKg;
        variationDetails = `${weightKg}kg`;
      } else if (selectedWeightOption) {
        const weightVar = variationsArray.find((v) => v._id === selectedWeightOption);
        if (weightVar) {
          finalWeight = weightVar.weight_grams / 1000;
          finalPrice = weightVar.price;
          variationDetails = formatWeightFromGrams(weightVar.weight_grams);
        }
      } else {
        toast.error("Please select a weight option or enter custom weight");
        return;
      }

      onAddToCart(product, variationDetails, finalPrice, finalWeight);
      handleClose();
      return;
    }

    // Original variation format handling
    if (!selectedVariation || !selectedVar) {
      toast.error("Please select a type (Egg/Eggless / Size / Weight)");
      return;
    }

    if (hasNestedVariations && !selectedWeightOption) {
      toast.error("Please select a weight option");
      return;
    }

    let finalPrice = product.base_price;
    let variationDetails: string | undefined = selectedVariation;
    let finalWeight: number | undefined = undefined;

    const perKgPrice = getPerKgPrice();

    if (product.is_sold_by_weight && useCustomWeight && perKgPrice != null) {
      const weightNum = parseFloat(customWeight);
      if (isNaN(weightNum) || weightNum <= 0) {
        toast.error("Please enter a valid weight");
        return;
      }
      finalWeight = weightNum;
      finalPrice = perKgPrice * weightNum;
      variationDetails = hasNestedVariations
        ? `${selectedVariation} - Custom ${weightNum}kg`
        : `${selectedVariation} - ${weightNum}kg`;
    } else if (hasNestedVariations && selectedWeightOption && selectedVar.variations) {
      const weightVar = selectedVar.variations.find(
        (w: any) => w.weight === selectedWeightOption
      );
      if (weightVar) {
        finalPrice = Number(weightVar.price);
        finalWeight = parseWeightToKg(weightVar.weight) ?? undefined;
        variationDetails = `${selectedVariation} - ${selectedWeightOption}`;
      }
    } else if (!hasNestedVariations) {
      const basePrice = Number(selectedVar.price) || product.base_price;
      finalPrice = basePrice;
    }

    onAddToCart(product, variationDetails, finalPrice, finalWeight);
    handleClose();
  };

  if (!product) return null;

  const shouldShowCustomWeight =
    product.is_sold_by_weight &&
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
            {/* New weight-based product format */}
            {isWeightBased && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    Select Weight
                  </Label>
                  <RadioGroup
                    value={selectedWeightOption}
                    onValueChange={(value) => {
                      setSelectedWeightOption(value);
                      setUseCustomWeight(false);
                      setCustomWeight("");
                    }}
                  >
                    {variationsArray.map((variation) => (
                      <div
                        key={variation._id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem
                            value={variation._id}
                            id={variation._id}
                          />
                          <Label
                            htmlFor={variation._id}
                            className="cursor-pointer font-normal"
                          >
                            {formatWeightFromGrams(variation.weight_grams)}
                          </Label>
                        </div>
                        <span className="font-semibold text-primary">
                          {formatPrice(variation.price)}
                        </span>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {product.allow_custom_weight && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Or Enter Custom Weight
                    </Label>
                    <div className="space-y-3 p-4 border rounded-lg bg-accent/5">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="customize-weight"
                          checked={useCustomWeight}
                          onCheckedChange={(checked) => {
                            setUseCustomWeight(checked as boolean);
                            if (checked) {
                              setSelectedWeightOption("");
                              setCustomWeight(minWeightKg.toString());
                            } else {
                              setCustomWeight("");
                            }
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
                            Weight (kg) - Minimum: {minWeightKg}kg
                          </Label>
                          <Input
                            id="weight"
                            type="number"
                            min={minWeightKg}
                            step="0.25"
                            value={customWeight}
                            onChange={(e) => setCustomWeight(e.target.value)}
                            placeholder={`Enter weight (min ${minWeightKg}kg)`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Price per kg: {formatPrice(product.base_price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Original variation format */}
            {!isWeightBased && (
              <>
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
                          id="customize-weight-old"
                          checked={useCustomWeight}
                          onCheckedChange={(checked) => {
                            setUseCustomWeight(checked as boolean);
                            if (!checked) setCustomWeight("1");
                          }}
                        />
                        <Label
                          htmlFor="customize-weight-old"
                          className="cursor-pointer"
                        >
                          Enter Custom Weight
                        </Label>
                      </div>

                      {useCustomWeight && (
                        <div className="space-y-2">
                          <Label
                            htmlFor="weight-old"
                            className="text-sm text-muted-foreground"
                          >
                            Weight (kg)
                          </Label>
                          <Input
                            id="weight-old"
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
              </>
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
