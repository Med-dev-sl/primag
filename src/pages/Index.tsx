import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOrders } from "@/hooks/useOrders";
import { useMerchandise } from "@/hooks/useMerchandise";
import { useReceipts } from "@/hooks/useReceipts";
import { 
  Package, 
  ShoppingCart, 
  Receipt, 
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  processing: "bg-info/20 text-info border-info/30",
  ready: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const Index = () => {
  const { data: orders = [] } = useOrders();
  const { data: merchandise = [] } = useMerchandise();
  const { data: receipts = [] } = useReceipts();

  const totalRevenue = receipts.reduce((sum, r) => sum + r.amount_paid, 0);
  const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "processing").length;
  const completedToday = orders.filter(o => {
    const orderDate = new Date(o.created_at).toDateString();
    return orderDate === new Date().toDateString() && o.status === "completed";
  }).length;

  const recentOrders = orders.slice(0, 5);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`$${totalRevenue.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            description="All time earnings"
          />
          <StatsCard
            title="Inventory Items"
            value={merchandise.length}
            icon={<Package className="h-5 w-5 text-primary" />}
            description={`${merchandise.reduce((sum, m) => sum + m.quantity, 0)} units in stock`}
          />
          <StatsCard
            title="Pending Orders"
            value={pendingOrders}
            icon={<Clock className="h-5 w-5 text-warning" />}
            description="Awaiting processing"
          />
          <StatsCard
            title="Completed Today"
            value={completedToday}
            icon={<CheckCircle className="h-5 w-5 text-success" />}
            description="Orders fulfilled today"
          />
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders yet. Create your first order!
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customers?.name || "Walk-in Customer"} • {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="capitalize">
                        {order.order_type}
                      </Badge>
                      <Badge className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                      <span className="font-semibold">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
