#!/bin/bash

# =================================================================
# Git-Crypt Setup for StyleSync Production Secrets
# =================================================================
# This script sets up git-crypt for encrypting production secrets
# =================================================================

set -e

echo "🔐 Setting up git-crypt for production secrets..."

# Check if git-crypt is installed
if ! command -v git-crypt &> /dev/null; then
    echo "❌ git-crypt is not installed. Please install it first:"
    echo "   - macOS: brew install git-crypt"  
    echo "   - Ubuntu: sudo apt-get install git-crypt"
    echo "   - Windows: Use WSL or download from GitHub"
    exit 1
fi

# Initialize git-crypt if not already done
if [ ! -d ".git-crypt" ]; then
    echo "📦 Initializing git-crypt..."
    git-crypt init
    echo "✅ Git-crypt initialized"
else
    echo "✅ Git-crypt already initialized"
fi

# Check if .gitattributes exists and has our configuration
if grep -q "server/.env.production filter=git-crypt" .gitattributes 2>/dev/null; then
    echo "✅ .gitattributes already configured"
else
    echo "📝 Updating .gitattributes configuration..."
    echo "" >> .gitattributes
    echo "# Git-crypt configuration" >> .gitattributes
    echo "server/.env.production filter=git-crypt diff=git-crypt" >> .gitattributes
    git add .gitattributes
    echo "✅ .gitattributes updated"
fi

# Check if production env file exists
if [ ! -f "server/.env.production" ]; then
    echo "⚠️  Production environment file not found"
    echo "   Create server/.env.production with your production secrets"
    echo "   It will be automatically encrypted when you commit"
else
    echo "✅ Production environment file found"
fi

echo ""
echo "🎉 Git-crypt setup complete!"
echo ""
echo "Next steps:"
echo "1. Add production secrets to server/.env.production (if not done)"
echo "2. git add server/.env.production"
echo "3. git commit -m 'Add encrypted production environment'"
echo "4. Export key for deployment: git-crypt export-key ../stylesync-production.key"
echo ""
echo "For deployment, unlock with: git-crypt unlock ../stylesync-production.key"
