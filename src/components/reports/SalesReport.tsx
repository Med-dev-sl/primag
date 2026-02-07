import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
} from "date-fns";
import { CalendarDays, TrendingUp } from "lucide-react";

interface Receipt {
  id: string;
  amount_paid: number;
  issued_at: string;
  orders?: {
    order_number: string;
    total: number;
    customers?: { name: string } | null;
  };
}

interface SalesReportProps {
  receipts: Receipt[];
}

export function SalesReport({ receipts }: SalesReportProps) {
  const now = new Date();

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const yearStart = startOfYear(now);
  const yearEnd = endOfYear(now);

  const filterReceipts = (start: Date, end: Date) =>
    receipts.filter((r) =>
      isWithinInterval(new Date(r.issued_at), { start, end })
    );

  const dailySales = filterReceipts(todayStart, todayEnd);
  const weeklySales = filterReceipts(weekStart, weekEnd);
  const monthlySales = filterReceipts(monthStart, monthEnd);
  const yearlySales = filterReceipts(yearStart, yearEnd);

  const sumSales = (list: Receipt[]) =>
    list.reduce((sum, r) => sum + r.amount_paid, 0);

  const periods = [
    {
      label: "Today",
      date: format(now, "MMM d, yyyy"),
      sales: dailySales,
      total: sumSales(dailySales),
      color: "text-primary",
    },
    {
      label: "This Week",
      date: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
      sales: weeklySales,
      total: sumSales(weeklySales),
      color: "text-primary",
    },
    {
      label: "This Month",
      date: format(now, "MMMM yyyy"),
      sales: monthlySales,
      total: sumSales(monthlySales),
      color: "text-primary",
    },
    {
      label: "This Year",
      date: format(now, "yyyy"),
      sales: yearlySales,
      total: sumSales(yearlySales),
      color: "text-primary",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Sales Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {periods.map((p) => (
            <div
              key={p.label}
              className="rounded-lg border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {p.label}
                </p>
                <Badge variant="outline" className="text-xs">
                  {p.sales.length} sale{p.sales.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <p className={`text-xl font-bold ${p.color}`}>
                {formatCurrency(p.total)}
              </p>
              <p className="text-xs text-muted-foreground">{p.date}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
