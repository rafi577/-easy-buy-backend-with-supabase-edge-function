#!/bin/bash

# Deployment script for EasyBuy Supabase Edge Functions

echo "======================================"
echo "Deploying EasyBuy Edge Functions"
echo "======================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "Deploying 3 edge functions:"
echo "  1. admin (login + stats)"
echo "  2. orders (all order operations)"
echo "  3. create-order (public order creation)"
echo ""

# Deploy admin function
echo "Deploying admin function..."
supabase functions deploy admin
if [ $? -eq 0 ]; then
    echo "✓ admin deployed successfully"
else
    echo "✗ Failed to deploy admin"
    exit 1
fi

# Deploy orders function
echo ""
echo "Deploying orders function..."
supabase functions deploy orders
if [ $? -eq 0 ]; then
    echo "✓ orders deployed successfully"
else
    echo "✗ Failed to deploy orders"
    exit 1
fi

# Deploy create-order function
echo ""
echo "Deploying create-order function..."
supabase functions deploy create-order
if [ $? -eq 0 ]; then
    echo "✓ create-order deployed successfully"
else
    echo "✗ Failed to deploy create-order"
    exit 1
fi

echo ""
echo "======================================"
echo "All functions deployed successfully!"
echo "======================================"
echo ""
echo "Your endpoints:"
echo "  - POST   /admin/login          (PUBLIC)"
echo "  - GET    /admin/stats          (PROTECTED)"
echo "  - GET    /orders               (PROTECTED)"
echo "  - GET    /orders/:id           (PROTECTED)"
echo "  - POST   /orders               (PROTECTED)"
echo "  - PUT    /orders/:id           (PROTECTED)"
echo "  - DELETE /orders/:id           (PROTECTED)"
echo "  - POST   /orders/:id/dispatch  (PROTECTED)"
echo "  - GET    /orders/:id/track     (PROTECTED)"
echo "  - POST   /create-order         (PUBLIC)"
echo ""
