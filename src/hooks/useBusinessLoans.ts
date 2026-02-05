import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessLoan {
  id: string;
  lender_name: string;
  amount: number;
  balance: number;
  interest_rate: number | null;
  reason: string | null;
  loan_date: string;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessLoanPayment {
  id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

export function useBusinessLoans() {
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["business_loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_loans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BusinessLoan[];
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["business_loan_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_loan_payments")
        .select("*")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as BusinessLoanPayment[];
    },
  });

  const addLoan = useMutation({
    mutationFn: async (loan: { 
      lender_name: string; 
      amount: number; 
      interest_rate?: number;
      reason?: string; 
      loan_date: string;
      due_date?: string;
    }) => {
      const { data, error } = await supabase
        .from("business_loans")
        .insert({ 
          lender_name: loan.lender_name,
          amount: loan.amount,
          balance: loan.amount,
          interest_rate: loan.interest_rate || null,
          reason: loan.reason || null,
          loan_date: loan.loan_date,
          due_date: loan.due_date || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_loans"] });
      toast.success("Business loan recorded successfully");
    },
    onError: (error) => toast.error("Failed to record loan: " + error.message),
  });

  const addPayment = useMutation({
    mutationFn: async (payment: { loan_id: string; amount: number; payment_date: string; notes?: string }) => {
      const { data: loan } = await supabase
        .from("business_loans")
        .select("balance")
        .eq("id", payment.loan_id)
        .single();
      
      if (!loan) throw new Error("Loan not found");
      
      const newBalance = Number(loan.balance) - payment.amount;
      
      const { error: paymentError } = await supabase
        .from("business_loan_payments")
        .insert(payment);
      if (paymentError) throw paymentError;
      
      const { error: updateError } = await supabase
        .from("business_loans")
        .update({ 
          balance: newBalance,
          status: newBalance <= 0 ? 'paid' : 'active'
        })
        .eq("id", payment.loan_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_loans"] });
      queryClient.invalidateQueries({ queryKey: ["business_loan_payments"] });
      toast.success("Payment recorded successfully");
    },
    onError: (error) => toast.error("Failed to record payment: " + error.message),
  });

  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("business_loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business_loans"] });
      toast.success("Loan deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete loan: " + error.message),
  });

  return { loans, payments, isLoading, addLoan, addPayment, deleteLoan };
}
