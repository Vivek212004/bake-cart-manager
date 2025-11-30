import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      throw new Error('Missing required payment verification parameters');
    }

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret not configured');
    }

    console.log('Verifying payment for order:', orderId);

    // Verify signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const hmac = createHmac('sha256', razorpayKeySecret);
    hmac.update(text);
    const generatedSignature = hmac.digest('hex');

    const isValidSignature = generatedSignature === razorpaySignature;

    console.log('Signature validation:', isValidSignature ? 'SUCCESS' : 'FAILED');

    if (!isValidSignature) {
      throw new Error('Invalid payment signature');
    }

    // Update order status
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        payment_status: 'paid',
        status: 'confirmed',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    console.log('Order updated successfully - payment confirmed');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in verify-razorpay-payment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
