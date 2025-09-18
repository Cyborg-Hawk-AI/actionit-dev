# Vercel AWS Credentials Fix

## Issue
The error "Credential is missing" occurs because Vercel doesn't have AWS credentials configured to access AWS Secrets Manager.

## Solution: Configure AWS Integration in Vercel

### Step 1: Create IAM Role for Vercel

First, create the IAM role that Vercel will use:

```bash
# Create the IAM role
aws iam create-role \
  --role-name VercelActionITRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "vercel.com"
        },
        "Action": "sts:AssumeRole",
        "Condition": {
          "StringEquals": {
            "sts:ExternalId": "vercel-axnt-oauth"
          }
        }
      }
    ]
  }'

# Attach the OAuth policy
aws iam attach-role-policy \
  --role-name VercelActionITRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ActionIT-OAuth-Policy
```

### Step 2: Configure Vercel AWS Integration

1. **Go to Vercel Dashboard**
   - Navigate to your project: `actionit-dev`
   - Go to **Settings** → **Integrations**

2. **Add AWS Integration**
   - Click **Add Integration**
   - Search for "AWS" and select it
   - Click **Add**

3. **Configure AWS Integration**
   - **AWS Account ID**: Your AWS account ID
   - **IAM Role ARN**: `arn:aws:iam::YOUR_ACCOUNT_ID:role/VercelActionITRole`
   - **External ID**: `vercel-axnt-oauth`
   - **Region**: `us-east-1`

### Step 3: Set Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/VercelActionITRole
AWS_EXTERNAL_ID=vercel-axnt-oauth

# Google OAuth Configuration
GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth
KMS_KEY_ALIAS=alias/axnt-oauth

# DynamoDB Configuration
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs

# App Configuration
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

### Step 4: Create Required AWS Resources

#### Create Secrets Manager Secret
```bash
aws secretsmanager create-secret \
  --name "axnt/google-oauth" \
  --description "Google OAuth credentials for Action.IT" \
  --secret-string '{
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "redirect_uri": "https://actionit-dev.vercel.app/auth/callback"
  }'
```

#### Create KMS Key
```bash
# Create KMS key
aws kms create-key \
  --description "Action.IT OAuth encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

# Create alias
aws kms create-alias \
  --alias-name "alias/axnt-oauth" \
  --target-key-id "YOUR_KEY_ID"
```

#### Create DynamoDB Tables
```bash
# Create OAuth tokens table
aws dynamodb create-table \
  --table-name axnt-oauth-tokens \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Create OAuth logs table
aws dynamodb create-table \
  --table-name axnt-oauth-tokens-logs \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Step 5: Update IAM Policy

Create the IAM policy that allows access to all required resources:

```bash
aws iam create-policy \
  --policy-name ActionIT-OAuth-Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:axnt/google-oauth*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "arn:aws:kms:us-east-1:YOUR_ACCOUNT_ID:key/YOUR_KEY_ID"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ],
        "Resource": [
          "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/axnt-oauth-tokens",
          "arn:aws:dynamodb:us-east-1:YOUR_ACCOUNT_ID:table/axnt-oauth-tokens-logs"
        ]
      }
    ]
  }'
```

### Step 6: Redeploy to Vercel

After configuring everything:

```bash
# Redeploy to Vercel
vercel --prod
```

### Step 7: Test the OAuth Flow

1. Go to `https://actionit-dev.vercel.app/login`
2. Click the **Google** button
3. Complete the OAuth flow
4. Check that you're redirected to `/app/settings`

## Troubleshooting

### If you still get "Credential is missing":

1. **Check Vercel Integration**: Ensure AWS integration is properly configured
2. **Check Environment Variables**: All required variables are set
3. **Check IAM Role**: Role has correct trust policy and permissions
4. **Check AWS Resources**: Secrets Manager secret, KMS key, and DynamoDB tables exist

### Debug Steps:

1. **Check Vercel Logs**: Go to Vercel dashboard → Functions → View logs
2. **Test AWS Access**: Use Vercel's function logs to debug AWS calls
3. **Verify Permissions**: Ensure IAM role has all required permissions

## Quick Fix Commands

If you need to quickly test with temporary credentials:

```bash
# Set temporary environment variables in Vercel
AWS_ACCESS_KEY_ID=your-temp-access-key
AWS_SECRET_ACCESS_KEY=your-temp-secret-key
```

**Note**: This is only for testing. Use IAM roles for production.
