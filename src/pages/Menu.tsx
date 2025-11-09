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
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";

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
  const [weight, setWeight] = useState<string>("1");

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

  const filteredProducts = useMemo(
    () => (selectedCategory === "all" ? products : products.filter((p) => p.category_id === selectedCategory)),
    [products, selectedCategory]
  );

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(0)}`;
  };

  const handleAddToCart = (product: Product, variation?: string, price?: number, weightInKg?: number) => {
    const finalPrice = price || product.base_price;
    const variationText = weightInKg ? `${weightInKg} kg` : variation;
    addItem({
      product_id: product.id,
      name: product.name,
      price: finalPrice,
      variation: variationText,
      image_url: product.image_url_resolved || undefined,
    });
    toast.success(`${product.name} added to cart!`);
    setSelectedProduct(null);
    setSelectedVariation("");
    setWeight("1");
  };

  const openVariationDialog = (product: Product) => {
    if (product.is_sold_by_weight || (product.variations && typeof product.variations === "object")) {
      setSelectedProduct(product);
      setSelectedVariation("");
      setWeight("1");
    } else {
      handleAddToCart(product);
    }
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
                      {product.is_sold_by_weight ? (
                        <div>
                          <p className="text-2xl font-bold text-primary">{formatPrice(product.base_price)}/kg</p>
                        </div>
                      ) : product.variations && typeof product.variations === "object" ? (
                        <div className="text-sm">
                          <p className="font-semibold mb-1 text-muted-foreground">Available sizes:</p>
                          {Object.entries(product.variations).map(([size, price]) => (
                            <div key={size} className="flex justify-between">
                              <span className="text-foreground">{size}</span>
                              <span className="font-semibold text-primary">{formatPrice(Number(price))}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-primary">{formatPrice(product.base_price)}</p>
                      )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct?.is_sold_by_weight && (!selectedProduct?.variations || Object.keys(selectedProduct.variations).length === 0)
                ? `Enter Weight for ${selectedProduct?.name}`
                : `Select Option for ${selectedProduct?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {selectedProduct?.is_sold_by_weight && (!selectedProduct?.variations || Object.keys(selectedProduct.variations).length === 0) ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.6"
                    step="0.6"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight in kg"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Price:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice((selectedProduct?.base_price || 0) * parseFloat(weight || "0"))}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    const weightNum = parseFloat(weight);
                    if (weightNum > 0) {
                      handleAddToCart(
                        selectedProduct,
                        undefined,
                        selectedProduct.base_price * weightNum,
                        weightNum
                      );
                    } else {
                      toast.error("Please enter a valid weight");
                    }
                  }}
                >
                  Add to Cart
                </Button>
              </>
            ) : (
              selectedProduct?.variations &&
              typeof selectedProduct.variations === "object" &&
              Object.entries(selectedProduct.variations).map(([size, price]) => (
                <Button
                  key={size}
                  variant={selectedVariation === size ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => {
                    handleAddToCart(selectedProduct, size, Number(price));
                  }}
                >
                  <span>{size}</span>
                  <span>{formatPrice(Number(price))}</span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Menu;
