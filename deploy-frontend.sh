#!/bin/bash
# Frontend Deployment Script for Vercel
# Automated deployment helper

set -e

echo "=========================================="
echo "Frontend Deployment to Vercel"
echo "=========================================="
echo ""

# Check if backend URL exists
if [ -f ".backend-url" ]; then
    BACKEND_URL=$(cat .backend-url)
    echo "✓ Backend URL loaded: $BACKEND_URL"
else
    read -p "Enter your backend URL: " BACKEND_URL
    echo "$BACKEND_URL" > .backend-url
fi
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not installed"
    echo ""
    echo "Option 1: Install Vercel CLI (recommended for automation)"
    echo "   npm install -g vercel"
    echo ""
    echo "Option 2: Manual deployment via web interface"
    echo ""
    read -p "Continue with manual deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    MANUAL=true
else
    echo "✓ Vercel CLI installed"
    MANUAL=false
fi

echo ""
echo "[1/4] Frontend Deployment Steps:"
echo ""

if [ "$MANUAL" = true ]; then
    echo "Manual Deployment:"
    echo ""
    echo "1. Go to https://vercel.com/new"
    echo "2. Import your GitHub repository"
    echo "3. Configure project:"
    echo "   - Framework Preset: Next.js"
    echo "   - Root Directory: em-frontend"
    echo "   - Build Command: npm run build"
    echo "   - Output Directory: .next"
    echo ""
    echo "4. Add Environment Variable:"
    echo "   NEXT_PUBLIC_BACKEND_URL = $BACKEND_URL"
    echo ""
    echo "5. Click 'Deploy'"
    echo ""
    read -p "Press Enter when deployed..."
else
    echo "Automated Deployment:"
    echo ""
    cd em-frontend

    # Set environment variable
    echo "[2/4] Setting environment variables..."
    vercel env add NEXT_PUBLIC_BACKEND_URL production
    echo "$BACKEND_URL"
    echo "✓ Environment variable set"

    # Deploy
    echo "[3/4] Deploying to Vercel..."
    vercel --prod

    cd ..
fi

echo ""
echo "[4/4] Frontend URL Configuration:"
read -p "Enter your Vercel frontend URL: " FRONTEND_URL

# Save to file
echo "$FRONTEND_URL" > .frontend-url
echo "✓ Frontend URL saved to .frontend-url"
echo ""

# Update backend CORS
echo "=========================================="
echo "⚠️  IMPORTANT: Update Backend CORS"
echo "=========================================="
echo ""
echo "1. Go to Render Dashboard"
echo "2. Select your backend service"
echo "3. Go to Environment tab"
echo "4. Update CORS_ORIGINS to:"
echo "   $FRONTEND_URL,http://localhost:3000"
echo ""
read -p "Press Enter when CORS is updated..."

echo ""
echo "=========================================="
echo "✓ Frontend deployment complete!"
echo "=========================================="
echo ""
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next step:"
echo "./test-deployment.sh"
