# PowerShell test script for Windows
# This tests that the endpoints work WITHOUT authorization

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Testing EasyBuy Public Endpoints" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://127.0.0.1:54321/functions/v1"

Write-Host "1. Testing Admin Login (POST - should work WITHOUT auth)..." -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $body = @{
        username = "admin"
        password = "password"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BASE_URL/admin-login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)"

    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Admin Login works!" -ForegroundColor Green
        $token = ($response.Content | ConvertFrom-Json).token
        Write-Host "Token: $token"
    }
} catch {
    Write-Host "✗ Admin Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Testing Create Order (POST - should work WITHOUT auth)..." -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $body = @{
        customer_name = "Test Customer"
        customer_phone = "01712345678"
        customer_address = "Dhaka, Bangladesh"
        quantity = 1
        unit_price = 100
        delivery_charge = 50
        subtotal = 100
        total = 150
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$BASE_URL/create-order" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)"

    if ($response.StatusCode -eq 201) {
        Write-Host "✓ Create Order works!" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Create Order failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

    # Try to get more details from the error
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "3. Testing GET request to admin-login (should fail - only POST allowed)..." -ForegroundColor Yellow
Write-Host "--------------------------------------"

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/admin-login" `
        -Method GET `
        -UseBasicParsing

    Write-Host "Status: $($response.StatusCode)"
    Write-Host "✗ Should not accept GET requests" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejects GET requests" -ForegroundColor Green
    Write-Host "Error (expected): $($_.Exception.Message)"
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "- admin-login is PUBLIC (no auth needed)" -ForegroundColor White
Write-Host "- create-order is PUBLIC (no auth needed)" -ForegroundColor White
Write-Host "- Both require POST requests" -ForegroundColor White
Write-Host "- If you see 'missing authorization header'" -ForegroundColor Yellow
Write-Host "  you might be using GET instead of POST" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
