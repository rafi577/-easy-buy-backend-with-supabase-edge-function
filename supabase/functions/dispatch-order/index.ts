import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";
import { sendToSteadfast } from "../_shared/steadfast.ts";
import { OrderStatus } from "../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify JWT
    const token = extractToken(req.headers.get("Authorization"));
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claims = await verifyJWT(token);
    if (!claims) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get order ID from URL
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the order
    const { data: order, error: fetchError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to Steadfast
    const result = await sendToSteadfast(order);

    if (result.status !== 200) {
      return new Response(
        JSON.stringify({ error: "Courier Error", details: result.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the order with tracking info and status
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        status: OrderStatus.Shipped,
        tracking_code: result.consignment.tracking_code,
        consignment_id: result.consignment.consignment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update local database", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Shipped!",
        tracking: result.consignment.tracking_code,
        id: result.consignment.consignment_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
