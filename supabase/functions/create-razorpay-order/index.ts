import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Credentials": "true"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const orderId = body.orderId;

    if (!amount || !orderId) {
      throw new Error("Amount and order ID are required");
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    console.log("Creating Razorpay order for amount:", amount);

    // Razorpay expects amount in PAISA
    const razorpayOrderData = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: orderId,
      notes: { order_id: orderId }
    };

    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify(razorpayOrderData)
    });

    const razorpayOrder = await response.json();

    if (!response.ok) {
      console.error("Razorpay error:", razorpayOrder);
      throw new Error(razorpayOrder?.error?.description || "Failed to create Razorpay order");
    }

    console.log("Razorpay order created:", razorpayOrder.id);

    // Update Supabase order with Razorpay Order ID
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_order_id: razorpayOrder.id,
        payment_method: "razorpay"
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        key: razorpayKeyId,
        order: razorpayOrder, // send full object for frontend
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in create-razorpay-order:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
