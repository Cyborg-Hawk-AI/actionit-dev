# Vercel IAM Role Setup for OAuth Integration

## Overview

Since you're using IAM roles instead of IAM users, you need to configure Vercel to assume an IAM role for AWS service access. This is more secure than using access keys.

## 1. Create IAM Role for Vercel

### Step 1: Create Vercel IAM Role
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

### Step 2: Create Trust Policy for Vercel
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

### Step 3: Attach OAuth Policy to Role
```bash
# Attach the OAuth policy to the role
aws iam attach-role-policy \
  --role-name VercelActionITRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ActionIT-OAuth-Policy
```

## 2. Vercel Configuration for Role-Based Authentication

### Option A: Using Vercel's AWS Integration (Recommended)

#### Step 1: Connect AWS Account to Vercel
1. Go to Vercel dashboard → **Settings** → **Integrations**
2. Search for "AWS" and click **Add Integration**
3. Connect your AWS account
4. Select the role: `VercelActionITRole`

#### Step 2: Configure Environment Variables
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

### Option B: Using External ID (Alternative)

#### Step 1: Create External ID Secret
```bash
# Create a secret for external ID
aws secretsmanager create-secret \
  --name "vercel/external-id" \
  --description "External ID for Vercel role assumption" \
  --secret-string "vercel-actionit-oauth" \
  --region us-east-1
```

#### Step 2: Configure Vercel Environment Variables
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

## 3. Update AWS Configuration for Role Assumption

### Update aws-config.ts for Role-Based Authentication
```typescript
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { KMSClient } from '@aws-sdk/client-kms';
import { fromEnv, fromInstanceMetadata, fromWebToken } from '@aws-sdk/credential-providers';

// AWS Configuration for role-based authentication
const getAWSCredentials = () => {
  // For Vercel with role assumption
  if (process.env.AWS_ROLE_ARN && process.env.AWS_EXTERNAL_ID) {
    return fromWebToken({
      roleArn: process.env.AWS_ROLE_ARN,
      webIdentityToken: process.env.AWS_WEB_IDENTITY_TOKEN,
      roleSessionName: 'vercel-actionit-oauth',
      externalId: process.env.AWS_EXTERNAL_ID,
    });
  }
  
  // For local development with access keys
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  
  // For EC2/Lambda with instance metadata
  return fromInstanceMetadata();
};

const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: getAWSCredentials(),
};
```

## 4. Testing Role-Based Authentication

### Local Development Testing
```bash
# Test with local credentials
AWS_REGION=us-east-1 \
AWS_ACCESS_KEY_ID=your-key \
AWS_SECRET_ACCESS_KEY=your-secret \
npm run dev
```

### Production Testing on Vercel
1. Deploy to Vercel with role configuration
2. Test OAuth flow on `https://actionit-dev.vercel.app`
3. Check Vercel function logs for AWS service access
4. Verify tokens are stored in DynamoDB

## 5. Troubleshooting Role-Based Authentication

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

## 6. Security Best Practices

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

## 7. Production Deployment Checklist

### Pre-Deployment
- [ ] IAM role created with correct permissions
- [ ] Trust policy configured for Vercel
- [ ] OAuth policy attached to role
- [ ] Vercel AWS integration configured
- [ ] Environment variables set

### Post-Deployment
- [ ] OAuth flow works on Vercel domain
- [ ] AWS services accessible via role
- [ ] Tokens stored in DynamoDB
- [ ] Encryption working with KMS
- [ ] No access key credentials needed

## 8. Alternative: Vercel Edge Functions

If you need more control over AWS authentication, consider using Vercel Edge Functions:

### Create Edge Function for AWS Operations
```typescript
// api/oauth-handler.ts
import { NextRequest } from 'next/server';

export default async function handler(req: NextRequest) {
  // Handle OAuth operations with role-based authentication
  // This runs on Vercel's edge network with role access
}
```

### Benefits of Edge Functions
- Better control over AWS authentication
- Reduced cold start times
- More secure credential handling
- Better error handling

## Summary

For role-based authentication with Vercel:

1. **Create IAM Role**: `VercelActionITRole` with OAuth permissions
2. **Configure Trust Policy**: Allow Vercel to assume the role
3. **Connect AWS to Vercel**: Use Vercel's AWS integration
4. **Set Environment Variables**: No credentials needed
5. **Deploy and Test**: Verify OAuth flow works with role authentication

This approach is more secure than using access keys and follows AWS best practices for serverless applications.
