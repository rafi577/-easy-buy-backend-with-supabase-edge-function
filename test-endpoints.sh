#!/bin/bash

# Test script for EasyBuy public endpoints
# This tests that the endpoints work WITHOUT authorization

echo "======================================"
echo "Testing EasyBuy Public Endpoints"
echo "======================================"
echo ""

BASE_URL="http://127.0.0.1:54321/functions/v1"

echo "1. Testing Admin Login (POST - should work WITHOUT auth)..."
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${BASE_URL}/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $HTTP_STATUS"
echo "Response: $HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✓ Admin Login works!"
  TOKEN=$(echo "$HTTP_BODY" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  echo "Token: $TOKEN"
else
  echo "✗ Admin Login failed!"
  echo "Expected 200, got $HTTP_STATUS"
fi

echo ""
echo "2. Testing Create Order (POST - should work WITHOUT auth)..."
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST ${BASE_URL}/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "customer_phone": "01712345678",
    "customer_address": "Dhaka, Bangladesh",
    "quantity": 1,
    "unit_price": 100,
    "delivery_charge": 50,
    "subtotal": 100,
    "total": 150
  }')

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $HTTP_STATUS"
echo "Response: $HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" -eq 201 ]; then
  echo "✓ Create Order works!"
else
  echo "✗ Create Order failed!"
  echo "Expected 201, got $HTTP_STATUS"
fi

echo ""
echo "3. Testing GET request to admin-login (should fail - only POST allowed)..."
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET ${BASE_URL}/admin-login)

HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTP_STATUS\:.*//g')
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

echo "Status: $HTTP_STATUS"
echo "Response: $HTTP_BODY"
echo ""

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo "✓ Correctly rejects GET requests"
else
  echo "✗ Should not accept GET requests"
fi

echo ""
echo "======================================"
echo "Summary:"
echo "- admin-login is PUBLIC (no auth needed)"
echo "- create-order is PUBLIC (no auth needed)"
echo "- Both require POST requests"
echo "- If you see 'missing authorization header'"
echo "  you might be using GET instead of POST"
echo "======================================"
