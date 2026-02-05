import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReceipts } from "@/hooks/useReceipts";
import { useOrders } from "@/hooks/useOrders";
import { formatCurrency } from "@/lib/currency";
import { BarChart, TrendingUp, Calendar } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
  isWithinInterval,
} from "date-fns";

type TimeRange = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const { data: receipts = [] } = useReceipts();
  const { data: orders = [] } = useOrders();
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");

  const getDailyData = () => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((day) => {
      const dayReceipts = receipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return format(receiptDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });
      const revenue = dayReceipts.reduce((sum, r) => sum + r.amount_paid, 0);

      return {
        name: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        revenue,
      };
    });
  };

  const getWeeklyData = () => {
    const last8Weeks = eachWeekOfInterval({
      start: subDays(new Date(), 56),
      end: new Date(),
    });

    return last8Weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const weekReceipts = receipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return isWithinInterval(receiptDate, { start: weekStart, end: weekEnd });
      });
      const revenue = weekReceipts.reduce((sum, r) => sum + r.amount_paid, 0);

      return {
        name: format(weekStart, "MMM d"),
        fullDate: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        revenue,
      };
    });
  };

  const getMonthlyData = () => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthReceipts = receipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return isWithinInterval(receiptDate, { start: monthStart, end: monthEnd });
      });
      const revenue = monthReceipts.reduce((sum, r) => sum + r.amount_paid, 0);

      return {
        name: format(monthStart, "MMM"),
        fullDate: format(monthStart, "MMMM yyyy"),
        revenue,
      };
    });
  };

  const chartData =
    timeRange === "daily"
      ? getDailyData()
      : timeRange === "weekly"
      ? getWeeklyData()
      : getMonthlyData();

  const totalRevenue = receipts.reduce((sum, r) => sum + r.amount_paid, 0);
  const periodRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const laundryOrders = orders.filter((o) => o.order_type === "laundry").length;
  const merchandiseOrders = orders.filter((o) => o.order_type === "merchandise").length;

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
          <p className="text-muted-foreground">
            Track your revenue and business performance
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Period Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(periodRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === "daily"
                  ? "Last 7 days"
                  : timeRange === "weekly"
                  ? "Last 8 weeks"
                  : "Last 6 months"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-muted-foreground">
                {laundryOrders} laundry, {merchandiseOrders} merchandise
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(completedOrders > 0 ? totalRevenue / completedOrders : 0)}
              </div>
              <p className="text-xs text-muted-foreground">Per completed order</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `SLE ${value}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        "Revenue",
                      ]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullDate || label
                      }
                    />
                  }
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
