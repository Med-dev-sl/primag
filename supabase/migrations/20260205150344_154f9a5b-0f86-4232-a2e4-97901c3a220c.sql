-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- RLS policies for user_roles - only admins can manage roles
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  USING (public.is_authenticated());

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update merchandise policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to merchandise" ON public.merchandise;
CREATE POLICY "Admins can delete merchandise"
  ON public.merchandise FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update customers policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to customers" ON public.customers;
CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update orders policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update laundry_services policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to laundry_services" ON public.laundry_services;
CREATE POLICY "Admins can delete laundry_services"
  ON public.laundry_services FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update receipts policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to receipts" ON public.receipts;
CREATE POLICY "Admins can delete receipts"
  ON public.receipts FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update order_items policies - only admins can delete
DROP POLICY IF EXISTS "Allow public delete access to order_items" ON public.order_items;
CREATE POLICY "Admins can delete order_items"
  ON public.order_items FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));