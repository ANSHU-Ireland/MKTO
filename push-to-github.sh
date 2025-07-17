#!/bin/bash

# MKTO Portfolio Optimization - GitHub Push Script
# Run this after creating your GitHub repository

echo "🚀 MKTO Portfolio Optimization Platform - GitHub Push Setup"
echo "==========================================================="
echo ""

# Check if repository URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub repository URL"
    echo ""
    echo "Usage: ./push-to-github.sh https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
    echo ""
    echo "Steps:"
    echo "1. Create a new repository on GitHub.com"
    echo "2. Copy the repository URL"
    echo "3. Run: ./push-to-github.sh YOUR_REPO_URL"
    exit 1
fi

REPO_URL=$1

echo "📁 Repository URL: $REPO_URL"
echo ""

# Add remote origin
echo "🔗 Adding remote origin..."
git remote add origin $REPO_URL

# Check if remote was added successfully
if git remote -v | grep -q origin; then
    echo "✅ Remote origin added successfully"
else
    echo "❌ Failed to add remote origin"
    exit 1
fi

# Push to origin main
echo "📤 Pushing to origin main..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS! MKTO Portfolio Optimization Platform pushed to GitHub!"
    echo "📊 Repository: $REPO_URL"
    echo ""
    echo "🌐 Your portfolio optimization platform is now on GitHub with:"
    echo "   ✅ 6 Advanced optimization algorithms"
    echo "   ✅ Responsive React frontend (port 3001)"
    echo "   ✅ FastAPI backend (port 8001)"
    echo "   ✅ Intelligent allocation optimization"
    echo "   ✅ Risk-adjusted portfolio management"
    echo ""
else
    echo ""
    echo "❌ Push failed. Please check your repository URL and try again."
    echo "💡 Make sure you have push access to the repository."
fi
