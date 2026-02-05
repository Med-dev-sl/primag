import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCustomerLoans } from "@/hooks/useCustomerLoans";
import { useBusinessLoans } from "@/hooks/useBusinessLoans";
import { useCustomerCredits } from "@/hooks/useCustomerCredits";
import { useCustomers } from "@/hooks/useCustomers";
import { useUserRole } from "@/hooks/useUserRole";
import { formatCurrency } from "@/lib/currency";
import { Plus, Trash2, CreditCard, Building2, Users, Coins, CircleDollarSign } from "lucide-react";
import { format } from "date-fns";

export default function LoansPage() {
  const { loans: customerLoans, payments: customerPayments, addLoan: addCustomerLoan, addPayment: addCustomerPayment, deleteLoan: deleteCustomerLoan, isLoading: customerLoansLoading } = useCustomerLoans();
  const { loans: businessLoans, payments: businessPayments, addLoan: addBusinessLoan, addPayment: addBusinessPayment, deleteLoan: deleteBusinessLoan, isLoading: businessLoansLoading } = useBusinessLoans();
  const { credits, addCredit, redeemCredit, deleteCredit, isLoading: creditsLoading } = useCustomerCredits();
  const { data: customers = [] } = useCustomers();
  const { isAdmin } = useUserRole();

  const [customerLoanDialog, setCustomerLoanDialog] = useState(false);
  const [customerPaymentDialog, setCustomerPaymentDialog] = useState(false);
  const [businessLoanDialog, setBusinessLoanDialog] = useState(false);
  const [businessPaymentDialog, setBusinessPaymentDialog] = useState(false);
  const [creditDialog, setCreditDialog] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState("");

  const [customerLoanForm, setCustomerLoanForm] = useState({
    customer_id: "",
    amount: 0,
    reason: "",
    loan_date: format(new Date(), "yyyy-MM-dd"),
  });

  const [businessLoanForm, setBusinessLoanForm] = useState({
    lender_name: "",
    amount: 0,
    interest_rate: 0,
    reason: "",
    loan_date: format(new Date(), "yyyy-MM-dd"),
    due_date: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    payment_date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });

  const [creditForm, setCreditForm] = useState({
    customer_id: "",
    amount: 0,
    reason: "",
  });

  const totalCustomerLoansOutstanding = customerLoans.filter(l => l.status === 'active').reduce((sum, l) => sum + Number(l.balance), 0);
  const totalBusinessLoansOutstanding = businessLoans.filter(l => l.status === 'active').reduce((sum, l) => sum + Number(l.balance), 0);
  const totalCreditsOwed = credits.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0);

  const handleAddCustomerLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomerLoan.mutateAsync(customerLoanForm);
    setCustomerLoanForm({ customer_id: "", amount: 0, reason: "", loan_date: format(new Date(), "yyyy-MM-dd") });
    setCustomerLoanDialog(false);
  };

  const handleAddBusinessLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBusinessLoan.mutateAsync(businessLoanForm);
    setBusinessLoanForm({ lender_name: "", amount: 0, interest_rate: 0, reason: "", loan_date: format(new Date(), "yyyy-MM-dd"), due_date: "" });
    setBusinessLoanDialog(false);
  };

  const handleAddCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomerPayment.mutateAsync({ loan_id: selectedLoanId, ...paymentForm });
    setPaymentForm({ amount: 0, payment_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setCustomerPaymentDialog(false);
  };

  const handleAddBusinessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await addBusinessPayment.mutateAsync({ loan_id: selectedLoanId, ...paymentForm });
    setPaymentForm({ amount: 0, payment_date: format(new Date(), "yyyy-MM-dd"), notes: "" });
    setBusinessPaymentDialog(false);
  };

  const handleAddCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCredit.mutateAsync(creditForm);
    setCreditForm({ customer_id: "", amount: 0, reason: "" });
    setCreditDialog(false);
  };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Loans & Credits</h1>
          <p className="text-sm text-muted-foreground md:text-base">Manage customer loans, business loans, and customer credits</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Loans Outstanding</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive md:text-2xl">{formatCurrency(totalCustomerLoansOutstanding)}</div>
              <p className="text-xs text-muted-foreground">{customerLoans.filter(l => l.status === 'active').length} active loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Business Loans Owed</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive md:text-2xl">{formatCurrency(totalBusinessLoansOutstanding)}</div>
              <p className="text-xs text-muted-foreground">{businessLoans.filter(l => l.status === 'active').length} active loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits to Give</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-primary md:text-2xl">{formatCurrency(totalCreditsOwed)}</div>
              <p className="text-xs text-muted-foreground">{credits.filter(c => c.status === 'pending').length} pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="customer-loans" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer-loans" className="text-xs sm:text-sm">Customer Loans</TabsTrigger>
            <TabsTrigger value="business-loans" className="text-xs sm:text-sm">Business Loans</TabsTrigger>
            <TabsTrigger value="credits" className="text-xs sm:text-sm">Credits</TabsTrigger>
          </TabsList>

          {/* Customer Loans Tab */}
          <TabsContent value="customer-loans">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Loans
                </CardTitle>
                <Dialog open={customerLoanDialog} onOpenChange={setCustomerLoanDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      New Loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Customer Loan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomerLoan} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={customerLoanForm.customer_id} onValueChange={(v) => setCustomerLoanForm({ ...customerLoanForm, customer_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (SLE)</Label>
                        <Input type="number" min="0" step="0.01" value={customerLoanForm.amount || ""} onChange={(e) => setCustomerLoanForm({ ...customerLoanForm, amount: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={customerLoanForm.loan_date} onChange={(e) => setCustomerLoanForm({ ...customerLoanForm, loan_date: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Textarea value={customerLoanForm.reason} onChange={(e) => setCustomerLoanForm({ ...customerLoanForm, reason: e.target.value })} rows={2} />
                      </div>
                      <Button type="submit" className="w-full" disabled={addCustomerLoan.isPending}>
                        {addCustomerLoan.isPending ? "Saving..." : "Record Loan"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                {customerLoansLoading ? (
                  <p className="p-4 text-center text-muted-foreground">Loading...</p>
                ) : customerLoans.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No customer loans recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerLoans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{loan.customers?.name}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{format(new Date(loan.loan_date), "dd/MM/yy")}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(loan.loan_date), "dd/MM/yy")}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(loan.balance)}</TableCell>
                            <TableCell>
                              <Badge variant={loan.status === 'paid' ? 'default' : 'destructive'}>
                                {loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {loan.status === 'active' && (
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedLoanId(loan.id); setCustomerPaymentDialog(true); }}>
                                    Pay
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteCustomerLoan.mutate(loan.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Payment Dialog */}
            <Dialog open={customerPaymentDialog} onOpenChange={setCustomerPaymentDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCustomerPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (SLE)</Label>
                    <Input type="number" min="0" step="0.01" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={addCustomerPayment.isPending}>
                    {addCustomerPayment.isPending ? "Saving..." : "Record Payment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Business Loans Tab */}
          <TabsContent value="business-loans">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Loans
                </CardTitle>
                <Dialog open={businessLoanDialog} onOpenChange={setBusinessLoanDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      New Loan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Business Loan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddBusinessLoan} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Lender Name</Label>
                        <Input value={businessLoanForm.lender_name} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, lender_name: e.target.value })} placeholder="Bank or person name" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (SLE)</Label>
                        <Input type="number" min="0" step="0.01" value={businessLoanForm.amount || ""} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, amount: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Interest Rate % (Optional)</Label>
                        <Input type="number" min="0" step="0.1" value={businessLoanForm.interest_rate || ""} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, interest_rate: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Loan Date</Label>
                          <Input type="date" value={businessLoanForm.loan_date} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, loan_date: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" value={businessLoanForm.due_date} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, due_date: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Textarea value={businessLoanForm.reason} onChange={(e) => setBusinessLoanForm({ ...businessLoanForm, reason: e.target.value })} rows={2} />
                      </div>
                      <Button type="submit" className="w-full" disabled={addBusinessLoan.isPending}>
                        {addBusinessLoan.isPending ? "Saving..." : "Record Loan"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                {businessLoansLoading ? (
                  <p className="p-4 text-center text-muted-foreground">Loading...</p>
                ) : businessLoans.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No business loans recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lender</TableHead>
                          <TableHead className="hidden sm:table-cell">Date</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {businessLoans.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{loan.lender_name}</p>
                                <p className="text-xs text-muted-foreground sm:hidden">{format(new Date(loan.loan_date), "dd/MM/yy")}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{format(new Date(loan.loan_date), "dd/MM/yy")}</TableCell>
                            <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(loan.balance)}</TableCell>
                            <TableCell>
                              <Badge variant={loan.status === 'paid' ? 'default' : 'destructive'}>
                                {loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {loan.status === 'active' && (
                                  <Button variant="outline" size="sm" onClick={() => { setSelectedLoanId(loan.id); setBusinessPaymentDialog(true); }}>
                                    Pay
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteBusinessLoan.mutate(loan.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Business Payment Dialog */}
            <Dialog open={businessPaymentDialog} onOpenChange={setBusinessPaymentDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddBusinessPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (SLE)</Label>
                    <Input type="number" min="0" step="0.01" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={addBusinessPayment.isPending}>
                    {addBusinessPayment.isPending ? "Saving..." : "Record Payment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Customer Credits (Change Owed)
                </CardTitle>
                <Dialog open={creditDialog} onOpenChange={setCreditDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Credit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Record Customer Credit</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddCredit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select value={creditForm.customer_id} onValueChange={(v) => setCreditForm({ ...creditForm, customer_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount (SLE)</Label>
                        <Input type="number" min="0" step="0.01" value={creditForm.amount || ""} onChange={(e) => setCreditForm({ ...creditForm, amount: parseFloat(e.target.value) || 0 })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason (Optional)</Label>
                        <Textarea value={creditForm.reason} onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })} placeholder="e.g., Change from order #123" rows={2} />
                      </div>
                      <Button type="submit" className="w-full" disabled={addCredit.isPending}>
                        {addCredit.isPending ? "Saving..." : "Record Credit"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                {creditsLoading ? (
                  <p className="p-4 text-center text-muted-foreground">Loading...</p>
                ) : credits.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">No customer credits recorded</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead className="hidden sm:table-cell">Reason</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-28"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {credits.map((credit) => (
                          <TableRow key={credit.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{credit.customers?.name}</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(credit.created_at), "dd/MM/yy")}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                              {credit.reason || "-"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(credit.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={credit.status === 'redeemed' ? 'default' : 'secondary'}>
                                {credit.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {credit.status === 'pending' && (
                                  <Button variant="outline" size="sm" onClick={() => redeemCredit.mutate(credit.id)}>
                                    Give
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteCredit.mutate(credit.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
