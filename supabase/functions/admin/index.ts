import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { generateJWT, validateCredentials, verifyJWT, extractToken } from "../_shared/auth.ts";
import { OrderStatus } from "../_shared/types.ts";
import type { LoginRequest } from "../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // Route: POST /admin/login - Admin login (PUBLIC)
    if (method === "POST" && pathParts.length === 2 && pathParts[0] === "admin" && pathParts[1] === "login") {
      return await adminLogin(req);
    }

    // Route: GET /admin/stats - Get dashboard statistics (PROTECTED)
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "admin" && pathParts[1] === "stats") {
      return await getDashboardStats(req);
    }

    // No route matched
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// POST /admin/login - Admin login (PUBLIC)
async function adminLogin(req: Request) {
  try {
    const { username, password }: LoginRequest = await req.json();

    if (!validateCredentials(username, password)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = await generateJWT(username);

    return new Response(
      JSON.stringify({ token, username }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// GET /admin/stats - Get dashboard statistics (PROTECTED)
async function getDashboardStats(req: Request) {
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
}
