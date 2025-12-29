import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { verifyJWT, extractToken } from "../_shared/auth.ts";
import { sendToSteadfast, trackOrderBySteadfast } from "../_shared/steadfast.ts";
import { OrderStatus } from "../_shared/types.ts";

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify JWT - all routes in this function require authentication
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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse URL and method
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const method = req.method;

    // Route: GET /orders - Get all orders
    if (method === "GET" && pathParts.length === 1 && pathParts[0] === "orders") {
      return await getAllOrders(supabaseClient, url);
    }

    // Route: GET /orders/:id - Get order by ID
    if (method === "GET" && pathParts.length === 2 && pathParts[0] === "orders" && !pathParts[1].includes("track")) {
      return await getOrderById(supabaseClient, pathParts[1]);
    }

    // Route: POST /orders - Create order (admin only)
    if (method === "POST" && pathParts.length === 1 && pathParts[0] === "orders") {
      return await createOrder(supabaseClient, req);
    }

    // Route: PUT /orders/:id - Update order
    if (method === "PUT" && pathParts.length === 2 && pathParts[0] === "orders") {
      return await updateOrder(supabaseClient, pathParts[1], req);
    }

    // Route: DELETE /orders/:id - Delete order
    if (method === "DELETE" && pathParts.length === 2 && pathParts[0] === "orders") {
      return await deleteOrder(supabaseClient, pathParts[1]);
    }

    // Route: POST /orders/:id/dispatch - Dispatch to Steadfast
    if (method === "POST" && pathParts.length === 3 && pathParts[0] === "orders" && pathParts[2] === "dispatch") {
      return await dispatchOrder(supabaseClient, pathParts[1]);
    }

    // Route: GET /orders/:id/track - Track order
    if (method === "GET" && pathParts.length === 3 && pathParts[0] === "orders" && pathParts[2] === "track") {
      return await trackOrder(supabaseClient, pathParts[1]);
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

// GET /orders - Get all orders with filtering, search, and pagination
async function getAllOrders(supabaseClient: any, url: URL) {
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let query = supabaseClient.from("orders").select("*", { count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Could not fetch orders", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ orders: data, total: count, page, limit }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// GET /orders/:id - Get order by ID
async function getOrderById(supabaseClient: any, id: string) {
  const { data, error } = await supabaseClient
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// POST /orders - Create order (admin only)
async function createOrder(supabaseClient: any, req: Request) {
  const order = await req.json();

  if (!order.customer_name || !order.customer_phone || !order.customer_address) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: customer_name, customer_phone, customer_address" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data, error } = await supabaseClient
    .from("orders")
    .insert([{
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
    }])
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
}

// PUT /orders/:id - Update order
async function updateOrder(supabaseClient: any, id: string, req: Request) {
  const updates = await req.json();

  delete updates.id;
  delete updates.created_at;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseClient
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: "Could not update order", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!data) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// DELETE /orders/:id - Delete order
async function deleteOrder(supabaseClient: any, id: string) {
  const { error, count } = await supabaseClient
    .from("orders")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Could not delete order", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (count === 0) {
    return new Response(
      JSON.stringify({ error: "Order not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ message: "Order deleted successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// POST /orders/:id/dispatch - Dispatch order to Steadfast
async function dispatchOrder(supabaseClient: any, id: string) {
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

  const result = await sendToSteadfast(order);

  if (result.status !== 200) {
    return new Response(
      JSON.stringify({ error: "Courier Error", details: result.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

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
}

// GET /orders/:id/track - Track order
async function trackOrder(supabaseClient: any, id: string) {
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

  if (!order.tracking_code) {
    return new Response(
      JSON.stringify({ error: "Order has not been shipped yet" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const trackingResult = await trackOrderBySteadfast(order.tracking_code);

  return new Response(
    JSON.stringify(trackingResult),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
