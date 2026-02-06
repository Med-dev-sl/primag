import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useReceipts } from "@/hooks/useReceipts";
import { useOrders } from "@/hooks/useOrders";
import { useExpenses } from "@/hooks/useExpenses";
import { useCashToBank } from "@/hooks/useCashToBank";
import { useCustomerLoans } from "@/hooks/useCustomerLoans";
import { useBusinessLoans } from "@/hooks/useBusinessLoans";
import { useCustomerCredits } from "@/hooks/useCustomerCredits";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { BarChart, TrendingUp, TrendingDown, Calendar as CalendarIcon, Wallet, Landmark, DollarSign, X } from "lucide-react";
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
} from "recharts";
import {
  format,
  subDays,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { LoanSummaryCards } from "@/components/reports/LoanSummaryCards";
import { OverdueAlerts } from "@/components/reports/OverdueAlerts";
import { PaymentHistory } from "@/components/reports/PaymentHistory";

type TimeRange = "daily" | "weekly" | "monthly";

export default function ReportsPage() {
  const { data: receipts = [] } = useReceipts();
  const { data: orders = [] } = useOrders();
  const { expenses } = useExpenses();
  const { transfers } = useCashToBank();
  const { loans: customerLoans, payments: customerPayments } = useCustomerLoans();
  const { loans: businessLoans, payments: businessPayments } = useBusinessLoans();
  const { credits } = useCustomerCredits();
  const [timeRange, setTimeRange] = useState<TimeRange>("daily");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Filter data by custom date range
  const filterByDateRange = <T extends { issued_at?: string; expense_date?: string; transfer_date?: string; created_at?: string }>(
    data: T[],
    dateField: keyof T
  ) => {
    if (!dateRange?.from) return data;
    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    return data.filter((item) => {
      const itemDate = new Date(item[dateField] as string);
      return isWithinInterval(itemDate, { start, end });
    });
  };

  const filteredReceipts = dateRange?.from 
    ? filterByDateRange(receipts, 'issued_at')
    : receipts;
  
  const filteredExpenses = dateRange?.from
    ? filterByDateRange(expenses, 'expense_date')
    : expenses;
  
  const filteredTransfers = dateRange?.from
    ? filterByDateRange(transfers, 'transfer_date')
    : transfers;

  const filteredOrders = dateRange?.from
    ? filterByDateRange(orders, 'created_at')
    : orders;

  const getDailyData = () => {
    const interval = dateRange?.from && dateRange?.to
      ? { start: dateRange.from, end: dateRange.to }
      : { start: subDays(new Date(), 6), end: new Date() };
    
    const days = eachDayOfInterval(interval);

    return days.map((day) => {
      const dayReceipts = filteredReceipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return format(receiptDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });
      const dayExpenses = filteredExpenses.filter((e) => {
        return format(new Date(e.expense_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd");
      });
      const revenue = dayReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
      const expenseTotal = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        name: format(day, "dd"),
        fullDate: format(day, "MMM d, yyyy"),
        revenue,
        expenses: expenseTotal,
        profit: revenue - expenseTotal,
      };
    });
  };

  const getWeeklyData = () => {
    const interval = dateRange?.from && dateRange?.to
      ? { start: dateRange.from, end: dateRange.to }
      : { start: subDays(new Date(), 56), end: new Date() };
    
    const weeks = eachWeekOfInterval(interval);

    return weeks.map((weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const weekReceipts = filteredReceipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return isWithinInterval(receiptDate, { start: weekStart, end: weekEnd });
      });
      const weekExpenses = filteredExpenses.filter((e) => {
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
    const interval = dateRange?.from && dateRange?.to
      ? { start: startOfMonth(dateRange.from), end: endOfMonth(dateRange.to) }
      : { start: subMonths(new Date(), 5), end: new Date() };
    
    const months = eachMonthOfInterval(interval);

    return months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthReceipts = filteredReceipts.filter((r) => {
        const receiptDate = new Date(r.issued_at);
        return isWithinInterval(receiptDate, { start: monthStart, end: monthEnd });
      });
      const monthExpenses = filteredExpenses.filter((e) => {
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

  const totalRevenue = filteredReceipts.reduce((sum, r) => sum + r.amount_paid, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalBankTransfers = filteredTransfers.reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const cashOnHand = totalRevenue - totalBankTransfers;
  
  const periodRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const periodExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
  const periodProfit = periodRevenue - periodExpenses;
  
  const completedOrders = filteredOrders.filter((o) => o.status === "completed").length;
  const laundryOrders = filteredOrders.filter((o) => o.order_type === "laundry").length;
  const merchandiseOrders = filteredOrders.filter((o) => o.order_type === "merchandise").length;

  // Loan & credit summaries
  const totalCreditsOwed = credits.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount), 0);
  const pendingCreditsCount = credits.filter((c) => c.status === "pending").length;

  // Expense breakdown by category
  const expenseByCategory = filteredExpenses.reduce((acc, exp) => {
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

  const dateRangeText = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
      : format(dateRange.from, "MMM d, yyyy")
    : "All time";

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Financial Reports</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Track revenue, expenses, and profit/loss
            </p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{dateRangeText}</span>
                  <span className="sm:hidden">
                    {dateRange?.from ? format(dateRange.from, "MM/dd") : "Filter"}
                    {dateRange?.to ? ` - ${format(dateRange.to, "MM/dd")}` : ""}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDateRange(undefined)}
                className="h-9 w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Date Range Indicator */}
        {dateRange?.from && (
          <div className="rounded-lg bg-muted/50 px-4 py-2 text-sm">
            <span className="font-medium">Showing data for:</span>{" "}
            <span className="text-muted-foreground">{dateRangeText}</span>
          </div>
        )}

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

        {/* Overdue Alerts */}
        <OverdueAlerts businessLoans={businessLoans} />

        {/* Loan Summary */}
        <LoanSummaryCards
          customerLoans={customerLoans}
          businessLoans={businessLoans}
          totalCreditsOwed={totalCreditsOwed}
          pendingCreditsCount={pendingCreditsCount}
        />

        {/* Payment History */}
        <PaymentHistory
          customerLoans={customerLoans}
          customerPayments={customerPayments}
          businessLoans={businessLoans}
          businessPayments={businessPayments}
        />
      </div>
    </MainLayout>
  );
}
