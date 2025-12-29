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

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create index on customer_name for search
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);

-- Create index on customer_phone for search
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Add comment to table
COMMENT ON TABLE orders IS 'Stores customer orders for EasyBuy';

-- Add comments to columns
COMMENT ON COLUMN orders.status IS 'Order status: pending, confirmed, processing, shippedToSteadFast, delivered';
COMMENT ON COLUMN orders.tracking_code IS 'Tracking code from Steadfast courier';
COMMENT ON COLUMN orders.consignment_id IS 'Consignment ID from Steadfast courier';
