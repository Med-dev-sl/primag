import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomerLoan {
  id: string;
  customer_id: string;
  amount: number;
  balance: number;
  reason: string | null;
  loan_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  customers?: {
    id: string;
    name: string;
    phone: string | null;
  };
}

export interface CustomerLoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export function useCustomerLoans() {
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["customer_loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_loans")
        .select("*, customers(id, name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CustomerLoan[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["customer_loan_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_loan_payments")
        .select("*")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as CustomerLoanPayment[];
    },
  });

  const addLoan = useMutation({
    mutationFn: async (loan: { customer_id: string; amount: number; reason?: string; loan_date: string }) => {
      const { data, error } = await supabase
        .from("customer_loans")
        .insert({ ...loan, balance: loan.amount })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_loans"] });
      toast.success("Loan recorded successfully");
    },
    onError: (error) => toast.error("Failed to record loan: " + error.message),
  });

  const addPayment = useMutation({
    mutationFn: async (payment: { loan_id: string; amount: number; payment_date: string; notes?: string }) => {
      // Get current loan balance
      const { data: loan } = await supabase
        .from("customer_loans")
        .select("balance")
        .eq("id", payment.loan_id)
        .single();
      
      if (!loan) throw new Error("Loan not found");
      
      const newBalance = Number(loan.balance) - payment.amount;
      
      // Insert payment
      const { error: paymentError } = await supabase
        .from("customer_loan_payments")
        .insert(payment);
      if (paymentError) throw paymentError;
      
      // Update loan balance
      const { error: updateError } = await supabase
        .from("customer_loans")
        .update({ 
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'active'
        })
        .eq("id", payment.loan_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_loans"] });
      queryClient.invalidateQueries({ queryKey: ["customer_loan_payments"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => toast.error("Failed to record payment: " + error.message),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer_loans"] });
      toast.success("Loan deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete loan: " + error.message),
  });

  return { loans, payments, isLoading, addLoan, addPayment, deleteLoan };
}
