import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { OrderStatus, type Order } from "../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Create Supabase client without requiring authorization (public endpoint)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const order: Order = await req.json();

    // Validation
    if (!order.customer_name || !order.customer_phone || !order.customer_address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: customer_name, customer_phone, customer_address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert order into database
    const { data, error } = await supabaseClient
      .from("orders")
      .insert([
        {
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
          quantity: order.quantity || 0,
          unit_price: order.unit_price || 0,
          delivery_charge: order.delivery_charge || 0,
          subtotal: order.subtotal || 0,
          total: order.total || 0,
          status: OrderStatus.Pending,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Could not create order", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
