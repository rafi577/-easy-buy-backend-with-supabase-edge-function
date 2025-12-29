# EasyBuy API Reference

This document describes the API endpoints and how to use them.

## Base URLs

- **Local Development**: `http://127.0.0.1:54321/functions/v1`
- **Production**: `https://your-project.supabase.co/functions/v1`

## Edge Functions

There are **3 main edge functions**:

1. **`admin`** - Admin operations (login + stats)
2. **`orders`** - All order management (protected)
3. **`create-order`** - Public order creation

---

## 1. Admin Function (`/admin`)

### POST /admin/login

Admin authentication - **PUBLIC** endpoint.

**Request:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password"
  }'
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin"
}
```

---

### GET /admin/stats

Get dashboard statistics - **PROTECTED** endpoint.

**Request:**
```bash
curl http://127.0.0.1:54321/functions/v1/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "total_orders": 150,
  "pending_orders": 25,
  "shipped_orders": 80,
  "delivered_orders": 45,
  "total_revenue": 125000
}
```

---

## 2. Orders Function (`/orders`)

All routes require **JWT authentication** (Bearer token in Authorization header).

### GET /orders

Get all orders with optional filtering, searching, and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, processing, shippedToSteadFast, delivered)
- `search` (optional): Search by customer name or phone
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Request:**
```bash
curl "http://127.0.0.1:54321/functions/v1/orders?status=pending&search=john&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_phone": "01712345678",
      "customer_address": "Dhaka, Bangladesh",
      "quantity": 2,
      "unit_price": 500,
      "delivery_charge": 60,
      "subtotal": 1000,
      "total": 1060,
      "status": "pending",
      "tracking_code": null,
      "consignment_id": null,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

### GET /orders/:id

Get a single order by ID.

**Request:**
```bash
curl http://127.0.0.1:54321/functions/v1/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "customer_phone": "01712345678",
  "customer_address": "Dhaka, Bangladesh",
  "quantity": 2,
  "unit_price": 500,
  "delivery_charge": 60,
  "subtotal": 1000,
  "total": 1060,
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### POST /orders

Create a new order (admin only - protected).

**Request:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "customer_phone": "01712345678",
    "customer_address": "Dhaka, Bangladesh",
    "quantity": 2,
    "unit_price": 500,
    "delivery_charge": 60,
    "subtotal": 1000,
    "total": 1060
  }'
```

**Response (201 Created):**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "status": "pending",
  ...
}
```

---

### PUT /orders/:id

Update an existing order.

**Request:**
```bash
curl -X PUT http://127.0.0.1:54321/functions/v1/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "customer_phone": "01798765432"
  }'
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "customer_phone": "01798765432",
  "status": "confirmed",
  ...
}
```

---

### DELETE /orders/:id

Delete an order.

**Request:**
```bash
curl -X DELETE http://127.0.0.1:54321/functions/v1/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Order deleted successfully"
}
```

---

### POST /orders/:id/dispatch

Dispatch an order to Steadfast courier service.

**Request:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/orders/1/dispatch \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Shipped!",
  "tracking": "SF123456789",
  "id": 987654
}
```

---

### GET /orders/:id/track

Track an order's delivery status.

**Request:**
```bash
curl http://127.0.0.1:54321/functions/v1/orders/1/track \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "status": "in_transit",
  "tracking_code": "SF123456789",
  "delivery_status": "Out for delivery",
  ...
}
```

---

## 3. Create Order Function (`/create-order`)

### POST /create-order

Create a new order - **PUBLIC** endpoint (no authentication required).

This is the endpoint customers use to place orders without logging in.

**Request:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Smith",
    "customer_phone": "01812345678",
    "customer_address": "Chittagong, Bangladesh",
    "quantity": 1,
    "unit_price": 1000,
    "delivery_charge": 80,
    "subtotal": 1000,
    "total": 1080
  }'
```

**Response (201 Created):**
```json
{
  "id": 2,
  "customer_name": "Jane Smith",
  "customer_phone": "01812345678",
  "customer_address": "Chittagong, Bangladesh",
  "quantity": 1,
  "unit_price": 1000,
  "delivery_charge": 80,
  "subtotal": 1000,
  "total": 1080,
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

## Frontend Integration Example

```javascript
const API_BASE_URL = 'http://127.0.0.1:54321/functions/v1';

// Admin API
export const adminAPI = {
  // Login (PUBLIC)
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Get stats (PROTECTED)
  getStats: async (token) => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};

// Orders API (all PROTECTED)
export const ordersAPI = {
  getAll: async (token, params) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/orders?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  getById: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  create: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  update: async (token, id, data) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  delete: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  dispatch: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/dispatch`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  track: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/track`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
};

// Public order creation (NO AUTH)
export const publicAPI = {
  createOrder: async (data) => {
    const response = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Authentication Flow

1. **Admin login** → Get JWT token
```bash
POST /admin/login
# Returns: { "token": "..." }
```

2. **Use token for protected endpoints**
```bash
Authorization: Bearer <token>
```

3. **Token expires after 24 hours** - login again to get a new token

---

## Deployment

**Deploy all functions:**
```bash
supabase functions deploy admin
supabase functions deploy orders
supabase functions deploy create-order
```

**Or deploy all at once:**
```bash
supabase functions deploy
```
