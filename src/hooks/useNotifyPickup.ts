import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotifyPickupParams {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}

export function useNotifyPickup() {
  return useMutation({
    mutationFn: async (params: NotifyPickupParams) => {
      const { data, error } = await supabase.functions.invoke("send-pickup-notification", {
        body: params,
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to send notification");
      
      return data;
    },
    onSuccess: () => {
      toast.success("Pickup notification sent to customer");
    },
    onError: (error: Error) => {
      console.error("Failed to send notification:", error);
      toast.error("Failed to send notification: " + error.message);
    },
  });
}
