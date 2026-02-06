import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/currency";
import { AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { BusinessLoan } from "@/hooks/useBusinessLoans";

interface OverdueAlertsProps {
  businessLoans: BusinessLoan[];
}

export function OverdueAlerts({ businessLoans }: OverdueAlertsProps) {
  const now = new Date();

  const overdueLoans = businessLoans
    .filter((l) => l.status === "active" && l.due_date && new Date(l.due_date) < now)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  const upcomingLoans = businessLoans
    .filter((l) => {
      if (l.status !== "active" || !l.due_date) return false;
      const due = new Date(l.due_date);
      const daysUntil = differenceInDays(due, now);
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

  if (overdueLoans.length === 0 && upcomingLoans.length === 0) return null;

  return (
    <div className="space-y-2">
      {overdueLoans.map((loan) => (
        <Alert key={loan.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Overdue Loan</AlertTitle>
          <AlertDescription>
            <span className="font-medium">{loan.lender_name}</span> —{" "}
            {formatCurrency(Number(loan.balance))} outstanding, was due{" "}
            {format(new Date(loan.due_date!), "MMM d, yyyy")} (
            {differenceInDays(now, new Date(loan.due_date!))} days overdue)
          </AlertDescription>
        </Alert>
      ))}
      {upcomingLoans.map((loan) => (
        <Alert key={loan.id} className="border-warning/50 bg-warning/10 text-warning-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-foreground">Due Soon</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            <span className="font-medium">{loan.lender_name}</span> —{" "}
            {formatCurrency(Number(loan.balance))} due{" "}
            {format(new Date(loan.due_date!), "MMM d, yyyy")} (
            {differenceInDays(new Date(loan.due_date!), now)} days left)
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
