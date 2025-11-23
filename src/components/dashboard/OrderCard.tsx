import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, User } from "lucide-react";

interface OrderCardProps {
  order: any;
  isAdmin: boolean;
  deliveryPersons?: any[];
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
  onAssignDeliveryPerson?: (orderId: string, deliveryPersonId: string) => void;
}

export const OrderCard = ({ 
  order, 
  isAdmin, 
  deliveryPersons = [],
  onUpdateStatus,
  onAssignDeliveryPerson 
}: OrderCardProps) => {
  const openInGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {new Date(order.created_at).toLocaleString()} - {order.customer_name}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={
              order.status === 'delivered' ? 'default' :
              order.status === 'ready' ? 'default' :
              order.status === 'preparing' ? 'secondary' :
              order.status === 'cancelled' ? 'destructive' :
              'outline'
            }>
              {order.status}
            </Badge>
            {isAdmin && onUpdateStatus && (
              <Select
                value={order.status}
                onValueChange={(value) => onUpdateStatus(order.id, value)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="space-y-1">
            <p className="text-sm font-semibold">Customer Details:</p>
            <p className="text-sm">📞 {order.customer_phone}</p>
            {order.customer_email && <p className="text-sm">✉️ {order.customer_email}</p>}
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="space-y-1">
              <p className="text-sm font-semibold">Delivery Address:</p>
              <div className="flex items-start gap-2">
                <p className="text-sm flex-1">{order.delivery_address}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openInGoogleMaps(order.delivery_address)}
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Open Map
                </Button>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline">
              {order.payment_method === 'razorpay' ? '💳 Online' : '💵 Cash on Delivery'}
            </Badge>
            <Badge variant={order.payment_status === 'completed' ? 'default' : 'secondary'}>
              {order.payment_status}
            </Badge>
          </div>

          {/* Delivery Person Assignment (Admin Only) */}
          {isAdmin && onAssignDeliveryPerson && (
            <div className="space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Delivery Person:
              </p>
              <Select
                value={order.delivery_person_id || "unassigned"}
                onValueChange={(value) => onAssignDeliveryPerson(order.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign delivery person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {deliveryPersons.map((person) => (
                    <SelectItem key={person.user_id} value={person.user_id}>
                      {person.profiles?.full_name || person.user_id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Order Items */}
          <div className="space-y-2">
            <p className="font-semibold">Items:</p>
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.product_name} x {item.quantity}</span>
                <span>₹{item.subtotal}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="space-y-1">
              <p className="text-sm font-semibold">Notes:</p>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-primary">₹{order.total_amount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
