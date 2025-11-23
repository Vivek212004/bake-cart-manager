import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Package } from "lucide-react";

interface AnalyticsCardsProps {
  orders: any[];
}

export const AnalyticsCards = ({ orders }: AnalyticsCardsProps) => {
  const totalRevenue = orders.reduce((sum, order) => 
    order.payment_status === 'completed' ? sum + Number(order.total_amount) : sum, 0
  );

  const completedOrders = orders.filter(order => 
    order.status === 'delivered'
  ).length;

  const popularProducts = orders
    .flatMap(order => order.order_items || [])
    .reduce((acc: any, item: any) => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
      }
      acc[item.product_name].quantity += item.quantity;
      acc[item.product_name].revenue += Number(item.subtotal);
      return acc;
    }, {});

  const topProducts = Object.values(popularProducts)
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            From {orders.length} orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedOrders}</div>
          <p className="text-xs text-muted-foreground">
            {((completedOrders / orders.length) * 100 || 0).toFixed(1)}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {topProducts.slice(0, 3).map((product: any, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium">{product.name}</span>
                <span className="text-muted-foreground ml-2">({product.quantity} sold)</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
