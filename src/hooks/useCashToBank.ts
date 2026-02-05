import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CashToBank {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string | null;
  reference_number: string | null;
  transfer_date: string;
  notes: string | null;
  created_at: string;
}

export interface CashToBankInsert {
  amount: number;
  bank_name: string;
  account_number?: string;
  reference_number?: string;
  transfer_date: string;
  notes?: string;
}

export function useCashToBank() {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ["cash_to_bank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_to_bank")
        .select("*")
        .order("transfer_date", { ascending: false });
      if (error) throw error;
      return data as CashToBank[];
    },
  });

  const addTransfer = useMutation({
    mutationFn: async (transfer: CashToBankInsert) => {
      const { data, error } = await supabase
        .from("cash_to_bank")
        .insert(transfer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_to_bank"] });
      toast.success("Cash to bank transfer recorded");
    },
    onError: (error) => {
      toast.error("Failed to record transfer: " + error.message);
    },
  });

  const deleteTransfer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cash_to_bank").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash_to_bank"] });
      toast.success("Transfer deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete transfer: " + error.message);
    },
  });

  return {
    transfers,
    isLoading,
    addTransfer,
    deleteTransfer,
  };
}
