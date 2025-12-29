import type { Order, SteadfastResponse } from "./types.ts";

const STEADFAST_BASE_URL = Deno.env.get("STEADFAST_BASE_URL") || "";
const STEADFAST_API_KEY = Deno.env.get("STEADFAST_API_KEY") || "";
const STEADFAST_SECRET_KEY = Deno.env.get("STEADFAST_SECRET_KEY") || "";

// Send order to Steadfast courier service
export async function sendToSteadfast(order: Order): Promise<SteadfastResponse> {
  const apiURL = `${STEADFAST_BASE_URL}/create_order`;

  const payload = {
    invoice: `INV-${order.id}`,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone,
    recipient_address: order.customer_address,
    cod_amount: order.total,
    note: "Fragile",
  };

  const response = await fetch(apiURL, {
    method: "POST",
    headers: {
      "Api-Key": STEADFAST_API_KEY,
      "Secret-Key": STEADFAST_SECRET_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result: SteadfastResponse = await response.json();
  return result;
}

// Track order using Steadfast API
export async function trackOrderBySteadfast(trackingCode: string): Promise<any> {
  const apiURL = `${STEADFAST_BASE_URL}/status_by_trackingcode/${trackingCode}`;

  const response = await fetch(apiURL, {
    method: "GET",
    headers: {
      "Api-Key": STEADFAST_API_KEY,
      "Secret-Key": STEADFAST_SECRET_KEY,
    },
  });

  const result = await response.json();
  return result;
}
