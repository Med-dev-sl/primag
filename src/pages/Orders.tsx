import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useOrders, useCreateOrder, useUpdateOrderStatus, Order } from "@/hooks/useOrders";
import { useMerchandise } from "@/hooks/useMerchandise";
import { useLaundryServices } from "@/hooks/useLaundryServices";
import { useCustomers } from "@/hooks/useCustomers";
import { useNotifyPickup } from "@/hooks/useNotifyPickup";
import { formatCurrency } from "@/lib/currency";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { Plus, ShoppingCart, Trash2, Mail } from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  processing: "bg-info/20 text-info border-info/30",
  ready: "bg-accent/20 text-accent border-accent/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

interface OrderItemInput {
  item_type: "merchandise" | "laundry";
  merchandise_id: string | null;
  laundry_service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function OrdersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: merchandise = [] } = useMerchandise();
  const { data: laundryServices = [] } = useLaundryServices();
  const { data: customers = [] } = useCustomers();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const notifyPickup = useNotifyPickup();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [orderType, setOrderType] = useState<"merchandise" | "laundry" | "mixed">("merchandise");
  const [customerId, setCustomerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItemInput[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customers?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesType = typeFilter === "all" || order.order_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "total_high":
          return b.total - a.total;
        case "total_low":
          return a.total - b.total;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const addItem = () => {
    if (!selectedItem) return;

    let newItem: OrderItemInput;

    if (orderType === "laundry") {
      const service = laundryServices.find(s => s.id === selectedItem);
      if (!service) return;
      newItem = {
        item_type: "laundry",
        merchandise_id: null,
        laundry_service_id: service.id,
        description: service.name,
        quantity,
        unit_price: service.price_per_unit,
        total: service.price_per_unit * quantity,
      };
    } else {
      const item = merchandise.find(m => m.id === selectedItem);
      if (!item) return;
      newItem = {
        item_type: "merchandise",
        merchandise_id: item.id,
        laundry_service_id: null,
        description: item.name,
        quantity,
        unit_price: item.unit_price,
        total: item.unit_price * quantity,
      };
    }

    setItems([...items, newItem]);
    setSelectedItem("");
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    createOrder.mutate({
      order_type: orderType,
      customer_id: customerId || null,
      notes,
      items,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setItems([]);
        setCustomerId("");
        setNotes("");
      }
    });
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);

  const handleNotifyPickup = (order: Order) => {
    if (!order.customers?.email) {
      return;
    }
    
    notifyPickup.mutate({
      orderId: order.id,
      customerEmail: order.customers.email,
      customerName: order.customers.name,
      orderNumber: order.order_number,
    });
  };

  const handleStatusChange = (order: Order, newStatus: Order["status"]) => {
    updateStatus.mutate({ id: order.id, status: newStatus }, {
      onSuccess: () => {
        // Auto-notify when status changes to "ready"
        if (newStatus === "ready" && order.customers?.email) {
          handleNotifyPickup(order);
        }
      }
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground">
              Manage customer orders and track progress
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Type *</Label>
                    <Select value={orderType} onValueChange={(v) => setOrderType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                        <SelectItem value="laundry">Laundry</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Customer (optional)</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Walk-in customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Add Items */}
                <div className="space-y-2">
                  <Label>Add Items</Label>
                  <div className="flex gap-2">
                    <Select value={selectedItem} onValueChange={setSelectedItem}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={orderType === "laundry" ? "Select service..." : "Select item..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {orderType === "laundry" 
                          ? laundryServices.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} - {formatCurrency(s.price_per_unit)}/{s.unit_type}
                              </SelectItem>
                            ))
                          : merchandise.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.name} - {formatCurrency(m.unit_price)} ({m.quantity} in stock)
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button type="button" onClick={addItem}>Add</Button>
                  </div>
                </div>

                {/* Items List */}
                {items.length > 0 && (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                          <TableRow>
                            <TableCell colSpan={3} className="font-medium">Subtotal</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(subtotal)}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={items.length === 0 || createOrder.isPending}
                >
                  {createOrder.isPending ? "Creating..." : "Create Order"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <OrderFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
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
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-muted-foreground">No orders found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.customers?.name || "Walk-in"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{order.order_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={order.status} 
                            onValueChange={(status) => handleStatusChange(order, status as Order["status"])}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="ready">Ready</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          {order.status === "ready" && order.customers?.email && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleNotifyPickup(order)}
                              disabled={notifyPickup.isPending}
                              title="Send pickup notification"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
