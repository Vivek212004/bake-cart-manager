import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, UserCog, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DeliveryPerson {
  user_id: string;
  profiles: {
    full_name: string;
    phone?: string;
  } | null;
}

interface DeliveryPersonManagementProps {
  deliveryPersons: DeliveryPerson[];
  onRefresh: () => void;
}

export const DeliveryPersonManagement = ({ 
  deliveryPersons, 
  onRefresh 
}: DeliveryPersonManagementProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  const handleCreateDeliveryPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-delivery-person', {
        body: formData
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        // Check for specific error messages
        if (data.error.includes("email address has already been registered")) {
          throw new Error("A user with this email already exists. Please use a different email.");
        }
        throw new Error(data.error);
      }

      toast.success("Delivery person created successfully");
      setFormData({ email: "", password: "", full_name: "", phone: "" });
      setIsCreateDialogOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error("Error creating delivery person:", error);
      const errorMessage = error.message || "Failed to create delivery person";
      // Handle edge function error response
      if (errorMessage.includes("email address has already been registered") || errorMessage.includes("email_exists")) {
        toast.error("A user with this email already exists. Please use a different email address.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDeliveryPerson = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} as a delivery person?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "customer" })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Delivery person role removed");
      onRefresh();
    } catch (error: any) {
      toast.error("Failed to remove delivery person role");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Delivery Personnel
            </CardTitle>
            <CardDescription>
              Manage delivery person accounts and assignments
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery Person
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Delivery Person Account</DialogTitle>
                <DialogDescription>
                  Create a new account with delivery person role
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDeliveryPerson} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="delivery@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Account"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {deliveryPersons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No delivery persons yet. Add one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {deliveryPersons.map((dp) => (
              <div
                key={dp.user_id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{dp.profiles?.full_name || "Unknown"}</p>
                    <Badge variant="secondary">Delivery Person</Badge>
                  </div>
                  {dp.profiles?.phone && (
                    <p className="text-sm text-muted-foreground">{dp.profiles.phone}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDeliveryPerson(dp.user_id, dp.profiles?.full_name || "this user")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
