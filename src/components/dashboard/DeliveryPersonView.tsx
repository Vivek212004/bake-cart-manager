import { Card, CardContent } from "@/components/ui/card";
import { OrderCard } from "./OrderCard";

interface DeliveryPersonViewProps {
  orders: any[];
}

export const DeliveryPersonView = ({ orders }: DeliveryPersonViewProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Deliveries</h2>
      
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No deliveries assigned yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isAdmin={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};
