# Vercel Role-Based OAuth Setup Guide

## Overview

This guide explains how to configure OAuth authentication for `actionit-dev.vercel.app` using IAM roles instead of access keys. This is more secure and follows AWS best practices.

## 1. IAM Role Setup

### Step 1: Create IAM Role for Vercel
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
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }' \
  --description "IAM role for Vercel Action.IT OAuth integration"
```

### Step 2: Create OAuth Policy
```bash
# Create the OAuth policy
aws iam create-policy \
  --policy-name ActionIT-OAuth-Policy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "SecretsManagerAccess",
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": [
          "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:axnt/google-oauth*"
        ]
      },
      {
        "Sid": "KMSAccess",
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ],
        "Resource": [
          "arn:aws:kms:YOUR_REGION:YOUR_ACCOUNT_ID:key/YOUR_KEY_ID"
        ]
      },
      {
        "Sid": "KMSAliasAccess",
        "Effect": "Allow",
        "Action": [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": [
          "arn:aws:kms:YOUR_REGION:YOUR_ACCOUNT_ID:alias/axnt-oauth"
        ]
      },
      {
        "Sid": "DynamoDBAccess",
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ],
        "Resource": [
          "arn:aws:dynamodb:YOUR_REGION:YOUR_ACCOUNT_ID:table/axnt-oauth-tokens",
          "arn:aws:dynamodb:YOUR_REGION:YOUR_ACCOUNT_ID:table/axnt-oauth-tokens-logs"
        ]
      }
    ]
  }'
```

### Step 3: Attach Policy to Role
```bash
# Attach the policy to the role
aws iam attach-role-policy \
  --role-name VercelActionITRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ActionIT-OAuth-Policy
```

## 2. Vercel Configuration

### Option A: Vercel AWS Integration (Recommended)

#### Step 1: Connect AWS Account
1. Go to Vercel dashboard → **Settings** → **Integrations**
2. Search for "AWS" and click **Add Integration**
3. Connect your AWS account
4. Select the role: `VercelActionITRole`

#### Step 2: Environment Variables
In Vercel dashboard → **Settings** → **Environment Variables**:

```
AWS_REGION=us-east-1
GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth
KMS_KEY_ALIAS=alias/axnt-oauth
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

**Note**: No AWS credentials needed - Vercel will use the connected AWS account and role.

### Option B: Manual Role Configuration

#### Step 1: Create External ID Secret
```bash
# Create a secret for external ID
aws secretsmanager create-secret \
  --name "vercel/external-id" \
  --description "External ID for Vercel role assumption" \
  --secret-string "vercel-axnt-oauth" \
  --region us-east-1
```

#### Step 2: Update Trust Policy
```bash
# Update trust policy to allow Vercel to assume the role
aws iam update-assume-role-policy \
  --role-name VercelActionITRole \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      },
      {
        "Effect": "Allow",
        "Principal": {
          "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:root"
        },
        "Action": "sts:AssumeRole",
        "Condition": {
          "StringEquals": {
            "sts:ExternalId": "vercel-actionit-oauth"
          }
        }
      }
    ]
  }'
```

#### Step 3: Environment Variables
```
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/VercelActionITRole
AWS_EXTERNAL_ID=vercel-actionit-oauth
GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth
KMS_KEY_ALIAS=alias/axnt-oauth
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

## 3. Google OAuth Configuration

### Update OAuth Client
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 client and click **Edit**
4. Update **Authorized JavaScript origins**:
   ```
   https://actionit-dev.vercel.app
   ```
5. Update **Authorized redirect URIs**:
   ```
   https://actionit-dev.vercel.app/auth/callback
   ```
6. Click **Save**

## 4. AWS Secrets Manager Update

### Update Secret with Vercel Domain
```bash
# Update the secret with Vercel domain
aws secretsmanager update-secret \
  --secret-id "axnt/google-oauth" \
  --secret-string '{
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "redirect_uri": "https://actionit-dev.vercel.app/auth/callback"
  }' \
  --region us-east-1
```

## 5. DynamoDB Tables Setup

### Create OAuth Tokens Table
```bash
aws dynamodb create-table \
  --table-name axnt-oauth-tokens \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=provider,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=provider,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Create OAuth Logs Table
```bash
aws dynamodb create-table \
  --table-name axnt-oauth-tokens-logs \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## 6. Deploy to Vercel

### Using Deployment Script
```bash
# Run the deployment script
./deploy-to-vercel.sh
```

### Manual Deployment
```bash
# Push changes
git add .
git commit -m "Configure OAuth for Vercel with role-based authentication"
git push origin main

# Deploy to Vercel
vercel --prod
```

## 7. Testing on Production

### Step 1: Access the App
1. Go to `https://actionit-dev.vercel.app`
2. Navigate to `/app/settings`
3. Verify the page loads correctly

### Step 2: Test OAuth Flow
1. Click **"Connect Google Calendar"** in Calendar Settings
2. You should be redirected to Google OAuth consent screen
3. Complete the authorization process
4. You should be redirected back to `https://actionit-dev.vercel.app/auth/callback`

### Step 3: Verify Token Storage
1. Check browser console for logs
2. Verify no errors in the OAuth flow
3. Check that calendar connection shows as successful

### Step 4: Test Calendar Access
1. Verify that calendar settings show connected status
2. Check that user calendars are displayed
3. Test calendar API functionality

## 8. Troubleshooting Role-Based Authentication

### Common Issues

#### "Access Denied" for AWS Services
**Symptoms**: Cannot access Secrets Manager, DynamoDB, or KMS
**Solutions**:
- Verify IAM role is attached to Vercel
- Check role permissions include required services
- Ensure role trust policy allows Vercel to assume role

#### "Role Assumption Failed"
**Symptoms**: Cannot assume IAM role
**Solutions**:
- Verify role ARN is correct
- Check external ID matches
- Ensure trust policy allows Vercel service

#### "Credentials Not Found"
**Symptoms**: AWS SDK cannot find credentials
**Solutions**:
- Verify Vercel AWS integration is configured
- Check environment variables are set
- Ensure role is properly attached

### Debug Commands

#### Test Role Assumption
```bash
# Test role assumption locally
aws sts assume-role \
  --role-arn arn:aws:iam::YOUR_ACCOUNT_ID:role/VercelActionITRole \
  --role-session-name test-session \
  --external-id vercel-actionit-oauth
```

#### Test Role Permissions
```bash
# Test with assumed role credentials
aws sts get-caller-identity --profile assumed-role

# Test DynamoDB access
aws dynamodb describe-table --table-name axnt-oauth-tokens --profile assumed-role

# Test Secrets Manager access
aws secretsmanager get-secret-value --secret-id axnt/google-oauth --profile assumed-role
```

## 9. Security Best Practices

### Role Permissions
- Use least privilege principle
- Only grant necessary permissions
- Regular permission audits

### Trust Policy
- Limit who can assume the role
- Use external ID for additional security
- Regular trust policy reviews

### Monitoring
- Enable CloudTrail for role assumption
- Monitor for unauthorized access
- Set up alerts for failed role assumptions

## 10. Production Checklist

### Pre-Deployment
- [ ] IAM role created with correct permissions
- [ ] Trust policy configured for Vercel
- [ ] OAuth policy attached to role
- [ ] Google OAuth client updated with Vercel domain
- [ ] AWS Secrets Manager updated with Vercel redirect URI
- [ ] DynamoDB tables created
- [ ] KMS key configured

### Post-Deployment
- [ ] Vercel AWS integration configured
- [ ] Environment variables set (no credentials needed)
- [ ] App deploys successfully
- [ ] OAuth flow works on Vercel domain
- [ ] Redirect URI matches exactly
- [ ] Tokens stored in DynamoDB
- [ ] Encryption working with KMS
- [ ] Calendar API access functional
- [ ] Error handling working

## Summary

For role-based authentication with Vercel:

1. **Create IAM Role**: `VercelActionITRole` with OAuth permissions
2. **Configure Trust Policy**: Allow Vercel to assume the role
3. **Connect AWS to Vercel**: Use Vercel's AWS integration
4. **Set Environment Variables**: No credentials needed
5. **Deploy and Test**: Verify OAuth flow works with role authentication

This approach is more secure than using access keys and follows AWS best practices for serverless applications.
