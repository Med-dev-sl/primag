import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  order_type: "merchandise" | "laundry" | "mixed";
  status: "pending" | "processing" | "ready" | "completed" | "cancelled";
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: "merchandise" | "laundry";
  merchandise_id: string | null;
  laundry_service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (name, phone, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderWithItems(orderId: string | undefined) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          customers (name, phone, email, address)
        `)
        .eq("id", orderId)
        .single();
      
      if (orderError) throw orderError;
      
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      
      if (itemsError) throw itemsError;
      
      return { ...order, items } as Order & { items: OrderItem[] };
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderData: {
      order_type: Order["order_type"];
      customer_id?: string | null;
      notes?: string;
      items: Omit<OrderItem, "id" | "order_id" | "created_at">[];
    }) => {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      
      // Calculate totals — no tax or interest applied
      const subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal;
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          order_type: orderData.order_type,
          customer_id: orderData.customer_id || null,
          notes: orderData.notes || null,
          subtotal,
          tax: 0,
          total,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const itemsToInsert = orderData.items.map(item => ({
        ...item,
        order_id: order.id,
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // Deduct merchandise stock for each merchandise item
      for (const item of orderData.items) {
        if (item.item_type === "merchandise" && item.merchandise_id) {
          const { data: currentItem } = await supabase
            .from("merchandise")
            .select("quantity")
            .eq("id", item.merchandise_id)
            .single();
          
          if (currentItem) {
            const newQty = Math.max(0, currentItem.quantity - item.quantity);
            await supabase
              .from("merchandise")
              .update({ quantity: newQty })
              .eq("id", item.merchandise_id);
          }
        }
      }
      
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["merchandise"] });
      toast.success("Order created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create order: " + error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Order["status"] }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order status updated");
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });
}
