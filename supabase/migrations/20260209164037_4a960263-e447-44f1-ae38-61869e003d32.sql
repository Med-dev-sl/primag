
CREATE TABLE public.restock_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchandise_id UUID NOT NULL REFERENCES public.merchandise(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.restock_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read restock_history" ON public.restock_history FOR SELECT USING (is_authenticated());
CREATE POLICY "Allow authenticated insert restock_history" ON public.restock_history FOR INSERT WITH CHECK (is_authenticated());
CREATE POLICY "Admins can delete restock_history" ON public.restock_history FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
