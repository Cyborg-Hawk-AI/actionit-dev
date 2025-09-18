# Production OAuth Setup for Vercel Domain

## 1. Google Cloud Console Updates

### Update OAuth 2.0 Client Configuration
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

### Update OAuth Consent Screen (if needed)
1. Go to **APIs & Services** → **OAuth consent screen**
2. Update **Authorized domains** if required:
   ```
   actionit-dev.vercel.app
   ```

## 2. AWS Secrets Manager Update

### Update the Secret with Vercel Domain
```bash
# Update the existing secret
aws secretsmanager update-secret \
  --secret-id "axnt/google-oauth" \
  --secret-string '{
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "redirect_uri": "https://actionit-dev.vercel.app/auth/callback"
  }' \
  --region us-east-1
```

## 3. Vercel Environment Variables

### Required Environment Variables in Vercel
Go to your Vercel project dashboard → **Settings** → **Environment Variables**

#### Production Environment:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth
KMS_KEY_ALIAS=alias/axnt-oauth
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

#### Preview Environment (for testing):
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
GOOGLE_OAUTH_SECRET_NAME=axnt/google-oauth
KMS_KEY_ALIAS=alias/axnt-oauth
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
NEXT_PUBLIC_APP_URL=https://actionit-dev.vercel.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NODE_ENV=production
```

## 4. Update Code Configuration

### Update AWS Configuration
The code will automatically use the environment variables, but let's verify the configuration:

```typescript
// src/lib/aws-config.ts
export const CONFIG = {
  GOOGLE_OAUTH_SECRET_NAME: process.env.GOOGLE_OAUTH_SECRET_NAME || 'axnt/google-oauth',
  KMS_KEY_ALIAS: process.env.KMS_KEY_ALIAS || 'alias/axnt-oauth',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://actionit-dev.vercel.app',
} as const;
```

### Update DynamoDB Configuration
```typescript
// src/lib/dynamodb-storage.ts
const OAUTH_TOKENS_TABLE = process.env.DYNAMODB_OAUTH_TABLE || 'axnt-oauth-tokens';
```

## 5. Testing on Vercel Domain

### Step 1: Deploy to Vercel
```bash
# Push your changes
git add .
git commit -m "Update OAuth configuration for Vercel domain"
git push origin main

# Or use your sync script
./sync-to-dev-git.sh
```

### Step 2: Verify Deployment
1. Go to `https://actionit-dev.vercel.app`
2. Navigate to `/app/settings`
3. Check that the OAuth Testing panel appears (if in development mode)

### Step 3: Test OAuth Flow
1. Click **"Connect Google Calendar"** in Calendar Settings
2. You should be redirected to Google OAuth
3. Complete the authorization
4. You should be redirected back to `https://actionit-dev.vercel.app/auth/callback`

### Step 4: Verify Token Storage
1. Check browser console for logs
2. Verify tokens are stored in DynamoDB
3. Test calendar access

## 6. Production Testing Checklist

### Pre-Deployment Checklist
- [ ] Google OAuth client updated with Vercel domain
- [ ] AWS Secrets Manager updated with Vercel redirect URI
- [ ] Vercel environment variables configured
- [ ] DynamoDB tables created
- [ ] IAM policies updated
- [ ] KMS key configured

### Post-Deployment Testing
- [ ] OAuth flow works on Vercel domain
- [ ] Redirect URI matches exactly
- [ ] Tokens stored in DynamoDB
- [ ] Encryption working with KMS
- [ ] Calendar API access functional
- [ ] Error handling working

## 7. Troubleshooting Production Issues

### Common Issues

#### "Invalid redirect URI"
**Symptoms**: Google OAuth returns "redirect_uri_mismatch"
**Solutions**:
- Verify redirect URI in Google Console matches exactly: `https://actionit-dev.vercel.app/auth/callback`
- Check for trailing slashes or HTTP vs HTTPS
- Ensure domain is spelled correctly

#### "Access denied" for AWS services
**Symptoms**: Cannot access Secrets Manager or DynamoDB
**Solutions**:
- Verify AWS credentials in Vercel environment variables
- Check IAM permissions for production
- Ensure region is correct

#### "Token encryption failed"
**Symptoms**: Cannot encrypt/decrypt tokens
**Solutions**:
- Verify KMS key alias: `alias/axnt-oauth`
- Check KMS permissions in IAM policy
- Ensure KMS key is in same region as app

#### "DynamoDB table not found"
**Symptoms**: Cannot store/retrieve tokens
**Solutions**:
- Verify table names: `axnt-oauth-tokens` and `axnt-oauth-tokens-logs`
- Check DynamoDB permissions in IAM policy
- Ensure tables exist in correct region

### Debug Commands for Production

#### Test AWS Credentials
```bash
# Test from your local machine with production credentials
aws sts get-caller-identity --profile production
```

#### Test DynamoDB Access
```bash
aws dynamodb describe-table --table-name axnt-oauth-tokens --region us-east-1
```

#### Test Secrets Manager Access
```bash
aws secretsmanager get-secret-value --secret-id axnt/google-oauth --region us-east-1
```

#### Test KMS Access
```bash
aws kms describe-key --key-id alias/axnt-oauth --region us-east-1
```

## 8. Monitoring Production

### Vercel Analytics
1. Go to Vercel dashboard → **Analytics**
2. Monitor OAuth flow success rates
3. Check error rates and performance

### AWS CloudWatch
1. Monitor DynamoDB metrics
2. Check KMS usage
3. Monitor Secrets Manager access

### Browser Console
1. Check for OAuth flow errors
2. Monitor token storage success
3. Verify encryption/decryption

## 9. Security Considerations

### HTTPS Only
- Vercel provides HTTPS by default
- All OAuth flows use HTTPS
- No HTTP redirects allowed

### Domain Validation
- Google OAuth validates redirect URIs
- Must match exactly in Google Console
- No wildcard domains allowed

### Credential Security
- AWS credentials stored in Vercel environment
- Never commit credentials to code
- Use least privilege IAM policies

## 10. Rollback Plan

### If OAuth Flow Fails
1. Check Google Console redirect URIs
2. Verify Vercel environment variables
3. Test AWS service access
4. Check browser console for errors

### If Token Storage Fails
1. Verify DynamoDB table exists
2. Check IAM permissions
3. Test KMS encryption
4. Verify table names in environment

### Emergency Rollback
1. Revert to previous Vercel deployment
2. Update Google OAuth redirect URIs
3. Test with known working configuration
