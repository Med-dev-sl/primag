import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCashToBank, CashToBankInsert } from "@/hooks/useCashToBank";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/currency";
import { Plus, Trash2, Landmark, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function CashToBank() {
  const { transfers, isLoading, addTransfer, deleteTransfer } = useCashToBank();
  const { isAdmin } = useUserRole();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CashToBankInsert>({
    amount: 0,
    bank_name: "",
    account_number: "",
    reference_number: "",
    transfer_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTransfer.mutateAsync(formData);
    setFormData({
      amount: 0,
      bank_name: "",
      account_number: "",
      reference_number: "",
      transfer_date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
    setIsDialogOpen(false);
  };

  const totalTransferred = transfers.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cash to Bank</h1>
            <p className="text-sm text-muted-foreground md:text-base">Record cash deposits to bank accounts</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Record Cash to Bank Transfer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (SLE)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="e.g., Sierra Leone Commercial Bank"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number (Optional)</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number || ""}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_number">Reference Number (Optional)</Label>
                  <Input
                    id="reference_number"
                    value={formData.reference_number || ""}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="Bank reference/slip number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transfer_date">Transfer Date</Label>
                  <Input
                    id="transfer_date"
                    type="date"
                    value={formData.transfer_date}
                    onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addTransfer.isPending}>
                  {addTransfer.isPending ? "Saving..." : "Record Transfer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Landmark className="h-5 w-5" />
              Total Deposited to Bank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              <p className="text-2xl font-bold text-primary md:text-3xl">{formatCurrency(totalTransferred)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Transfers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-6">
            {isLoading ? (
              <p className="p-4 text-center text-muted-foreground">Loading transfers...</p>
            ) : transfers.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground">No transfers recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead className="hidden md:table-cell">Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {isAdmin && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(transfer.transfer_date), "dd/MM/yy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transfer.bank_name}</p>
                            {transfer.account_number && (
                              <p className="text-xs text-muted-foreground">Acc: {transfer.account_number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {transfer.reference_number || "-"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          {formatCurrency(transfer.amount)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTransfer.mutate(transfer.id)}
                              disabled={deleteTransfer.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
