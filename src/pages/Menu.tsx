import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/Footer";
import { ProductCustomizationDialog } from "@/components/menu/ProductCustomizationDialog";

interface Category {
  id: string;
  name: string;
  display_order: number;
  parent_id?: string | null;
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
  uom?: string | null;
  is_sold_by_weight: boolean;
}

const PLACEHOLDER = "/placeholder.png";

const Menu = () => {
  const { addItem } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
        .select("*")
        .eq("is_available", true);

      if (productsError) throw productsError;

      const parsed = (productsData || []).map((p: any) => {
        return {
          ...p,
          image_url: p.image_url ? String(p.image_url).trim().replace(/^["']|["']$/g, "") : null,
          image_url_resolved: null,
        } as Product;
      });

      // attempt to resolve storage URLs (non-blocking)
      for (const prod of parsed) {
        if (prod.image_url && !/^https?:\/\//i.test(prod.image_url)) {
          try {
            const { data } = supabase.storage.from("products").getPublicUrl(prod.image_url);
            prod.image_url_resolved = data?.publicUrl ?? null;
          } catch {
            prod.image_url_resolved = null;
          }
        } else {
          prod.image_url_resolved = prod.image_url ?? null;
        }
      }

      setProducts(parsed);
    } catch (err: any) {
      toast.error("Failed to load menu");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // group products by category id (maintains category order)
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const c of categories) map.set(c.id, []);
    for (const p of products) {
      const key = p.category_id ?? "uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [categories, products]);

  const filteredProductsForCategory = (catId: string | null) => {
    const list = catId ? (grouped.get(catId) || []) : Array.from(grouped.values()).flat();
    // search
    let filtered = list;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    // egg filter (fallback to product.egg_type)
    if (eggFilter !== "all") {
      filtered = filtered.filter((p) => {
        const eggType = (p as any).egg_type;
        if (!eggType) return true;
        if (eggFilter === "eggless") return eggType === "eggless" || eggType === "both";
        if (eggFilter === "egg") return eggType === "egg" || eggType === "both";
        return true;
      });
    }
    return filtered;
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.base_price,
      variation: undefined,
      image_url: product.image_url_resolved ?? undefined,
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Our Menu</h1>
            <p className="text-muted-foreground">Compact table view for quick ordering</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}
            </div>

            <div className="flex gap-2">
              <Badge variant={eggFilter === "all" ? "default" : "outline"} onClick={() => setEggFilter("all")} className="cursor-pointer">All</Badge>
              <Badge variant={eggFilter === "egg" ? "default" : "outline"} onClick={() => setEggFilter("egg")} className="cursor-pointer">Egg</Badge>
              <Badge variant={eggFilter === "eggless" ? "default" : "outline"} onClick={() => setEggFilter("eggless")} className="cursor-pointer">Eggless</Badge>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={selectedCategoryId === null ? "default" : "ghost"} size="sm" onClick={() => setSelectedCategoryId(null)}>All Items</Button>
          {categories.map((c) => (
            <Button key={c.id} variant={selectedCategoryId === c.id ? "default" : "ghost"} size="sm" onClick={() => setSelectedCategoryId(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>

        {/* For each visible category render a table-like block */}
        <div className="space-y-8">
          {(selectedCategoryId ? [categories.find(c => c.id === selectedCategoryId)].filter(Boolean) : categories).map((cat) => {
            if (!cat) return null;
            const rows = filteredProductsForCategory(cat.id);
            if (rows.length === 0) return null;
            return (
              <section key={cat.id} className="bg-card border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/5">
                  <h2 className="text-xl font-semibold">{cat.name}</h2>
                  <span className="text-sm text-muted-foreground">{rows.length} items</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">UOM</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 w-44">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id} className="border-t hover:bg-accent/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden shrink-0">
                                <img src={p.image_url_resolved ?? PLACEHOLDER} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">{(p as any).uom ?? "-"}</td>
                          <td className="px-4 py-3 align-top">{formatPrice(p.base_price)}{p.is_sold_by_weight && <span className="text-xs text-muted-foreground"> /kg</span>}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => setSelectedProduct(p)} disabled={!p.is_available}>
                                <ShoppingCart className="mr-2 h-4 w-4" />Customize
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleAddToCart(p)} disabled={!p.is_available}>Quick Add</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <ProductCustomizationDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product, variation, price, weightInKg) => {
          // reuse existing quick-add behavior
          addItem({
            product_id: product.id,
            name: product.name,
            price: price ?? product.base_price,
            variation: variation ?? undefined,
            image_url: product.image_url_resolved ?? undefined,
            weight: weightInKg,
          });
          toast.success(`${product.name} added to cart!`);
          setSelectedProduct(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default Menu;
