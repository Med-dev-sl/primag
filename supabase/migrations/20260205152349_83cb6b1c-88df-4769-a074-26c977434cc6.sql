-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash_to_bank table
CREATE TABLE public.cash_to_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT,
  reference_number TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_to_bank ENABLE ROW LEVEL SECURITY;

-- RLS policies for expenses
CREATE POLICY "Allow authenticated read access to expenses" ON public.expenses FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert access to expenses" ON public.expenses FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Allow authenticated update access to expenses" ON public.expenses FOR UPDATE USING (is_authenticated());
CREATE POLICY "Admins can delete expenses" ON public.expenses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for cash_to_bank
CREATE POLICY "Allow authenticated read access to cash_to_bank" ON public.cash_to_bank FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert access to cash_to_bank" ON public.cash_to_bank FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Allow authenticated update access to cash_to_bank" ON public.cash_to_bank FOR UPDATE USING (is_authenticated());
CREATE POLICY "Admins can delete cash_to_bank" ON public.cash_to_bank FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for expenses updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();