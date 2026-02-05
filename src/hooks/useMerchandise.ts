import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Merchandise {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
}

export function useMerchandise() {
  return useQuery({
    queryKey: ["merchandise"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchandise")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Merchandise[];
    },
  });
}

export function useAddMerchandise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: Omit<Merchandise, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("merchandise")
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchandise"] });
      toast.success("Item added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add item: " + error.message);
    },
  });
}

export function useUpdateMerchandise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Merchandise> & { id: string }) => {
      const { data, error } = await supabase
        .from("merchandise")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchandise"] });
      toast.success("Item updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update item: " + error.message);
    },
  });
}

export function useDeleteMerchandise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("merchandise")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchandise"] });
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete item: " + error.message);
    },
  });
}
