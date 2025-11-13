import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null; // original DB value
  image_url_resolved?: string | null; // resolved public URL (computed)
  is_available: boolean;
  variations: any;
  category_id: string;
  is_sold_by_weight: boolean;
}

const PLACEHOLDER = "/placeholder.png"; // provide this file in public/ or change path

const Menu = () => {
  const { addItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>("");
  const [selectedWeightOption, setSelectedWeightOption] = useState<string>("");
  const [weight, setWeight] = useState<string>("1");
  const [useCustomWeight, setUseCustomWeight] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [eggFilter, setEggFilter] = useState<string>("all"); // "all", "egg", "eggless"

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true);

      if (productsError) throw productsError;

      // Resolve image URLs:
      const parsed = (productsData || []).map((p: any) => {
        const prod: Product = {
          ...p,
          image_url: p.image_url ? String(p.image_url).trim().replace(/^["']|["']$/g, "") : null,
          image_url_resolved: null,
        };

        // If the DB already has a full http(s) URL, use it directly
        if (prod.image_url && /^https?:\/\//i.test(prod.image_url)) {
          prod.image_url_resolved = prod.image_url;
        } else if (prod.image_url) {
          // Otherwise assume it's a storage path and build public URL using Supabase helper.
          // NOTE: replace 'products' with your actual storage bucket name if different.
          try {
            const { data } = supabase.storage.from("products").getPublicUrl(prod.image_url);
            prod.image_url_resolved = data?.publicUrl ?? null;
          } catch (err) {
            console.warn("Failed to resolve storage public url for", prod.image_url, err);
            prod.image_url_resolved = null;
          }
        } else {
          prod.image_url_resolved = null;
        }

        return prod;
      });

      setProducts(parsed);
    } catch (error: any) {
      toast.error("Failed to load menu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = selectedCategory === "all" ? products : products.filter((p) => p.category_id === selectedCategory);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => 
        p.name.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply egg/eggless filter
    if (eggFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (!p.variations || !Array.isArray(p.variations)) return true;
        return p.variations.some((v: any) => 
          v.name.toLowerCase() === eggFilter.toLowerCase()
        );
      });
    }
    
    return filtered;
  }, [products, selectedCategory, searchQuery, eggFilter]);

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(0)}`;
  };

  const handleAddToCart = (product: Product, variation?: string, price?: number, weightInKg?: number) => {
    const finalPrice = price || product.base_price;
    let variationText = variation;
    if (weightInKg && variation) {
      variationText = `${variation} - ${weightInKg} kg`;
    } else if (weightInKg) {
      variationText = `${weightInKg} kg`;
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: finalPrice,
      variation: variationText,
      image_url: product.image_url_resolved || undefined,
      weight: weightInKg,
    });
    toast.success(`${product.name} added to cart!`);
    setSelectedProduct(null);
    setSelectedVariation("");
    setWeight("1");
    setUseCustomWeight(false);
  };

  const openVariationDialog = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariation("");
    setSelectedWeightOption("");
    setWeight("1");
    setUseCustomWeight(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <p className="text-center text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Menu</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our wide selection of freshly baked goods, made with love and the finest ingredients
          </p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto gap-2 bg-secondary/30 p-2">
            <TabsTrigger value="all" className="whitespace-nowrap">All Items</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="whitespace-nowrap">
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Egg/Eggless Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter by:</span>
              <div className="flex gap-2">
                <Badge
                  variant={eggFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEggFilter("all")}
                >
                  All
                </Badge>
                <Badge
                  variant={eggFilter === "egg" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEggFilter("egg")}
                >
                  Egg
                </Badge>
                <Badge
                  variant={eggFilter === "eggless" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setEggFilter("eggless")}
                >
                  Eggless
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image (conditional) */}
                  {product.image_url_resolved ? (
                    <div className="w-full h-48 bg-gray-100">
                      <img
                        src={product.image_url_resolved}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // fallback to placeholder on any load error
                          (e.currentTarget as HTMLImageElement).src = PLACEHOLDER;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                      <img src={PLACEHOLDER} alt="placeholder" className="w-full h-48 object-cover" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <Badge variant={product.is_available ? "default" : "secondary"}>
                        {product.is_available ? "Available" : "Out of Stock"}
                      </Badge>
                    </div>
                    {product.description && (
                      <CardDescription className="text-sm">{product.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(product.base_price)}
                        {product.is_sold_by_weight && <span className="text-base text-muted-foreground">/kg</span>}
                      </p>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      disabled={!product.is_available}
                      onClick={() => openVariationDialog(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No products found in this category</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customize {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Variations Selection (Egg/Eggless) */}
            {selectedProduct?.variations && Array.isArray(selectedProduct.variations) && selectedProduct.variations.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Type</Label>
                <RadioGroup 
                  value={selectedVariation} 
                  onValueChange={(value) => {
                    setSelectedVariation(value);
                    setSelectedWeightOption(""); // Reset weight selection when changing type
                  }}
                >
                  {selectedProduct.variations.map((variation: any) => {
                    const hasNestedVariations = variation.variations && Array.isArray(variation.variations);
                    const displayPrice = hasNestedVariations 
                      ? variation.variations[0]?.price 
                      : variation.price;
                    
                    return (
                      <div key={variation.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={variation.name} id={variation.name} />
                          <Label htmlFor={variation.name} className="cursor-pointer font-normal">
                            {variation.name}
                          </Label>
                        </div>
                        {displayPrice && (
                          <span className="font-semibold text-primary">
                            {hasNestedVariations ? 'from ' : ''}{formatPrice(Number(displayPrice))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            )}

            {/* Weight Options (if nested variations exist) */}
            {selectedVariation && selectedProduct?.variations && (() => {
              const selectedVar = selectedProduct.variations.find((v: any) => v.name === selectedVariation);
              const hasNestedVariations = selectedVar?.variations && Array.isArray(selectedVar.variations);
              
              if (hasNestedVariations) {
                return (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Weight</Label>
                    <RadioGroup value={selectedWeightOption} onValueChange={setSelectedWeightOption}>
                      {selectedVar.variations.map((weightVar: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 transition-colors">
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
                );
              }
              return null;
            })()}

            {/* Custom Weight Option (for products sold by weight without nested variations) */}
            {selectedProduct?.is_sold_by_weight && selectedVariation && (() => {
              const selectedVar = selectedProduct.variations?.find((v: any) => v.name === selectedVariation);
              const hasNestedVariations = selectedVar?.variations && Array.isArray(selectedVar.variations);
              
              if (!hasNestedVariations) {
                return (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="customize-weight"
                        checked={useCustomWeight}
                        onCheckedChange={(checked) => {
                          setUseCustomWeight(checked as boolean);
                          if (!checked) setWeight("1");
                        }}
                      />
                      <Label htmlFor="customize-weight" className="cursor-pointer">
                        Customize Weight
                      </Label>
                    </div>

                    {useCustomWeight && (
                      <div className="space-y-2 pl-6">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="Enter weight in kg"
                        />
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Price Display */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Price:</span>
              <span className="text-2xl font-bold text-primary">
                {(() => {
                  if (!selectedVariation) return formatPrice(selectedProduct?.base_price || 0);
                  
                  const selectedVar = selectedProduct?.variations?.find((v: any) => v.name === selectedVariation);
                  if (!selectedVar) return formatPrice(selectedProduct?.base_price || 0);

                  const hasNestedVariations = selectedVar.variations && Array.isArray(selectedVar.variations);
                  
                  // If has nested weight variations, use the selected weight option price
                  if (hasNestedVariations && selectedWeightOption) {
                    const weightVar = selectedVar.variations.find((w: any) => w.weight === selectedWeightOption);
                    return weightVar ? formatPrice(Number(weightVar.price)) : formatPrice(selectedProduct?.base_price || 0);
                  }
                  
                  // Otherwise, use the variation price multiplied by custom weight
                  if (!hasNestedVariations) {
                    const basePrice = Number(selectedVar.price) || selectedProduct?.base_price || 0;
                    const weightNum = useCustomWeight ? parseFloat(weight || "1") : 1;
                    return formatPrice(basePrice * weightNum);
                  }
                  
                  return formatPrice(Number(selectedVar.price) || selectedProduct?.base_price || 0);
                })()}
              </span>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              onClick={() => {
                // Validation
                if (!selectedVariation) {
                  toast.error("Please select a type (Egg/Eggless)");
                  return;
                }

                const selectedVar = selectedProduct?.variations?.find((v: any) => v.name === selectedVariation);
                const hasNestedVariations = selectedVar?.variations && Array.isArray(selectedVar.variations);

                // If has nested variations, must select a weight option
                if (hasNestedVariations && !selectedWeightOption) {
                  toast.error("Please select a weight option");
                  return;
                }

                // If custom weight is enabled, validate it
                const weightNum = parseFloat(weight);
                if (!hasNestedVariations && useCustomWeight && weightNum <= 0) {
                  toast.error("Please enter a valid weight");
                  return;
                }

                let finalPrice = selectedProduct?.base_price || 0;
                let variationDetails = selectedVariation;
                let finalWeight = undefined;

                // Calculate price based on selection type
                if (hasNestedVariations && selectedWeightOption) {
                  const weightVar = selectedVar.variations.find((w: any) => w.weight === selectedWeightOption);
                  if (weightVar) {
                    finalPrice = Number(weightVar.price);
                    variationDetails = `${selectedVariation} - ${selectedWeightOption}`;
                  }
                } else if (!hasNestedVariations) {
                  const basePrice = Number(selectedVar?.price) || selectedProduct?.base_price || 0;
                  if (useCustomWeight) {
                    finalWeight = weightNum;
                    finalPrice = basePrice * weightNum;
                  } else {
                    finalPrice = basePrice;
                  }
                }

                handleAddToCart(
                  selectedProduct!,
                  variationDetails,
                  finalPrice,
                  finalWeight
                );
                
                // Reset dialog state
                setSelectedProduct(null);
                setSelectedVariation("");
                setSelectedWeightOption("");
                setUseCustomWeight(false);
                setWeight("1");
              }}
            >
              Add to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Menu;
