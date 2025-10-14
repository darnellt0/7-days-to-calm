#!/bin/bash
# Git Setup Script for Elevated Movements
# This script initializes git and prepares for deployment

set -e  # Exit on error

echo "=========================================="
echo "Git Setup for Elevated Movements"
echo "=========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: Git is not installed"
    echo "Please install Git from https://git-scm.com/"
    exit 1
fi

echo "✓ Git is installed"
echo ""

# Check if already initialized
if [ -d ".git" ]; then
    echo "⚠️  Warning: Git repository already exists"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Initialize git
echo "[1/6] Initializing Git repository..."
git init
echo "✓ Repository initialized"
echo ""

# Set default branch to main
echo "[2/6] Setting default branch to 'main'..."
git branch -M main
echo "✓ Default branch set"
echo ""

# Add all files
echo "[3/6] Adding files to staging..."
git add .
echo "✓ Files staged"
echo ""

# Create initial commit
echo "[4/6] Creating initial commit..."
git commit -m "Initial commit: 7 Days to Calm meditation app

- FastAPI backend with ElevenLabs integration
- Next.js frontend with conversational AI widget
- 7-day progressive meditation challenge
- Production-ready deployment configuration"
echo "✓ Initial commit created"
echo ""

# Show status
echo "[5/6] Repository status:"
git log --oneline -1
git status
echo ""

# Instructions
echo "[6/6] Next steps:"
echo ""
echo "1. Create a GitHub repository:"
echo "   https://github.com/new"
echo ""
echo "2. Add remote:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git"
echo ""
echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "4. Deploy backend:"
echo "   ./deploy-backend.sh"
echo ""
echo "5. Deploy frontend:"
echo "   ./deploy-frontend.sh"
echo ""
echo "=========================================="
echo "✓ Git setup complete!"
echo "=========================================="
