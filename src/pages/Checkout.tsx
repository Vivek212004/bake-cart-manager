import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { distanceFromBakeryKm } from "@/lib/distance";
import { MAX_DELIVERY_KM } from "@/config/location";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  // Location-related state
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      setFormData((prev) => ({ ...prev, email: session.user.email || "" }));
    });

    if (items.length === 0) {
      navigate("/cart");
    }
  }, [navigate, items]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = distanceFromBakeryKm(latitude, longitude);

        setLat(latitude);
        setLng(longitude);
        setDistanceKm(dist);
        setLoadingLocation(false);

        if (dist > MAX_DELIVERY_KM) {
          toast.warning(
            `You are ~${dist.toFixed(
              1
            )} km away. Delivery is not available, but you can place an order for pickup.`
          );
        } else {
          toast.success(
            `Great! You are ~${dist.toFixed(1)} km away – delivery available.`
          );
        }
      },
      (err) => {
        console.error(err);
        toast.error("Could not get your location");
        setLoadingLocation(false);
      }
    );
  };

  const handleRazorpayPayment = async (orderId: string) => {
    try {
      // Create Razorpay order
      const { data: razorpayData, error: razorpayError } = await supabase.functions.invoke(
        'create-razorpay-order',
        {
          body: {
            amount: totalAmount,
            orderId: orderId,
          },
        }
      );

      if (razorpayError || !razorpayData.success) {
        throw new Error(razorpayData?.error || 'Failed to create payment order');
      }

      console.log('Razorpay order created:', razorpayData.razorpayOrderId);

      // Initialize Razorpay
      const options = {
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'Emoticon Bakery',
        description: 'Order Payment',
        order_id: razorpayData.razorpayOrderId,
        handler: async function (response: any) {
          console.log('Payment successful, verifying...');
          
          // Verify payment
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
            'verify-razorpay-payment',
            {
              body: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: orderId,
              },
            }
          );

          if (verifyError || !verifyData.success) {
            throw new Error('Payment verification failed');
          }

          clearCart();
          toast.success('Payment successful! Order confirmed.');
          navigate('/dashboard');
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#F97316',
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment cancelled');
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to place an order.");
      return;
    }

    // Check if location was verified
    if (lat == null || lng == null || distanceKm == null) {
      toast.error(
        "Please click 'Use my current location' to verify your location."
      );
      return;
    }

    setLoading(true);

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_email: formData.email,
          delivery_address: formData.address,
          notes: formData.notes,
          total_amount: totalAmount,
          status: "pending",
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cod' ? 'pending' : 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        variation_details: item.variation || null,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items error:", itemsError);
        // Check if it's a foreign key constraint error (invalid product_id)
        if (itemsError.message?.includes('foreign key constraint') || itemsError.code === '23503') {
          toast.error("Your cart contains invalid items. Please clear your cart and add items again.");
          clearCart();
          navigate("/menu");
          return;
        }
        throw itemsError;
      }

      // Handle payment based on method
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(order.id);
      } else {
        // COD - order placed successfully
        clearCart();
        toast.success("Order placed successfully! Pay on delivery.");
        navigate("/dashboard");
        setLoading(false);
      }
    } catch (error: any) {
      toast.error("Failed to place order. Please try again.");
      console.error(error);
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Delivery Address *</Label>
                    <Textarea
                      id="address"
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  {/* Location section */}
                  <div className="space-y-2">
                    <Label>Verify Delivery Location *</Label>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseMyLocation}
                        disabled={loadingLocation}
                      >
                        {loadingLocation
                          ? "Getting location..."
                          : "Use my current location"}
                      </Button>

                      {distanceKm != null && (
                        <span className={`text-sm ${distanceKm > MAX_DELIVERY_KM ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          Distance from bakery: {distanceKm.toFixed(2)} km
                        </span>
                      )}
                    </div>
                    {distanceKm != null && distanceKm > MAX_DELIVERY_KM ? (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                        <p className="text-sm text-destructive font-medium">
                          ⚠️ Delivery not available for your location (beyond {MAX_DELIVERY_KM} km)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can still place your order for pickup at our bakery.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        We deliver within {MAX_DELIVERY_KM} km radius from the bakery.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      rows={2}
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <Label>Payment Method *</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as "razorpay" | "cod")}
                    >
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="razorpay" id="razorpay" />
                        <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                          <div className="font-medium">Online Payment (Razorpay)</div>
                          <div className="text-xs text-muted-foreground">Pay securely via UPI, Card, Net Banking</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-xs text-muted-foreground">Pay when you receive your order</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : paymentMethod === 'razorpay' ? "Proceed to Payment" : "Place Order"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name}{" "}
                      {item.variation && `(${item.variation})`} x{" "}
                      {item.quantity}
                    </span>
                    <span className="text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-primary">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
