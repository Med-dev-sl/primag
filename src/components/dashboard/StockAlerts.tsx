import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { useMerchandise } from "@/hooks/useMerchandise";
import { AlertTriangle, Package, DollarSign } from "lucide-react";
import { NavLink } from "react-router-dom";

const LOW_STOCK_THRESHOLD = 10;

export function StockAlerts() {
  const { data: merchandise = [] } = useMerchandise();

  const lowStockItems = merchandise.filter(
    (item) => item.quantity <= LOW_STOCK_THRESHOLD
  );
  const outOfStockItems = merchandise.filter((item) => item.quantity === 0);
  const totalStockValue = merchandise.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const totalUnits = merchandise.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Stock Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Stock Value */}
        <div className="grid gap-3 grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <DollarSign className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Stock Value</p>
              <p className="text-xl font-bold">{formatCurrency(totalStockValue)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="text-xl font-bold">{totalUnits}</p>
              <p className="text-xs text-muted-foreground">{merchandise.length} items</p>
            </div>
          </div>
        </div>

        {/* Out of Stock Alerts */}
        {outOfStockItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-destructive">
              Out of Stock ({outOfStockItems.length})
            </p>
            {outOfStockItems.map((item) => (
              <Alert key={item.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{item.name}</AlertTitle>
                <AlertDescription>
                  This item is out of stock. Restock needed.
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Low Stock Alerts */}
        {lowStockItems.filter((i) => i.quantity > 0).length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-warning">
              Low Stock ({lowStockItems.filter((i) => i.quantity > 0).length})
            </p>
            {lowStockItems
              .filter((i) => i.quantity > 0)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/10 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant="destructive">{item.quantity} left</Badge>
                </div>
              ))}
          </div>
        )}

        {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            All items are well-stocked ✓
          </p>
        )}

        <NavLink
          to="/merchandise"
          className="block text-center text-sm text-primary hover:underline pt-1"
        >
          View inventory →
        </NavLink>
      </CardContent>
    </Card>
  );
}
