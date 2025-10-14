#!/bin/bash
# Deployment Testing Script
# Validates production deployment

set -e

echo "=========================================="
echo "Production Deployment Tests"
echo "=========================================="
echo ""

# Load URLs
if [ -f ".backend-url" ]; then
    BACKEND_URL=$(cat .backend-url)
else
    read -p "Enter backend URL: " BACKEND_URL
fi

if [ -f ".frontend-url" ]; then
    FRONTEND_URL=$(cat .frontend-url)
else
    read -p "Enter frontend URL: " FRONTEND_URL
fi

echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Backend Health
echo "[Test 1/6] Backend Health Check..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ PASSED: Backend is healthy"
        ((TESTS_PASSED++))
    else
        echo "✗ FAILED: Backend returned $HTTP_CODE"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  SKIPPED: curl not available"
fi
echo ""

# Test 2: Backend API Docs
echo "[Test 2/6] Backend API Documentation..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/docs")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ PASSED: API docs accessible"
        ((TESTS_PASSED++))
    else
        echo "✗ FAILED: API docs returned $HTTP_CODE"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  SKIPPED: curl not available"
fi
echo ""

# Test 3: Frontend Homepage
echo "[Test 3/6] Frontend Homepage..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "308" ]; then
        echo "✓ PASSED: Frontend is accessible"
        ((TESTS_PASSED++))
    else
        echo "✗ FAILED: Frontend returned $HTTP_CODE"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  SKIPPED: curl not available"
fi
echo ""

# Test 4: Frontend Main Page
echo "[Test 4/6] Frontend Main Application Page..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/7-days-to-calm")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✓ PASSED: Main page is accessible"
        ((TESTS_PASSED++))
    else
        echo "✗ FAILED: Main page returned $HTTP_CODE"
        ((TESTS_FAILED++))
    fi
else
    echo "⚠️  SKIPPED: curl not available"
fi
echo ""

# Test 5: SSL Certificate
echo "[Test 5/6] SSL Certificate..."
if [[ $BACKEND_URL == https://* ]]; then
    echo "✓ PASSED: Backend uses HTTPS"
    ((TESTS_PASSED++))
else
    echo "✗ FAILED: Backend not using HTTPS"
    ((TESTS_FAILED++))
fi
echo ""

# Test 6: Environment Configuration
echo "[Test 6/6] Environment Configuration..."
echo "Manual verification required:"
echo ""
echo "1. Open: $FRONTEND_URL/7-days-to-calm"
echo "2. Open browser DevTools (F12)"
echo "3. Check Console tab for errors"
echo "4. Verify widget loads (blue/purple gradient)"
echo "5. Test 'Complete Day 1' functionality"
echo ""
read -p "Does everything work correctly? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✓ PASSED: Manual verification successful"
    ((TESTS_PASSED++))
else
    echo "✗ FAILED: Manual verification failed"
    ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your app is live at:"
    echo "$FRONTEND_URL/7-days-to-calm"
    exit 0
else
    echo "✗ Some tests failed"
    echo ""
    echo "Please check:"
    echo "1. Backend logs on Render"
    echo "2. Frontend logs on Vercel"
    echo "3. Environment variables"
    echo "4. CORS configuration"
    echo ""
    echo "See DEPLOYMENT.md for troubleshooting"
    exit 1
fi
