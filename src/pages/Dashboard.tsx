import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  // New product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    base_price: "",
    category_id: "",
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role === "admin") {
        setIsAdmin(true);
        await Promise.all([fetchOrders(), fetchProducts(), fetchCategories()]);
      } else {
        await fetchUserOrders(user.id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
      return;
    }
    setOrders(data || []);
  };

  const fetchUserOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch orders");
      return;
    }
    setOrders(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
      return;
    }
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Failed to fetch categories");
      return;
    }
    setCategories(data || []);
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      toast.error("Failed to delete product");
      return;
    }

    toast.success("Product deleted successfully");
    fetchProducts();
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from("products")
      .insert([{
        name: newProduct.name,
        description: newProduct.description,
        base_price: parseFloat(newProduct.base_price),
        category_id: newProduct.category_id,
        is_available: true,
      }]);

    if (error) {
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added successfully");
    setNewProduct({ name: "", description: "", base_price: "", category_id: "" });
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-16">
        <h1 className="text-4xl font-bold mb-8 text-foreground">
          {isAdmin ? "Admin Dashboard" : "My Orders"}
        </h1>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            {isAdmin && <TabsTrigger value="products">Products</TabsTrigger>}
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription>
                          {new Date(order.created_at).toLocaleDateString()} - {order.customer_name}
                        </CardDescription>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-semibold">Items:</p>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.product_name} x {item.quantity}</span>
                          <span>₹{item.subtotal}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-border">
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-primary">₹{order.total_amount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {orders.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No orders found
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="products" className="mt-6">
              <div className="mb-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>Create a new product in your bakery menu</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Base Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={newProduct.base_price}
                          onChange={(e) => setNewProduct({ ...newProduct, base_price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newProduct.category_id}
                          onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">Add Product</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <CardDescription>{product.categories?.name}</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">₹{product.base_price}</p>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {products.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No products found. Add your first product!
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;