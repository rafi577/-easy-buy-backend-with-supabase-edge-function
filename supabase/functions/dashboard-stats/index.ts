import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";
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

    // Get total orders count
    const { count: totalOrders } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Get pending orders count
    const { count: pendingOrders } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", OrderStatus.Pending);

    // Get shipped orders count
    const { count: shippedOrders } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", OrderStatus.Shipped);

    // Get delivered orders count
    const { count: deliveredOrders } = await supabaseClient
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", OrderStatus.Delivered);

    // Calculate total revenue
    const { data: orders } = await supabaseClient
      .from("orders")
      .select("total");

    let totalRevenue = 0;
    if (orders) {
      totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    }

    const stats = {
      total_orders: totalOrders || 0,
      pending_orders: pendingOrders || 0,
      shipped_orders: shippedOrders || 0,
      delivered_orders: deliveredOrders || 0,
      total_revenue: totalRevenue,
    };

    return new Response(
      JSON.stringify(stats),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
