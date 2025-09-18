# Vercel Production Testing Guide

## Overview

This guide explains how to test the OAuth flow on your Vercel domain `actionit-dev.vercel.app` and verify that all configurations are working correctly.

## Prerequisites

1. **AWS Infrastructure Setup**:
   - DynamoDB tables: `axnt-oauth-tokens` and `axnt-oauth-tokens-logs`
   - IAM policies with DynamoDB permissions
   - Secrets Manager secret: `axnt/google-oauth`
   - KMS key: `alias/axnt-oauth`

2. **Google OAuth Setup**:
   - OAuth 2.0 client configured with Vercel domain
   - Redirect URIs: `https://actionit-dev.vercel.app/auth/callback`

3. **Vercel Configuration**:
   - Environment variables set
   - Domain configured
   - Deployment successful

## Step-by-Step Testing Process

### 1. Pre-Deployment Configuration

#### Update Google OAuth Client
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

#### Update AWS Secrets Manager
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

### 2. Deploy to Vercel

#### Option A: Using the Deployment Script
```bash
# Run the deployment script
./deploy-to-vercel.sh
```

#### Option B: Manual Deployment
```bash
# Push changes
git add .
git commit -m "Update OAuth configuration for Vercel domain"
git push origin main

# Deploy to Vercel
vercel --prod
```

### 3. Configure Vercel Environment Variables

Go to your Vercel project dashboard → **Settings** → **Environment Variables**

#### Required Environment Variables:
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

### 4. Test OAuth Flow on Production

#### Step 1: Access the App
1. Go to `https://actionit-dev.vercel.app`
2. Navigate to `/app/settings`
3. Verify the page loads correctly

#### Step 2: Test Google OAuth
1. Click **"Connect Google Calendar"** in Calendar Settings
2. You should be redirected to Google OAuth consent screen
3. Complete the authorization process
4. You should be redirected back to `https://actionit-dev.vercel.app/auth/callback`

#### Step 3: Verify Token Storage
1. Check browser console for logs
2. Verify no errors in the OAuth flow
3. Check that calendar connection shows as successful

#### Step 4: Test Calendar Access
1. Verify that calendar settings show connected status
2. Check that user calendars are displayed
3. Test calendar API functionality

### 5. Debugging Production Issues

#### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for OAuth flow logs
4. Check for any error messages

#### Check Vercel Logs
1. Go to Vercel dashboard → **Functions** tab
2. Check for any server-side errors
3. Monitor function execution logs

#### Check AWS Services
```bash
# Test DynamoDB access
aws dynamodb describe-table --table-name axnt-oauth-tokens --region us-east-1

# Test Secrets Manager access
aws secretsmanager get-secret-value --secret-id axnt/google-oauth --region us-east-1

# Test KMS access
aws kms describe-key --key-id alias/axnt-oauth --region us-east-1
```

### 6. Common Production Issues

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

### 7. Production Testing Checklist

#### Pre-Deployment
- [ ] Google OAuth client updated with Vercel domain
- [ ] AWS Secrets Manager updated with Vercel redirect URI
- [ ] DynamoDB tables created
- [ ] IAM policies configured
- [ ] KMS key configured

#### Post-Deployment
- [ ] Vercel environment variables set
- [ ] App deploys successfully
- [ ] OAuth flow works on Vercel domain
- [ ] Redirect URI matches exactly
- [ ] Tokens stored in DynamoDB
- [ ] Encryption working with KMS
- [ ] Calendar API access functional
- [ ] Error handling working

### 8. Monitoring Production

#### Vercel Analytics
1. Go to Vercel dashboard → **Analytics**
2. Monitor OAuth flow success rates
3. Check error rates and performance

#### AWS CloudWatch
1. Monitor DynamoDB metrics
2. Check KMS usage
3. Monitor Secrets Manager access

#### Browser Console
1. Check for OAuth flow errors
2. Monitor token storage success
3. Verify encryption/decryption

### 9. Security Verification

#### HTTPS Verification
- Verify all OAuth flows use HTTPS
- Check that redirect URIs are HTTPS
- Ensure no HTTP redirects

#### Domain Validation
- Verify Google OAuth validates redirect URIs
- Check that domain matches exactly in Google Console
- Ensure no wildcard domains

#### Credential Security
- Verify AWS credentials stored in Vercel environment
- Check that credentials are not in code
- Verify least privilege IAM policies

### 10. Rollback Plan

#### If OAuth Flow Fails
1. Check Google Console redirect URIs
2. Verify Vercel environment variables
3. Test AWS service access
4. Check browser console for errors

#### If Token Storage Fails
1. Verify DynamoDB table exists
2. Check IAM permissions
3. Test KMS encryption
4. Verify table names in environment

#### Emergency Rollback
1. Revert to previous Vercel deployment
2. Update Google OAuth redirect URIs
3. Test with known working configuration

### 11. Performance Testing

#### Load Testing
- Test with multiple concurrent users
- Monitor DynamoDB capacity
- Check KMS encryption performance

#### Token Refresh Testing
- Test automatic token refresh
- Monitor refresh success rates
- Verify seamless user experience

#### Cleanup Testing
- Test expired token cleanup
- Monitor DynamoDB storage usage
- Verify TTL functionality

### 12. Next Steps After Successful Testing

1. **Monitor Production**: Set up CloudWatch alarms and monitoring
2. **User Testing**: Have real users test the OAuth flow
3. **Performance Optimization**: Monitor and optimize as needed
4. **Security Review**: Regular security audits
5. **Documentation**: Update documentation with production URLs

## Summary

Testing on `actionit-dev.vercel.app` requires:
1. **Google OAuth Configuration**: Update redirect URIs to Vercel domain
2. **AWS Configuration**: Update Secrets Manager with Vercel domain
3. **Vercel Environment**: Set all required environment variables
4. **Testing**: Complete OAuth flow on production domain
5. **Monitoring**: Set up monitoring and alerting

The key is ensuring all configurations match the Vercel domain exactly, especially the redirect URIs in Google OAuth and the redirect URI in AWS Secrets Manager.
