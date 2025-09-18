#!/bin/bash

# Deploy Action.IT to Vercel with OAuth Configuration
# This script helps deploy the app with proper OAuth configuration for actionit-dev.vercel.app

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting Vercel deployment with OAuth configuration..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository. Please run this script from the project root."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

# Check if we have changes to commit
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes. Committing them now..."
    
    # Get current timestamp
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Add all changes
    git add .
    
    # Create commit message with timestamp
    COMMIT_MESSAGE="deploy: OAuth configuration for Vercel - $TIMESTAMP"
    
    # Commit changes
    git commit -m "$COMMIT_MESSAGE"
    print_success "Committed changes with message: $COMMIT_MESSAGE"
fi

# Push to remote
print_status "Pushing changes to remote repository..."
git push origin $CURRENT_BRANCH

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
print_status "Deploying to Vercel..."
vercel --prod

print_success "Deployment completed!"
print_status "Your app should be available at: https://actionit-dev.vercel.app"

# Post-deployment checklist
print_status "Post-deployment checklist:"
echo "1. ✅ Code deployed to Vercel"
echo "2. ⏳ Configure IAM role for Vercel:"
echo "   - Create role: VercelActionITRole"
echo "   - Attach OAuth policy to role"
echo "   - Configure trust policy for Vercel"
echo "3. ⏳ Connect AWS account to Vercel:"
echo "   - Go to Vercel dashboard → Settings → Integrations"
echo "   - Add AWS integration"
echo "   - Select role: VercelActionITRole"
echo "4. ⏳ Set environment variables in Vercel dashboard:"
echo "   - AWS_REGION=us-east-1"
echo "   - GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth"
echo "   - KMS_KEY_ALIAS=alias/axnt-oauth"
echo "   - DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens"
echo "   - DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs"
echo "   - NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app"
echo "   - NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id"
echo "   - NODE_ENV=production"
echo "5. ⏳ Update Google OAuth client with Vercel domain:"
echo "   - Authorized JavaScript origins: https://actionit-dev.vercel.app"
echo "   - Authorized redirect URIs: https://actionit-dev.vercel.app/auth/callback"
echo "6. ⏳ Update AWS Secrets Manager with Vercel redirect URI"
echo "7. ⏳ Create DynamoDB tables: axnt-oauth-tokens and axnt-oauth-tokens-logs"
echo "8. ⏳ Test OAuth flow on production domain"

print_warning "Remember to complete the post-deployment checklist before testing!"
