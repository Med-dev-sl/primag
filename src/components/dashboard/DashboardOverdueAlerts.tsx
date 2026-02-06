import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/currency";
import { AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useBusinessLoans } from "@/hooks/useBusinessLoans";
import { useCustomerLoans } from "@/hooks/useCustomerLoans";
import { NavLink } from "react-router-dom";

export function DashboardOverdueAlerts() {
  const { loans: businessLoans } = useBusinessLoans();
  const { loans: customerLoans } = useCustomerLoans();
  const now = new Date();

  const overdueBusinessLoans = businessLoans
    .filter((l) => l.status === "active" && l.due_date && new Date(l.due_date) < now)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const activeCustomerLoans = customerLoans.filter((l) => l.status === "active");
  const totalCustomerOutstanding = activeCustomerLoans.reduce((s, l) => s + Number(l.balance), 0);
  const totalBusinessOutstanding = businessLoans
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + Number(l.balance), 0);

  const hasAlerts = overdueBusinessLoans.length > 0 || activeCustomerLoans.length > 0;

  if (!hasAlerts) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className={`h-5 w-5 ${overdueBusinessLoans.length > 0 ? "text-destructive" : "text-warning"}`} />
          Loan Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overdueBusinessLoans.map((loan) => (
          <Alert key={loan.id} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Overdue: {loan.lender_name}</AlertTitle>
            <AlertDescription>
              {formatCurrency(Number(loan.balance))} outstanding — was due{" "}
              {format(new Date(loan.due_date!), "MMM d, yyyy")} (
              {differenceInDays(now, new Date(loan.due_date!))} days overdue)
            </AlertDescription>
          </Alert>
        ))}

        {totalCustomerOutstanding > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div>
              <p className="text-sm font-medium">Customer Loans Outstanding</p>
              <p className="text-xs text-muted-foreground">
                {activeCustomerLoans.length} active loan{activeCustomerLoans.length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(totalCustomerOutstanding)}
            </span>
          </div>
        )}

        {totalBusinessOutstanding > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-sm font-medium">Business Loans Owed</p>
              <p className="text-xs text-muted-foreground">
                {businessLoans.filter((l) => l.status === "active").length} active loan{businessLoans.filter((l) => l.status === "active").length !== 1 ? "s" : ""}
              </p>
            </div>
            <span className="text-lg font-bold text-destructive">
              {formatCurrency(totalBusinessOutstanding)}
            </span>
          </div>
        )}

        <NavLink
          to="/loans"
          className="block text-center text-sm text-primary hover:underline pt-1"
        >
          View all loans →
        </NavLink>
      </CardContent>
    </Card>
  );
}
