import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { Users, Building2, Coins, AlertTriangle } from "lucide-react";
import type { CustomerLoan } from "@/hooks/useCustomerLoans";
import type { BusinessLoan } from "@/hooks/useBusinessLoans";

interface LoanSummaryCardsProps {
  customerLoans: CustomerLoan[];
  businessLoans: BusinessLoan[];
  totalCreditsOwed: number;
  pendingCreditsCount: number;
}

export function LoanSummaryCards({
  customerLoans,
  businessLoans,
  totalCreditsOwed,
  pendingCreditsCount,
}: LoanSummaryCardsProps) {
  const activeCustomerLoans = customerLoans.filter((l) => l.status === "active");
  const activeBusinessLoans = businessLoans.filter((l) => l.status === "active");
  const totalCustomerOutstanding = activeCustomerLoans.reduce((sum, l) => sum + Number(l.balance), 0);
  const totalBusinessOutstanding = activeBusinessLoans.reduce((sum, l) => sum + Number(l.balance), 0);

  const overdueLoans = activeBusinessLoans.filter((l) => {
    if (!l.due_date) return false;
    return new Date(l.due_date) < new Date();
  });

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Customer Loans Out</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-destructive md:text-xl">
            {formatCurrency(totalCustomerOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeCustomerLoans.length} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Business Loans Owed</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-destructive md:text-xl">
            {formatCurrency(totalBusinessOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground">
            {activeBusinessLoans.length} active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Credits Owed</CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-primary md:text-xl">
            {formatCurrency(totalCreditsOwed)}
          </div>
          <p className="text-xs text-muted-foreground">{pendingCreditsCount} pending</p>
        </CardContent>
      </Card>

      <Card className={overdueLoans.length > 0 ? "border-destructive/50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium">Overdue Loans</CardTitle>
          <AlertTriangle
            className={`h-4 w-4 ${overdueLoans.length > 0 ? "text-destructive" : "text-muted-foreground"}`}
          />
        </CardHeader>
        <CardContent>
          <div
            className={`text-lg font-bold md:text-xl ${overdueLoans.length > 0 ? "text-destructive" : "text-muted-foreground"}`}
          >
            {overdueLoans.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {overdueLoans.length > 0
              ? `${formatCurrency(overdueLoans.reduce((s, l) => s + Number(l.balance), 0))} overdue`
              : "No overdue loans"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
