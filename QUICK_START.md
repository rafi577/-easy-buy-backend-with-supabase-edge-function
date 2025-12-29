# Quick Start Guide

This guide will help you get the EasyBuy backend running locally in minutes.

## Prerequisites

Install these tools:
- [Supabase CLI](https://supabase.com/docs/guides/cli#installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required by Supabase)

## Setup Steps

### 1. Start Supabase Locally

```bash
cd easy-buy-backend-with-supabase-edge-function
supabase start
```

This will start all Supabase services locally. Wait for it to complete (takes 1-2 minutes first time).

You'll see output like:
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbG...
service_role key: eyJhbG...
   S3 Access Key: 625...
   S3 Secret Key: 850...
       S3 Region: local
```

**IMPORTANT**: Copy the `anon key` - you'll need it!

### 2. Create Database Table

Open Supabase Studio at http://127.0.0.1:54323

Go to SQL Editor and run this:

```sql
-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
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

-- Disable RLS to allow public access (for development)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
```

### 3. Set Environment Variables

Create a `.env` file:

```bash
# Copy from supabase start output
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-anon-key-from-step-1

# JWT Secret (use any secure string for local dev)
JWT_SECRET=my-super-secret-jwt-key-for-local-development

# Steadfast API (optional for now - only needed for dispatch/track features)
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key
```

### 4. Deploy Edge Functions Locally

In a new terminal:

```bash
cd easy-buy-backend-with-supabase-edge-function
supabase functions serve
```

This will start all edge functions at http://127.0.0.1:54321/functions/v1

You should see:
```
Serving functions on http://127.0.0.1:54321/functions/v1
- admin-login
- create-order
- get-orders
- get-order
- update-order
- delete-order
- dispatch-order
- track-order
- dashboard-stats
```

### 5. Test the Public Endpoints

#### Option A: Use the Test HTML File

1. Open `test-public-endpoints.html` in your browser
2. Click "Test Admin Login" - should work without errors
3. Click "Create Order" - should create an order successfully

#### Option B: Use cURL

**Test Admin Login:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

**Test Create Order:**
```bash
curl -X POST http://127.0.0.1:54321/functions/v1/create-order \
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

**Test Get Orders (Protected - requires JWT):**
```bash
# First login to get token
TOKEN=$(curl -X POST http://127.0.0.1:54321/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.token')

# Then use token to get orders
curl http://127.0.0.1:54321/functions/v1/get-orders \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues

### "Connection refused" error
- Make sure `supabase start` completed successfully
- Check Docker Desktop is running

### "Table does not exist" error
- Run the SQL from Step 2 in Supabase Studio
- Or apply migrations: `supabase db reset`

### "New row violates row-level security policy" error
- Run: `ALTER TABLE orders DISABLE ROW LEVEL SECURITY;` in SQL Editor
- Or apply the RLS migration file

### Functions not loading
- Restart functions: `supabase functions serve`
- Check logs for errors

## Next Steps

Once everything works locally:

1. **Deploy to Production**:
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   supabase functions deploy
   ```

2. **Set Production Secrets**:
   ```bash
   supabase secrets set JWT_SECRET=your-production-secret
   supabase secrets set STEADFAST_API_KEY=your-api-key
   supabase secrets set STEADFAST_SECRET_KEY=your-secret-key
   ```

3. **Update CORS**: Edit `supabase/functions/_shared/cors.ts` to allow your frontend domain

4. **Enable RLS** (recommended for production):
   - Create policies to secure your data
   - See `supabase/migrations/20240101000001_disable_rls_for_public_access.sql` for examples

## Summary

Your endpoints:
- **Public** (no auth): `/admin-login`, `/create-order`
- **Protected** (need JWT): `/get-orders`, `/get-order`, `/update-order`, `/delete-order`, `/dispatch-order`, `/track-order`, `/dashboard-stats`

Perfect for an e-commerce site where customers can place orders without registration!
