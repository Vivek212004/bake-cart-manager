import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Package, ShoppingCart, Download, Calendar } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, subDays, subMonths } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface OrdersAnalyticsProps {
  orders: any[];
}

type TimelinePreset = "today" | "yesterday" | "this_week" | "this_month" | "this_year" | "last_7_days" | "last_30_days" | "last_3_months" | "custom";

export const OrdersAnalytics = ({ orders }: OrdersAnalyticsProps) => {
  const [preset, setPreset] = useState<TimelinePreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    
    switch (preset) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "this_week":
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "last_7_days":
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case "last_30_days":
        return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
      case "last_3_months":
        return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
      case "custom":
        return {
          start: customStartDate ? startOfDay(new Date(customStartDate)) : startOfMonth(now),
          end: customEndDate ? endOfDay(new Date(customEndDate)) : endOfDay(now),
        };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange();
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start, end });
    });
  }, [orders, preset, customStartDate, customEndDate]);

  const analytics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => (order.payment_status === "completed" ? sum + Number(order.total_amount) : sum),
      0
    );

    const pendingRevenue = filteredOrders.reduce(
      (sum, order) => (order.payment_status === "pending" && order.status !== "cancelled" ? sum + Number(order.total_amount) : sum),
      0
    );

    const completedOrders = filteredOrders.filter((order) => order.status === "delivered").length;
    const pendingOrders = filteredOrders.filter((order) => order.status === "pending").length;
    const preparingOrders = filteredOrders.filter((order) => order.status === "preparing").length;
    const cancelledOrders = filteredOrders.filter((order) => order.status === "cancelled").length;

    const codOrders = filteredOrders.filter((order) => order.payment_method === "cod").length;
    const onlineOrders = filteredOrders.filter((order) => order.payment_method === "razorpay").length;

    const popularProducts = filteredOrders
      .flatMap((order) => order.order_items || [])
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
      .slice(0, 10);

    return {
      totalRevenue,
      pendingRevenue,
      completedOrders,
      pendingOrders,
      preparingOrders,
      cancelledOrders,
      codOrders,
      onlineOrders,
      totalOrders: filteredOrders.length,
      topProducts,
    };
  }, [filteredOrders]);

  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error("No orders to export for selected timeline");
      return;
    }

    const { start, end } = getDateRange();

    // Orders Sheet
    const ordersData = filteredOrders.map((order) => ({
      "Order ID": order.id.slice(0, 8),
      "Order Date": format(new Date(order.created_at), "yyyy-MM-dd HH:mm"),
      "Customer Name": order.customer_name,
      "Phone": order.customer_phone,
      "Email": order.customer_email || "-",
      "Delivery Address": order.delivery_address || "-",
      "Status": order.status,
      "Payment Method": order.payment_method === "razorpay" ? "Online" : "COD",
      "Payment Status": order.payment_status,
      "Total Amount (₹)": Number(order.total_amount).toFixed(2),
      "Notes": order.notes || "-",
    }));

    // Order Items Sheet
    const itemsData = filteredOrders.flatMap((order) =>
      (order.order_items || []).map((item: any) => ({
        "Order ID": order.id.slice(0, 8),
        "Order Date": format(new Date(order.created_at), "yyyy-MM-dd"),
        "Customer Name": order.customer_name,
        "Product Name": item.product_name,
        "Variation": item.variation_details || "-",
        "Quantity": item.quantity,
        "Unit Price (₹)": Number(item.unit_price).toFixed(2),
        "Subtotal (₹)": Number(item.subtotal).toFixed(2),
      }))
    );

    // Summary Sheet
    const summaryData = [
      { Metric: "Report Period", Value: `${format(start, "dd MMM yyyy")} - ${format(end, "dd MMM yyyy")}` },
      { Metric: "Total Orders", Value: analytics.totalOrders },
      { Metric: "Completed Orders", Value: analytics.completedOrders },
      { Metric: "Pending Orders", Value: analytics.pendingOrders },
      { Metric: "Preparing Orders", Value: analytics.preparingOrders },
      { Metric: "Cancelled Orders", Value: analytics.cancelledOrders },
      { Metric: "Total Revenue (₹)", Value: analytics.totalRevenue.toFixed(2) },
      { Metric: "Pending Revenue (₹)", Value: analytics.pendingRevenue.toFixed(2) },
      { Metric: "Online Payments", Value: analytics.onlineOrders },
      { Metric: "Cash on Delivery", Value: analytics.codOrders },
      { Metric: "Avg Order Value (₹)", Value: analytics.totalOrders > 0 ? ((analytics.totalRevenue + analytics.pendingRevenue) / analytics.totalOrders).toFixed(2) : "0" },
    ];

    // Top Products Sheet
    const topProductsData = analytics.topProducts.map((product: any, index: number) => ({
      "Rank": index + 1,
      "Product Name": product.name,
      "Quantity Sold": product.quantity,
      "Revenue (₹)": product.revenue.toFixed(2),
    }));

    // Daily Breakdown Sheet
    const dailyBreakdown = filteredOrders.reduce((acc: any, order) => {
      const date = format(new Date(order.created_at), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0, items: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += order.payment_status === "completed" ? Number(order.total_amount) : 0;
      acc[date].items += (order.order_items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
      return acc;
    }, {});

    const dailyData = Object.values(dailyBreakdown)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .map((day: any) => ({
        "Date": day.date,
        "Orders": day.orders,
        "Items Sold": day.items,
        "Revenue (₹)": day.revenue.toFixed(2),
      }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    const ordersWs = XLSX.utils.json_to_sheet(ordersData);
    XLSX.utils.book_append_sheet(wb, ordersWs, "Orders");

    const itemsWs = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, itemsWs, "Order Items");

    const topProductsWs = XLSX.utils.json_to_sheet(topProductsData);
    XLSX.utils.book_append_sheet(wb, topProductsWs, "Top Products");

    const dailyWs = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Breakdown");

    // Download
    const fileName = `orders_report_${format(start, "yyyyMMdd")}_to_${format(end, "yyyyMMdd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel report downloaded!");
  };

  const { start, end } = getDateRange();

  return (
    <div className="space-y-6 mb-8">
      {/* Timeline Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Analytics Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as TimelinePreset)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="this_year">This Year</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preset === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </>
            )}

            <Button onClick={exportToExcel} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-3">
            Showing data from <span className="font-medium">{format(start, "dd MMM yyyy")}</span> to{" "}
            <span className="font-medium">{format(end, "dd MMM yyyy")}</span>
          </p>
        </CardContent>
      </Card>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +₹{analytics.pendingRevenue.toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.onlineOrders} online, {analytics.codOrders} COD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.completedOrders} delivered</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingOrders} pending, {analytics.preparingOrders} preparing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.totalOrders > 0 ? ((analytics.totalRevenue + analytics.pendingRevenue) / analytics.totalOrders).toFixed(0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.cancelledOrders} cancelled orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.topProducts.slice(0, 5).map((product: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground w-6">#{index + 1}</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{product.quantity} sold</span>
                  <span className="font-semibold text-primary">₹{product.revenue.toFixed(0)}</span>
                </div>
              </div>
            ))}
            {analytics.topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No sales data for selected period</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
