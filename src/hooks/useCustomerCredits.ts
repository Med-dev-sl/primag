import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerCredit {
  id: string;
  customer_id: string;
  amount: number;
  reason: string | null;
  order_id: string | null;
  status: string;
  created_at: string;
  redeemed_at: string | null;
  customers?: {
    id: string;
    name: string;
    phone: string | null;
  };
}

export function useCustomerCredits() {
  const queryClient = useQueryClient();

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ["customer_credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_credits")
        .select("*, customers(id, name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomerCredit[];
    },
  });

  const addCredit = useMutation({
    mutationFn: async (credit: { 
      customer_id: string; 
      amount: number; 
      reason?: string;
      order_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("customer_credits")
        .insert(credit)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_credits"] });
      toast.success("Credit recorded successfully");
    },
    onError: (error) => toast.error("Failed to record credit: " + error.message),
  });

  const redeemCredit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_credits")
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_credits"] });
      toast.success("Credit redeemed successfully");
    },
    onError: (error) => toast.error("Failed to redeem credit: " + error.message),
  });

  const deleteCredit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_credits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_credits"] });
      toast.success("Credit deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete credit: " + error.message),
  });

  return { credits, isLoading, addCredit, redeemCredit, deleteCredit };
}
