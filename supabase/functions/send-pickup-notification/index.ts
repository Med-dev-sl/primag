import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PickupNotificationRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  orderNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { orderId, customerEmail, customerName, orderNumber }: PickupNotificationRequest = 
      await req.json();

    // Validate required fields
    if (!orderId || !customerEmail || !orderNumber) {
      throw new Error("Missing required fields: orderId, customerEmail, orderNumber");
    }

    console.log(`Sending pickup notification to ${customerEmail} for order ${orderNumber}`);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Laundry Service <onboarding@resend.dev>",
        to: [customerEmail],
        subject: `Your Order ${orderNumber} is Ready for Pickup!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .order-number { font-size: 24px; font-weight: bold; color: #667eea; }
              .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧺 Your Laundry is Ready!</h1>
              </div>
              <div class="content">
                <p>Dear ${customerName || 'Valued Customer'},</p>
                <p>Great news! Your order is now ready for pickup.</p>
                <p class="order-number">Order: ${orderNumber}</p>
                <p>Please visit our store during business hours to collect your items.</p>
                <p>Thank you for choosing our laundry service!</p>
                <p>Best regards,<br>The Laundry Team</p>
              </div>
              <div class="footer">
                <p>If you have any questions, please contact us.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Pickup notification email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending pickup notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
