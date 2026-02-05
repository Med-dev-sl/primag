import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReceipts, useCreateReceipt } from "@/hooks/useReceipts";
import { useOrders, useOrderWithItems } from "@/hooks/useOrders";
import { Receipt, Printer, Share2, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ReceiptsPage() {
  const { data: receipts = [], isLoading } = useReceipts();
  const { data: orders = [] } = useOrders();
  const createReceipt = useCreateReceipt();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedReceiptOrderId, setSelectedReceiptOrderId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(0);

  const { data: selectedOrder } = useOrderWithItems(selectedReceiptOrderId);

  const pendingOrders = orders.filter(o => o.status !== "completed" && o.status !== "cancelled");
  const selectedPendingOrder = pendingOrders.find(o => o.id === selectedOrderId);

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendingOrder) return;

    const changeGiven = amountPaid - selectedPendingOrder.total;
    if (changeGiven < 0) {
      toast.error("Amount paid is less than total");
      return;
    }

    createReceipt.mutate({
      order_id: selectedOrderId,
      payment_method: paymentMethod,
      amount_paid: amountPaid,
      change_given: changeGiven,
    }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setSelectedOrderId("");
        setAmountPaid(0);
      }
    });
  };

  const handleViewReceipt = (orderId: string) => {
    setSelectedReceiptOrderId(orderId);
    setIsViewDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!selectedOrder) return;
    
    const receiptText = `
Receipt - MerchLaundry
Order: ${selectedOrder.order_number}
Date: ${format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}
${selectedOrder.customers ? `Customer: ${selectedOrder.customers.name}` : "Walk-in Customer"}

Items:
${selectedOrder.items?.map(item => `- ${item.description} x${item.quantity}: $${item.total.toFixed(2)}`).join("\n")}

Subtotal: $${selectedOrder.subtotal.toFixed(2)}
Tax (10%): $${selectedOrder.tax.toFixed(2)}
Total: $${selectedOrder.total.toFixed(2)}

Thank you for your business!
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${selectedOrder.order_number}`,
          text: receiptText,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(receiptText);
      toast.success("Receipt copied to clipboard");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
            <p className="text-muted-foreground">
              Generate and manage payment receipts
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={pendingOrders.length === 0}>
            <Receipt className="mr-2 h-4 w-4" />
            Generate Receipt
          </Button>
        </div>

        {/* Create Receipt Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate Receipt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateReceipt} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Order *</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - ${order.total.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPendingOrder && (
                <>
                  <div className="rounded-lg bg-muted p-4 space-y-1">
                    <p className="text-sm text-muted-foreground">Order Total</p>
                    <p className="text-2xl font-bold">${selectedPendingOrder.total.toFixed(2)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount Paid *</Label>
                    <Input
                      type="number"
                      min={selectedPendingOrder.total}
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>

                  {amountPaid >= selectedPendingOrder.total && (
                    <div className="rounded-lg bg-success/10 p-4">
                      <p className="text-sm text-success">Change to give: ${(amountPaid - selectedPendingOrder.total).toFixed(2)}</p>
                    </div>
                  )}
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!selectedOrderId || amountPaid < (selectedPendingOrder?.total || 0) || createReceipt.isPending}
              >
                {createReceipt.isPending ? "Generating..." : "Generate Receipt"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Receipt Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Receipt</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <div className="space-y-4 print:p-4">
                <div className="text-center border-b pb-4">
                  <h2 className="text-xl font-bold">MerchLaundry</h2>
                  <p className="text-sm text-muted-foreground">Business Manager</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order #</span>
                    <span className="font-medium">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{format(new Date(selectedOrder.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  {selectedOrder.customers && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span>{selectedOrder.customers.name}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%)</span>
                    <span>${selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground border-t pt-4">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipts Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">No receipts generated yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                      <TableCell>{receipt.orders?.order_number}</TableCell>
                      <TableCell>{receipt.orders?.customers?.name || "Walk-in"}</TableCell>
                      <TableCell className="capitalize">{receipt.payment_method}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${receipt.amount_paid.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(receipt.issued_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewReceipt(receipt.order_id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
