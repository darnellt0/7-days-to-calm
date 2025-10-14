#!/bin/bash
# Backend Deployment Script for Render.com
# Automated deployment helper

set -e

echo "=========================================="
echo "Backend Deployment to Render"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not initialized"
    echo "Run: ./setup-git.sh first"
    exit 1
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "❌ Error: No Git remote configured"
    echo ""
    echo "Please add your GitHub repository:"
    read -p "Enter repository URL: " REPO_URL
    git remote add origin "$REPO_URL"
    echo "✓ Remote added"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Commit changes now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Commit message: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
    fi
fi

# Push to GitHub
echo "[1/4] Pushing to GitHub..."
git push origin main
echo "✓ Code pushed to GitHub"
echo ""

# Instructions for Render
echo "[2/4] Backend Deployment Steps:"
echo ""
echo "1. Go to https://dashboard.render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Render will auto-detect render.yaml configuration"
echo ""
echo "5. Set Environment Variables in Render Dashboard:"
echo "   ELEVENLABS_API_KEY = (your key)"
echo "   ELEVENLABS_AGENT_ID = agent_4201k708pqxsed39y0vsz05gn66e"
echo "   CORS_ORIGINS = (your frontend URL)"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
read -p "Press Enter when backend is deployed..."
echo ""

# Get backend URL
echo "[3/4] Backend URL Configuration:"
read -p "Enter your Render backend URL: " BACKEND_URL

# Save to file
echo "$BACKEND_URL" > .backend-url
echo "✓ Backend URL saved to .backend-url"
echo ""

# Test backend
echo "[4/4] Testing backend health..."
if command -v curl &> /dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
        echo "✓ Backend health check passed!"
    else
        echo "⚠️  Warning: Backend health check failed"
        echo "Please verify the backend URL is correct"
    fi
else
    echo "⚠️  curl not found, skipping health check"
    echo "Test manually: $BACKEND_URL/health"
fi

echo ""
echo "=========================================="
echo "✓ Backend deployment complete!"
echo "=========================================="
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""
echo "Next step:"
echo "./deploy-frontend.sh"
