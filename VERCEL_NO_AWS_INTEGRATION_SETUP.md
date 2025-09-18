# Vercel Setup Without AWS Integration

## Current AWS Resources Verified

Based on AWS CLI verification, you have the following resources:

### ✅ **Secrets Manager**
- **Secret Name**: `axnt-google-auth`
- **Content**: Google OAuth credentials with custom field names
- **KMS Key**: `d6376589-883b-4a5f-8734-4e0dbc605afc`

### ✅ **KMS Keys**
- **Key 1**: `alias/axnt-google-authenticator-key` (ID: `2b5ef42d-74d6-4e20-a74a-226a6b2b183a`)
- **Key 2**: `alias/axnt-secrets-decrypt` (ID: `d6376589-883b-4a5f-8734-4e0dbc605afc`)

### ✅ **DynamoDB Tables**
- **Table 1**: `axnt-oauth-tokens` (Composite key: userId + provider)
- **Table 2**: `axnt-oauth-tokens-logs` (Composite key: userId + timestamp)

### ✅ **IAM Role**
- **Role**: `axnt-google-authenticator-role`
- **ARN**: `arn:aws:iam::427645342156:role/service-role/axnt-google-authenticator-role`

## Setup for Vercel Without AWS Integration

Since you don't have AWS integration in Vercel, we need to use AWS access keys.

### Step 1: Create IAM User for Vercel

```bash
# Create IAM user for Vercel
aws iam create-user --user-name vercel-axnt-user

# Create access key for the user
aws iam create-access-key --user-name vercel-axnt-user
```

**Save the access key and secret key - you'll need them for Vercel environment variables.**

### Step 2: Create IAM Policy for Vercel User

```bash
# Create policy for Vercel user
aws iam create-policy \
  --policy-name VercelAxntPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": "arn:aws:secretsmanager:us-east-1:427645342156:secret:axnt-google-auth*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ],
        "Resource": "arn:aws:kms:us-east-1:427645342156:key/d6376589-883b-4a5f-8734-4e0dbc605afc"
      },
      {
        "Effect": "Allow",
        "Action": [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan"
        ],
        "Resource": [
          "arn:aws:dynamodb:us-east-1:427645342156:table/axnt-oauth-tokens",
          "arn:aws:dynamodb:us-east-1:427645342156:table/axnt-oauth-tokens-logs"
        ]
      }
    ]
  }'

# Attach policy to user
aws iam attach-user-policy \
  --user-name vercel-axnt-user \
  --policy-arn arn:aws:iam::427645342156:policy/VercelAxntPolicy
```

### Step 3: Set Environment Variables in Vercel

Go to your Vercel project dashboard → **Settings** → **Environment Variables** and add:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA... (from Step 1)
AWS_SECRET_ACCESS_KEY=... (from Step 1)

# Google OAuth Configuration
GOOGLE_OAUTH_SECRET_NAME=axnt-google-auth
KMS_KEY_ALIAS=alias/axnt-secrets-decrypt

# DynamoDB Configuration
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs

# App Configuration
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=744781363741-j291tiol3d6i55i9o0te4rt0c6uueurl.apps.googleusercontent.com
NODE_ENV=production
```

### Step 4: Update Google OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 client and click **Edit**
4. Update **Authorized JavaScript origins**:
   - `https://actionit-dev.vercel.app`
5. Update **Authorized redirect URIs**:
   - `https://actionit-dev.vercel.app/auth/callback`

### Step 5: Test the Setup

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Test OAuth Flow**:
   - Go to `https://actionit-dev.vercel.app/login`
   - Click the **Google** button
   - Complete the OAuth flow
   - Check browser console for detailed logs

### Step 6: Verify AWS Resources

Test that the setup works by checking AWS access:

```bash
# Test Secrets Manager access
aws secretsmanager get-secret-value --secret-id axnt-google-auth

# Test KMS access
aws kms describe-key --key-id alias/axnt-secrets-decrypt

# Test DynamoDB access
aws dynamodb describe-table --table-name axnt-oauth-tokens
```

## Troubleshooting

### If you still get "Credential is missing":

1. **Check Environment Variables**: Ensure all AWS credentials are set in Vercel
2. **Check IAM Permissions**: Verify the user has the correct policy attached
3. **Check Resource Names**: Ensure all resource names match exactly
4. **Check Region**: Ensure AWS_REGION is set to `us-east-1`

### Debug Steps:

1. **Check Vercel Logs**: Go to Vercel dashboard → Functions → View logs
2. **Test AWS Access**: Use the AWS CLI to verify permissions
3. **Check Browser Console**: Look for detailed error messages

## Security Notes

- **Access Keys**: Store securely and rotate regularly
- **IAM Policy**: Minimal permissions for required resources only
- **Environment Variables**: Never commit access keys to code
- **Monitoring**: Set up CloudTrail to monitor AWS access

## Next Steps

1. Set up the IAM user and policy
2. Configure Vercel environment variables
3. Deploy and test the OAuth flow
4. Monitor AWS CloudTrail for any access issues
