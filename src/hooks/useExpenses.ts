import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes?: string;
}

export function useExpenses() {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const addExpense = useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert(expense)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded successfully");
    },
    onError: (error) => {
      toast.error("Failed to record expense: " + error.message);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from("expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update expense: " + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete expense: " + error.message);
    },
  });

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
