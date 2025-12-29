# EasyBuy Backend with Supabase Edge Functions

This is a serverless implementation of the EasyBuy backend using Supabase Edge Functions. It implements the exact same logic as the Go-based `easy-buy-backend` but using TypeScript/Deno and Supabase Edge Functions.

## Features

- **Admin Authentication**: JWT-based authentication for admin users
- **Order Management**: Full CRUD operations for orders
- **Steadfast Integration**: Dispatch orders to Steadfast courier service and track them
- **Dashboard Statistics**: Get order statistics and revenue data
- **Public Order Creation**: Allow customers to create orders without authentication
- **Serverless Architecture**: Deploy globally with Supabase Edge Functions

## Project Structure

```
easy-buy-backend-with-supabase-edge-function/
├── supabase/
│   ├── functions/
│   │   ├── _shared/           # Shared utilities and types
│   │   │   ├── auth.ts        # JWT authentication utilities
│   │   │   ├── cors.ts        # CORS configuration
│   │   │   ├── steadfast.ts   # Steadfast API integration
│   │   │   └── types.ts       # TypeScript interfaces and types
│   │   ├── admin-login/       # Admin login endpoint
│   │   ├── create-order/      # Create order (public)
│   │   ├── get-orders/        # Get all orders with filters
│   │   ├── get-order/         # Get single order by ID
│   │   ├── update-order/      # Update order
│   │   ├── delete-order/      # Delete order
│   │   ├── dispatch-order/    # Dispatch order to Steadfast
│   │   ├── track-order/       # Track order status
│   │   └── dashboard-stats/   # Get dashboard statistics
│   ├── config.toml            # Supabase configuration
│   └── migrations/            # Database migrations
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Deno](https://deno.land/) installed (for local testing)
- A Supabase project (create one at [supabase.com](https://supabase.com))
- Steadfast courier API credentials

## Setup Instructions

### 1. Clone and Navigate

```bash
cd easy-buy-backend-with-supabase-edge-function
```

### 2. Initialize Supabase

If you haven't initialized Supabase in your project:

```bash
supabase init
```

### 3. Link to Your Supabase Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Set Up Database

Create the orders table in your Supabase database. Run this SQL in the SQL Editor:

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  delivery_charge DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  tracking_code TEXT,
  consignment_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for faster filtering
CREATE INDEX idx_orders_status ON orders(status);

-- Create index on customer_name and customer_phone for search
CREATE INDEX idx_orders_customer_name ON orders(customer_name);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
```

### 5. Configure Environment Variables

Create a `.env` file or set environment secrets in Supabase:

```bash
# Get these from your Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret

# Steadfast API credentials
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_API_KEY=your-steadfast-api-key
STEADFAST_SECRET_KEY=your-steadfast-secret-key
```

Set secrets using Supabase CLI:

```bash
supabase secrets set JWT_SECRET=your-secure-jwt-secret
supabase secrets set STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
supabase secrets set STEADFAST_API_KEY=your-steadfast-api-key
supabase secrets set STEADFAST_SECRET_KEY=your-steadfast-secret-key
```

### 6. Deploy Edge Functions

Deploy all functions to Supabase:

```bash
supabase functions deploy admin-login
supabase functions deploy create-order
supabase functions deploy get-orders
supabase functions deploy get-order
supabase functions deploy update-order
supabase functions deploy delete-order
supabase functions deploy dispatch-order
supabase functions deploy track-order
supabase functions deploy dashboard-stats
```

Or deploy all at once:

```bash
supabase functions deploy
```

## API Endpoints

Base URL: `https://your-project.supabase.co/functions/v1`
Local URL: `http://127.0.0.1:54321/functions/v1`

### PUBLIC Endpoints (No Authentication Required)

These endpoints can be called by anyone without a JWT token. Perfect for e-commerce where customers should be able to place orders without creating an account.

#### 1. Admin Login
- **POST** `/admin-login`
- **Authentication**: None (Public)
- **Body**:
```json
{
  "username": "admin",
  "password": "password"
}
```
- **Response**:
```json
{
  "token": "jwt-token-here",
  "username": "admin"
}
```

#### 2. Create Order (Public)
- **POST** `/create-order`
- **Authentication**: None (Public - customers can order without login)
- **Body**:
```json
{
  "customer_name": "John Doe",
  "customer_phone": "01712345678",
  "customer_address": "123 Main St, Dhaka",
  "quantity": 2,
  "unit_price": 500,
  "delivery_charge": 60,
  "subtotal": 1000,
  "total": 1060
}
```
- **Response**:
```json
{
  "id": 1,
  "customer_name": "John Doe",
  "customer_phone": "01712345678",
  "customer_address": "123 Main St, Dhaka",
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

### PROTECTED Endpoints (Require JWT Token)

All protected endpoints require an `Authorization` header with the JWT token obtained from `/admin-login`:
```
Authorization: Bearer <jwt-token>
```

Use these endpoints for admin dashboard operations.

#### Get All Orders
- **GET** `/get-orders?status=pending&search=john&page=1&limit=20`
- Query params: `status`, `search`, `page`, `limit`

#### Get Order by ID
- **GET** `/get-order?id=1`

#### Update Order
- **PUT** `/update-order?id=1`
- **Body**: Partial order object with fields to update

#### Delete Order
- **DELETE** `/delete-order?id=1`

#### Dispatch Order to Steadfast
- **POST** `/dispatch-order?id=1`
- **Response**:
```json
{
  "message": "Shipped!",
  "tracking": "tracking-code",
  "id": 12345
}
```

#### Track Order
- **GET** `/track-order?id=1`
- Returns tracking information from Steadfast API

#### Dashboard Statistics
- **GET** `/dashboard-stats`
- **Response**:
```json
{
  "total_orders": 100,
  "pending_orders": 20,
  "shipped_orders": 50,
  "delivered_orders": 30,
  "total_revenue": 50000
}
```

## Local Development

### Run Edge Functions Locally

```bash
supabase start
supabase functions serve
```

This will start all functions locally at `http://localhost:54321/functions/v1`

### Test a Specific Function

```bash
supabase functions serve admin-login
```

### Make Test Requests

```bash
# Login
curl -X POST http://localhost:54321/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Create Order (Public)
curl -X POST http://localhost:54321/functions/v1/create-order \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"John Doe","customer_phone":"01712345678","customer_address":"Dhaka","quantity":2,"unit_price":500,"delivery_charge":60,"subtotal":1000,"total":1060}'

# Get Orders (Protected)
curl http://localhost:54321/functions/v1/get-orders \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Migration from Go Backend

This implementation provides the exact same API functionality as the Go-based backend. Key differences:

1. **Serverless**: No need to manage servers or containers
2. **Auto-scaling**: Automatically scales based on demand
3. **Global deployment**: Edge functions run close to users
4. **TypeScript**: Uses TypeScript/Deno instead of Go
5. **Supabase integration**: Direct integration with Supabase database

### API Compatibility

The API endpoints are designed to be compatible with the Go backend:

| Go Backend Route | Supabase Function | Method |
|-----------------|-------------------|--------|
| `/admin/login` | `admin-login` | POST |
| `/public/orders` | `create-order` | POST |
| `/orders` (GET) | `get-orders` | GET |
| `/orders/:id` (GET) | `get-order?id=:id` | GET |
| `/orders/:id` (PUT) | `update-order?id=:id` | PUT |
| `/orders/:id` (DELETE) | `delete-order?id=:id` | DELETE |
| `/orders/:id/dispatch` | `dispatch-order?id=:id` | POST |
| `/orders/:id/track` | `track-order?id=:id` | GET |
| `/admin/stats` | `dashboard-stats` | GET |

## Security Notes

1. **JWT Secret**: Always use a strong, random JWT secret in production
2. **CORS**: Update CORS settings in `_shared/cors.ts` for production
3. **Validation**: The `validateCredentials` function is simplified - implement proper authentication in production
4. **Environment Variables**: Never commit secrets to version control
5. **Row Level Security**: Consider enabling RLS policies on the orders table in Supabase

## Troubleshooting

### Functions not deploying
- Check Supabase CLI is up to date: `supabase --version`
- Ensure you're linked to the correct project: `supabase link`
- Check function logs: `supabase functions logs <function-name>`

### Database connection issues
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Check your Supabase project is active
- Ensure the orders table exists in your database

### "Missing authorization header" error on public endpoints
If you're getting authorization errors on `/admin-login` or `/create-order`:
- These endpoints are PUBLIC and should NOT require auth
- Make sure you're sending a POST request (not GET)
- Check that you redeployed the functions after the fix

### Row Level Security (RLS) blocking inserts
If `/create-order` fails with permission errors:
- Run the migration: `20240101000001_disable_rls_for_public_access.sql`
- Or manually disable RLS: `ALTER TABLE orders DISABLE ROW LEVEL SECURITY;`
- Or create a policy to allow anonymous inserts (see migration file)

### CORS errors
- Check CORS configuration in `_shared/cors.ts`
- Ensure your frontend origin is allowed
- Check browser console for specific CORS errors

### Testing locally
Use the included `test-public-endpoints.html` file:
1. Open it in your browser
2. Make sure Supabase is running locally
3. Test the public endpoints without any authentication

## Support

For issues or questions:
- Check [Supabase Documentation](https://supabase.com/docs)
- Review [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- Open an issue in this repository

## License

Same as the original EasyBuy backend project.
