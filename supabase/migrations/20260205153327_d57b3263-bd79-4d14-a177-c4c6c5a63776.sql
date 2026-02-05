-- Customer loans table (loans given to customers)
CREATE TABLE public.customer_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  reason TEXT,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer loan payments table
CREATE TABLE public.customer_loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES public.customer_loans(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business loans table (loans taken by business)
CREATE TABLE public.business_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lender_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  interest_rate NUMERIC DEFAULT 0,
  reason TEXT,
  loan_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business loan payments table
CREATE TABLE public.business_loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID REFERENCES public.business_loans(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Customer credits table (change owed to customers)
CREATE TABLE public.customer_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.customer_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_loans
CREATE POLICY "Allow authenticated read customer_loans" ON public.customer_loans FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert customer_loans" ON public.customer_loans FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Allow authenticated update customer_loans" ON public.customer_loans FOR UPDATE USING (is_authenticated());
CREATE POLICY "Admins can delete customer_loans" ON public.customer_loans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for customer_loan_payments
CREATE POLICY "Allow authenticated read customer_loan_payments" ON public.customer_loan_payments FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert customer_loan_payments" ON public.customer_loan_payments FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Admins can delete customer_loan_payments" ON public.customer_loan_payments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for business_loans
CREATE POLICY "Allow authenticated read business_loans" ON public.business_loans FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert business_loans" ON public.business_loans FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Allow authenticated update business_loans" ON public.business_loans FOR UPDATE USING (is_authenticated());
CREATE POLICY "Admins can delete business_loans" ON public.business_loans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for business_loan_payments
CREATE POLICY "Allow authenticated read business_loan_payments" ON public.business_loan_payments FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert business_loan_payments" ON public.business_loan_payments FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Admins can delete business_loan_payments" ON public.business_loan_payments FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for customer_credits
CREATE POLICY "Allow authenticated read customer_credits" ON public.customer_credits FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert customer_credits" ON public.customer_credits FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Allow authenticated update customer_credits" ON public.customer_credits FOR UPDATE USING (is_authenticated());
CREATE POLICY "Admins can delete customer_credits" ON public.customer_credits FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at
CREATE TRIGGER update_customer_loans_updated_at
  BEFORE UPDATE ON public.customer_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_loans_updated_at
  BEFORE UPDATE ON public.business_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();