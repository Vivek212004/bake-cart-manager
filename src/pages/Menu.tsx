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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { ProductCustomizationDialog } from "@/components/menu/ProductCustomizationDialog";
import { StarRating } from "@/components/reviews/StarRating";
import { Star } from "lucide-react";

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
  image_url: string | null;
  image_url_resolved?: string | null;
  is_available: boolean;
  variations: any;
  category_id: string;
  is_sold_by_weight: boolean;
  average_rating?: number;
  review_count?: number;
}

const PLACEHOLDER = "/placeholder.png"; // provide this file in public/ or change path

const Menu = () => {
  const { addItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [eggFilter, setEggFilter] = useState<string>("all");

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
        .select(`
          *,
          product_ratings (
            average_rating,
            review_count
          )
        `)
        .eq("is_available", true);

      if (productsError) throw productsError;

      // Resolve image URLs and ratings:
      const parsed = (productsData || []).map((p: any) => {
        const ratings = Array.isArray(p.product_ratings) ? p.product_ratings[0] : p.product_ratings;
        const prod: Product = {
          ...p,
          image_url: p.image_url ? String(p.image_url).trim().replace(/^["']|["']$/g, "") : null,
          image_url_resolved: null,
          average_rating: ratings?.average_rating ? Number(ratings.average_rating) : undefined,
          review_count: ratings?.review_count || undefined,
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
                    {product.average_rating && product.review_count ? (
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating rating={product.average_rating} size={16} />
                        <span className="text-sm text-muted-foreground">
                          {product.average_rating} ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    ) : null}
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
                      onClick={() => setSelectedProduct(product)}
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

      <ProductCustomizationDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <Footer />
    </div>
  );
};

export default Menu;
