-- Create merchandise inventory table
CREATE TABLE public.merchandise (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  sku TEXT UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create laundry services table
CREATE TABLE public.laundry_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_per_unit DECIMAL(10,2) NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'piece',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table (for both merchandise and laundry)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('merchandise', 'laundry', 'mixed')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('merchandise', 'laundry')),
  merchandise_id UUID REFERENCES public.merchandise(id),
  laundry_service_id UUID REFERENCES public.laundry_services(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  payment_method TEXT DEFAULT 'cash',
  amount_paid DECIMAL(10,2) NOT NULL,
  change_given DECIMAL(10,2) DEFAULT 0
);

-- Enable RLS on all tables
ALTER TABLE public.merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this business system)
CREATE POLICY "Allow public read access to merchandise" ON public.merchandise FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to merchandise" ON public.merchandise FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to merchandise" ON public.merchandise FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to merchandise" ON public.merchandise FOR DELETE USING (true);

CREATE POLICY "Allow public read access to laundry_services" ON public.laundry_services FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to laundry_services" ON public.laundry_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to laundry_services" ON public.laundry_services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to laundry_services" ON public.laundry_services FOR DELETE USING (true);

CREATE POLICY "Allow public read access to customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to customers" ON public.customers FOR DELETE USING (true);

CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to orders" ON public.orders FOR DELETE USING (true);

CREATE POLICY "Allow public read access to order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to order_items" ON public.order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to order_items" ON public.order_items FOR DELETE USING (true);

CREATE POLICY "Allow public read access to receipts" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to receipts" ON public.receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to receipts" ON public.receipts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to receipts" ON public.receipts FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_merchandise_updated_at
  BEFORE UPDATE ON public.merchandise
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default laundry services
INSERT INTO public.laundry_services (name, description, price_per_unit, unit_type) VALUES
  ('Wash & Fold', 'Standard wash and fold service', 2.50, 'kg'),
  ('Dry Cleaning', 'Professional dry cleaning', 8.00, 'piece'),
  ('Ironing', 'Steam pressing and ironing', 3.00, 'piece'),
  ('Stain Removal', 'Special stain treatment', 5.00, 'piece');