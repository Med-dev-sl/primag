import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReceipts } from "@/hooks/useReceipts";
import { useOrders } from "@/hooks/useOrders";
import { useExpenses } from "@/hooks/useExpenses";
import { useCashToBank } from "@/hooks/useCashToBank";
import { formatCurrency } from "@/lib/currency";
import { BarChart, TrendingUp, TrendingDown, Calendar, Wallet, Landmark, DollarSign } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
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
  const { expenses } = useExpenses();
  const { transfers } = useCashToBank();
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
      const dayExpenses = expenses.filter((e) => {
        return format(new Date(e.expense_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });
      const revenue = dayReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
      const expenseTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
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
      const weekExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.expense_date);
        return isWithinInterval(expenseDate, { start: weekStart, end: weekEnd });
      });
      const revenue = weekReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
      const expenseTotal = weekExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(weekStart, "MMM d"),
        fullDate: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
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
      const monthExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.expense_date);
        return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
      });
      const revenue = monthReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
      const expenseTotal = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(monthStart, "MMM"),
        fullDate: format(monthStart, "MMMM yyyy"),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
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
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalBankTransfers = transfers.reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const cashOnHand = totalRevenue - totalBankTransfers;
  
  const periodRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const periodExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const periodProfit = periodRevenue - periodExpenses;
  
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const laundryOrders = orders.filter((o) => o.order_type === "laundry").length;
  const merchandiseOrders = orders.filter((o) => o.order_type === "merchandise").length;

  // Expense breakdown by category
  const expenseByCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category;
    acc[cat] = (acc[cat] || 0) + Number(exp.amount);
    return acc;
  }, {} as Record<string, number>);

  const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--destructive))",
    "hsl(var(--accent))",
    "hsl(220, 70%, 50%)",
    "hsl(280, 70%, 50%)",
    "hsl(340, 70%, 50%)",
    "hsl(160, 70%, 50%)",
    "hsl(40, 70%, 50%)",
  ];

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    profit: {
      label: "Profit",
      color: "hsl(142, 76%, 36%)",
    },
  };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Financial Reports</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Track revenue, expenses, and profit/loss
          </p>
        </div>

        {/* Profit/Loss Summary */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive md:text-2xl">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">All time spending</p>
            </CardContent>
          </Card>
          <Card className={`col-span-2 lg:col-span-1 ${netProfit >= 0 ? 'border-primary/50' : 'border-destructive/50'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit/Loss</CardTitle>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold md:text-2xl ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {netProfit >= 0 ? '' : '-'}{formatCurrency(Math.abs(netProfit))}
              </div>
              <p className="text-xs text-muted-foreground">
                {netProfit >= 0 ? 'Profit' : 'Loss'} (Revenue - Expenses)
              </p>
            </CardContent>
          </Card>
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold md:text-2xl">{formatCurrency(cashOnHand)}</div>
              <p className="text-xs text-muted-foreground">Revenue - Bank Deposits</p>
            </CardContent>
          </Card>
        </div>

        {/* Period Stats */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Period Revenue</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold md:text-xl">{formatCurrency(periodRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === "daily" ? "Last 7 days" : timeRange === "weekly" ? "Last 8 weeks" : "Last 6 months"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Period Expenses</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-destructive md:text-xl">{formatCurrency(periodExpenses)}</div>
              <p className="text-xs text-muted-foreground">Same period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Period Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-lg font-bold md:text-xl ${periodProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {periodProfit >= 0 ? '' : '-'}{formatCurrency(Math.abs(periodProfit))}
              </div>
              <p className="text-xs text-muted-foreground">{periodProfit >= 0 ? 'Profit' : 'Loss'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Bank Deposits</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold md:text-xl">{formatCurrency(totalBankTransfers)}</div>
              <p className="text-xs text-muted-foreground">{transfers.length} transfers</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                  <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-xs sm:text-sm">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs sm:text-sm">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full md:h-[400px]">
              <RechartsBarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  width={40}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        formatCurrency(value as number),
                        name === "revenue" ? "Revenue" : name === "expenses" ? "Expenses" : "Profit",
                      ]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.fullDate || label
                      }
                    />
                  }
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown & Order Stats */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {expensePieData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No expenses recorded yet</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[250px] w-full md:h-[300px]">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [formatCurrency(value as number), "Amount"]}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Orders</p>
                  <p className="text-2xl font-bold">{completedOrders}</p>
                </div>
                <BarChart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Laundry Orders</p>
                  <p className="text-xl font-bold">{laundryOrders}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Merchandise Orders</p>
                  <p className="text-xl font-bold">{merchandiseOrders}</p>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Average Order Value</p>
                <p className="text-xl font-bold">
                  {formatCurrency(completedOrders > 0 ? totalRevenue / completedOrders : 0)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
