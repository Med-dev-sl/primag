import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { History } from "lucide-react";
import type { CustomerLoan, CustomerLoanPayment } from "@/hooks/useCustomerLoans";
import type { BusinessLoan, BusinessLoanPayment } from "@/hooks/useBusinessLoans";

interface PaymentHistoryProps {
  customerLoans: CustomerLoan[];
  customerPayments: CustomerLoanPayment[];
  businessLoans: BusinessLoan[];
  businessPayments: BusinessLoanPayment[];
}

interface UnifiedPayment {
  id: string;
  type: "customer" | "business";
  loanLabel: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

export function PaymentHistory({
  customerLoans,
  customerPayments,
  businessLoans,
  businessPayments,
}: PaymentHistoryProps) {
  const customerLoansMap = Object.fromEntries(customerLoans.map((l) => [l.id, l]));
  const businessLoansMap = Object.fromEntries(businessLoans.map((l) => [l.id, l]));

  const unified: UnifiedPayment[] = [
    ...customerPayments.map((p) => ({
      id: p.id,
      type: "customer" as const,
      loanLabel: customerLoansMap[p.loan_id]?.customers?.name || "Unknown",
      amount: p.amount,
      payment_date: p.payment_date,
      notes: p.notes,
    })),
    ...businessPayments.map((p) => ({
      id: p.id,
      type: "business" as const,
      loanLabel: businessLoansMap[p.loan_id]?.lender_name || "Unknown",
      amount: p.amount,
      payment_date: p.payment_date,
      notes: p.notes,
    })),
  ].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {unified.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No loan payments recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loan / Lender</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unified.slice(0, 20).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(p.payment_date), "dd/MM/yy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.type === "customer" ? "outline" : "secondary"}>
                        {p.type === "customer" ? "Customer" : "Business"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{p.loanLabel}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate sm:table-cell text-muted-foreground">
                      {p.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
