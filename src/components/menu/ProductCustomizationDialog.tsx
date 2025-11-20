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
  variations?: any[];
  [key: string]: any;
};

// Helper: turn whatever is in product.variations into a nice array
const getVariationsArray = (product?: Product | null): NormalizedVariation[] => {
  if (!product?.variations) return [];

  let list: any[] = [];
  const v = product.variations;

  if (Array.isArray(v)) {
    list = v;
  } else if (typeof v === "object") {
    // object like { Egg: {...}, Eggless: {...} }
    list = Object.entries(v).map(([key, value]) => ({
      name: key,
      ...(value as any),
    }));
  } else {
    return [];
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
  const [reviewsKey, setReviewsKey] = useState(0);

  const variationsArray = getVariationsArray(product);

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

  const selectedVar = variationsArray.find(
    (v) => v.name === selectedVariation
  );
  const hasNestedVariations =
    selectedVar?.variations && Array.isArray(selectedVar.variations);

  const calculateTotalPrice = () => {
    if (!product || !selectedVariation || !selectedVar)
      return product?.base_price || 0;

    if (hasNestedVariations && selectedWeightOption) {
      const weightVar = selectedVar.variations!.find(
        (w: any) => w.weight === selectedWeightOption
      );
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

    if (!selectedVariation || !selectedVar) {
      toast.error("Please select a type (Egg/Eggless)");
      return;
    }

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
    let variationDetails: string | undefined = selectedVariation;
    let finalWeight: number | undefined = undefined;

    if (hasNestedVariations && selectedWeightOption) {
      const weightVar = selectedVar.variations!.find(
        (w: any) => w.weight === selectedWeightOption
      );
      if (weightVar) {
        finalPrice = Number(weightVar.price);
        variationDetails = `${selectedVariation} - ${selectedWeightOption}`;
      }
    } else if (!hasNestedVariations) {
      const basePrice = Number(selectedVar.price) || product.base_price;
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
            {/* Step 1: Egg/Eggless Selection */}
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
                        {displayPrice && (
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

            {/* Step 2: Weight/Price Selection (if nested variations exist) */}
            {selectedVariation && hasNestedVariations && selectedVar && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Step 2: Select Weight & Price
                </Label>
                <RadioGroup
                  value={selectedWeightOption}
                  onValueChange={setSelectedWeightOption}
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

            {/* Step 3: Custom Weight Option (for products sold by weight without nested variations) */}
            {selectedVariation && !hasNestedVariations && product.is_sold_by_weight && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Step 2: Customize Weight (Optional)
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
                      <p className="text-xs text-muted-foreground">
                        Price per kg:{" "}
                        {formatPrice(
                          Number(selectedVar?.price) || product.base_price
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total Price Display */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <span className="text-sm font-medium text-foreground">
                Total Price:
              </span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(calculateTotalPrice())}
              </span>
            </div>

            {/* Add to Cart Button */}
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
