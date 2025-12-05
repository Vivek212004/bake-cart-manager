import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AnalyticsCards } from "@/components/dashboard/AnalyticsCards";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { DeliveryPersonView } from "@/components/dashboard/DeliveryPersonView";
import { DeliveryPersonManagement } from "@/components/dashboard/DeliveryPersonManagement";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { BulkProductActions } from "@/components/dashboard/BulkProductActions";
import { CategoryForm } from "@/components/dashboard/CategoryForm";
import { CategoryCard } from "@/components/dashboard/CategoryCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeliveryPerson, setIsDeliveryPerson] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [deliveryPersons, setDeliveryPersons] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    // Set up realtime subscription for orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order update:', payload);
          if (payload.eventType === 'UPDATE') {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === payload.new.id ? { ...order, ...payload.new } : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        await Promise.all([
          fetchOrders(), 
          fetchProducts(), 
          fetchCategories(), 
          fetchDeliveryPersons()
        ]);
      } else if (roleData?.role === "delivery_person") {
        setIsDeliveryPerson(true);
        await fetchDeliveryPersonOrders(user.id);
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

  const fetchDeliveryPersons = async () => {
    // First get delivery person user IDs
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "delivery_person");

    if (roleError) {
      console.error("Failed to fetch delivery person roles:", roleError);
      toast.error("Failed to fetch delivery persons");
      return;
    }

    if (!roleData || roleData.length === 0) {
      setDeliveryPersons([]);
      return;
    }

    // Then get their profiles
    const userIds = roleData.map(r => r.user_id);
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .in("user_id", userIds);

    if (profileError) {
      console.error("Failed to fetch delivery person profiles:", profileError);
      toast.error("Failed to fetch delivery persons");
      return;
    }

    // Combine the data
    const combined = roleData.map(role => ({
      user_id: role.user_id,
      profiles: profileData?.find(p => p.user_id === role.user_id) || null
    }));

    setDeliveryPersons(combined);
  };

  const fetchDeliveryPersonOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("delivery_person_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch delivery orders");
      return;
    }
    setOrders(data || []);
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

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      return;
    }

    toast.success("Order status updated");
  };

  const handleCancelOrder = async (orderId: string) => {
    // Check if order is within 5 minute cancellation window
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      toast.error("Order not found");
      return;
    }

    const createdAt = new Date(order.created_at).getTime();
    const now = Date.now();
    const elapsedMs = now - createdAt;
    const windowMs = 5 * 60 * 1000; // 5 minutes

    if (elapsedMs > windowMs) {
      toast.error("Cancellation window has expired");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to cancel order");
      return;
    }

    // Update local state
    setOrders((prevOrders) =>
      prevOrders.map((o) =>
        o.id === orderId ? { ...o, status: "cancelled" } : o
      )
    );

    toast.success("Order cancelled successfully");
  };

  const handleAssignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ 
        delivery_person_id: deliveryPersonId === 'unassigned' ? null : deliveryPersonId 
      })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to assign delivery person");
      return;
    }

    toast.success("Delivery person assigned");
    fetchOrders();
  };

  const handleAddProduct = async (formData: any) => {
    const { error } = await supabase
      .from("products")
      .insert([{
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        category_id: formData.category_id,
        is_available: true,
        is_sold_by_weight: formData.is_sold_by_weight,
        pricing_type: formData.pricing_type || "unit",
        price_display_unit: formData.price_display_unit || null,
        egg_type: formData.egg_type,
        variations: formData.variations || null,
      }]);

    if (error) {
      toast.error("Failed to add product");
      return;
    }

    toast.success("Product added successfully");
    setIsAddDialogOpen(false);
    fetchProducts();
  };

  const handleEditProduct = async (formData: any) => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from("products")
      .update({
        name: formData.name,
        description: formData.description,
        base_price: parseFloat(formData.base_price),
        category_id: formData.category_id,
        is_available: formData.is_available,
        is_sold_by_weight: formData.is_sold_by_weight,
        pricing_type: formData.pricing_type || "unit",
        price_display_unit: formData.price_display_unit || null,
        egg_type: formData.egg_type,
        variations: formData.variations || null,
      })
      .eq("id", editingProduct.id);

    if (error) {
      toast.error("Failed to update product");
      return;
    }

    toast.success("Product updated successfully");
    setIsEditDialogOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedProducts);
    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", ids);

    if (error) {
      toast.error("Failed to delete products");
      return;
    }

    toast.success(`Deleted ${ids.length} product${ids.length > 1 ? "s" : ""}`);
    setSelectedProducts(new Set());
    fetchProducts();
  };

  const handleBulkSetAvailable = async (available: boolean) => {
    const ids = Array.from(selectedProducts);
    const { error } = await supabase
      .from("products")
      .update({ is_available: available })
      .in("id", ids);

    if (error) {
      toast.error("Failed to update products");
      return;
    }

    toast.success(`Updated ${ids.length} product${ids.length > 1 ? "s" : ""}`);
    setSelectedProducts(new Set());
    fetchProducts();
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
  };

  const handleAddCategory = async (formData: any) => {
    const { error } = await supabase
      .from("categories")
      .insert([{
        name: formData.name,
        display_order: formData.display_order,
        parent_id: formData.parent_id,
        has_egg_option: formData.has_egg_option,
      }]);

    if (error) {
      toast.error("Failed to add category");
      return;
    }

    toast.success("Category added successfully");
    setIsAddCategoryDialogOpen(false);
    fetchCategories();
  };

  const handleEditCategory = async (formData: any) => {
    if (!editingCategory) return;

    const { error } = await supabase
      .from("categories")
      .update({
        name: formData.name,
        display_order: formData.display_order,
        parent_id: formData.parent_id,
        has_egg_option: formData.has_egg_option,
      })
      .eq("id", editingCategory.id);

    if (error) {
      toast.error("Failed to update category");
      return;
    }

    toast.success("Category updated successfully");
    setIsEditCategoryDialogOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Check if category has subcategories
    const hasSubcategories = categories.some(c => c.parent_id === categoryId);
    if (hasSubcategories) {
      toast.error("Cannot delete category with subcategories. Delete subcategories first.");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      toast.error("Failed to delete category");
      return;
    }

    toast.success("Category deleted successfully");
    fetchCategories();
  };

  const getSubcategoriesCount = (categoryId: string) => {
    return categories.filter(c => c.parent_id === categoryId).length;
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return undefined;
    const parent = categories.find(c => c.id === parentId);
    return parent?.name;
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

  // Delivery person view
  if (isDeliveryPerson) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-16">
          <DeliveryPersonView orders={orders} />
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

        {isAdmin && <AnalyticsCards orders={orders} />}

        <Tabs defaultValue="orders" className="w-full">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            {isAdmin && <TabsTrigger value="products">Products</TabsTrigger>}
            {isAdmin && <TabsTrigger value="categories">Categories</TabsTrigger>}
            {isAdmin && <TabsTrigger value="delivery">Delivery Personnel</TabsTrigger>}
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  isAdmin={isAdmin}
                  deliveryPersons={deliveryPersons}
                  onUpdateStatus={isAdmin ? handleUpdateOrderStatus : undefined}
                  onAssignDeliveryPerson={isAdmin ? handleAssignDeliveryPerson : undefined}
                  onCancelOrder={!isAdmin ? handleCancelOrder : undefined}
                />
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Product</DialogTitle>
                      <DialogDescription>Create a new product in your bakery menu</DialogDescription>
                    </DialogHeader>
                    <ProductForm
                      categories={categories}
                      onSubmit={handleAddProduct}
                      submitLabel="Add Product"
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <BulkProductActions
                selectedCount={selectedProducts.size}
                onBulkDelete={handleBulkDelete}
                onBulkSetAvailable={handleBulkSetAvailable}
                onClearSelection={() => setSelectedProducts(new Set())}
              />

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.has(product.id)}
                    onSelect={() => toggleProductSelection(product.id)}
                    onEdit={() => {
                      setEditingProduct(product);
                      setIsEditDialogOpen(true);
                    }}
                    onDelete={() => handleDeleteProduct(product.id)}
                  />
                ))}
              </div>

              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>Update product details and variations</DialogDescription>
                  </DialogHeader>
                  {editingProduct && (
                    <ProductForm
                      initialData={{
                        name: editingProduct.name,
                        description: editingProduct.description || "",
                        base_price: editingProduct.base_price.toString(),
                        category_id: editingProduct.category_id,
                        is_sold_by_weight: editingProduct.is_sold_by_weight,
                        pricing_type: editingProduct.pricing_type || (editingProduct.is_sold_by_weight ? "per_kg" : "unit"),
                        price_display_unit: editingProduct.price_display_unit || "",
                        egg_type: editingProduct.egg_type,
                        variations: editingProduct.variations || [],
                        is_available: editingProduct.is_available,
                      }}
                      categories={categories}
                      onSubmit={handleEditProduct}
                      submitLabel="Update Product"
                    />
                  )}
                </DialogContent>
              </Dialog>

              {products.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No products found. Add your first product!
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="categories" className="mt-6">
              <div className="mb-6">
                <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                      <DialogDescription>Create a new category or subcategory for your menu</DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                      categories={categories}
                      onSubmit={handleAddCategory}
                      submitLabel="Add Category"
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Top-level categories */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Main Categories</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories
                      .filter((c) => !c.parent_id)
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((category) => (
                        <CategoryCard
                          key={category.id}
                          category={category}
                          subcategoriesCount={getSubcategoriesCount(category.id)}
                          onEdit={() => {
                            setEditingCategory(category);
                            setIsEditCategoryDialogOpen(true);
                          }}
                          onDelete={() => handleDeleteCategory(category.id)}
                        />
                      ))}
                  </div>
                </div>

                {/* Subcategories */}
                {categories.some((c) => c.parent_id) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Subcategories</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categories
                        .filter((c) => c.parent_id)
                        .sort((a, b) => a.display_order - b.display_order)
                        .map((category) => (
                          <CategoryCard
                            key={category.id}
                            category={category}
                            parentName={getParentName(category.parent_id)}
                            subcategoriesCount={0}
                            onEdit={() => {
                              setEditingCategory(category);
                              setIsEditCategoryDialogOpen(true);
                            }}
                            onDelete={() => handleDeleteCategory(category.id)}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
                <DialogContent className="bg-background">
                  <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>Update category details</DialogDescription>
                  </DialogHeader>
                  {editingCategory && (
                    <CategoryForm
                      categories={categories}
                      initialData={{
                        name: editingCategory.name,
                        display_order: editingCategory.display_order,
                        parent_id: editingCategory.parent_id,
                        has_egg_option: editingCategory.has_egg_option || false,
                      }}
                      editingCategoryId={editingCategory.id}
                      onSubmit={handleEditCategory}
                      submitLabel="Update Category"
                    />
                  )}
                </DialogContent>
              </Dialog>

              {categories.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No categories found. Add your first category!
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="delivery" className="mt-6">
              <DeliveryPersonManagement 
                deliveryPersons={deliveryPersons}
                onRefresh={fetchDeliveryPersons}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;