import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LaundryService {
  id: string;
  name: string;
  description: string | null;
  price_per_unit: number;
  unit_type: string;
  created_at: string;
}

export function useLaundryServices() {
  return useQuery({
    queryKey: ["laundry_services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laundry_services")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as LaundryService[];
    },
  });
}

export function useAddLaundryService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (service: Omit<LaundryService, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("laundry_services")
        .insert(service)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laundry_services"] });
      toast.success("Service added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add service: " + error.message);
    },
  });
}
