// Order Status enum
export enum OrderStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Processing = "processing",
  Shipped = "shippedToSteadFast",
  Delivered = "delivered"
}

// Order interface
export interface Order {
  id?: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  quantity: number;
  unit_price: number;
  delivery_charge: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  tracking_code?: string;
  consignment_id?: number;
  created_at?: string;
  updated_at?: string;
}

// JWT Claims
export interface JWTClaims {
  username: string;
  exp: number;
  iat: number;
}

// Login Request
export interface LoginRequest {
  username: string;
  password: string;
}

// Steadfast Response
export interface SteadfastResponse {
  status: number;
  message: string;
  consignment: {
    consignment_id: number;
    tracking_code: string;
  };
}
