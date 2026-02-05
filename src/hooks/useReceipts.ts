import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Receipt {
  id: string;
  receipt_number: string;
  order_id: string;
  issued_at: string;
  payment_method: string | null;
  amount_paid: number;
  change_given: number | null;
  orders?: {
    order_number: string;
    total: number;
    customers?: {
      name: string;
    } | null;
  };
}

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select(`
          *,
          orders (
            order_number,
            total,
            customers (name)
          )
        `)
        .order("issued_at", { ascending: false });
      
      if (error) throw error;
      return data as Receipt[];
    },
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (receiptData: {
      order_id: string;
      payment_method: string;
      amount_paid: number;
      change_given: number;
    }) => {
      const receiptNumber = `RCP-${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from("receipts")
        .insert({
          ...receiptData,
          receipt_number: receiptNumber,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update order status to completed
      await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", receiptData.order_id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Receipt generated successfully");
    },
    onError: (error) => {
      toast.error("Failed to generate receipt: " + error.message);
    },
  });
}
