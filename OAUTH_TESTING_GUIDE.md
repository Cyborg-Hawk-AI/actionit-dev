# OAuth Testing Guide

## Overview

This guide explains how to test the Google OAuth flow and verify that credentials/tokens are properly stored in DynamoDB. The testing framework captures detailed responses and provides comprehensive logging.

## Prerequisites

1. **AWS Infrastructure Setup**:
   - DynamoDB tables created
   - IAM policies configured
   - Secrets Manager secret created
   - KMS key configured

2. **Google OAuth Setup**:
   - OAuth 2.0 client created
   - Redirect URIs configured
   - APIs enabled

3. **Environment Variables**:
   ```bash
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   GOOGLE_OAUTH_SECRET_NAME=action-it/google-oauth
   KMS_KEY_ALIAS=alias/action-it-oauth
   DYNAMODB_OAUTH_TABLE=action-it-oauth-tokens
   DYNAMODB_OAUTH_LOGS_TABLE=action-it-oauth-tokens-logs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

## Testing Methods

### 1. Automated Testing (Development Mode)

#### Access the Testing Panel
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:3000/app/settings`
3. Scroll down to the "OAuth Testing" section
4. The testing panel will only appear in development mode

#### Run OAuth Flow Test
1. Click **"Start OAuth Test"** button
2. The system will:
   - Create a test session
   - Generate OAuth URL
   - Log all steps with timestamps
   - Capture responses for analysis

#### Test Token Retrieval
1. After completing OAuth flow, click **"Test Token Retrieval"**
2. This will:
   - Retrieve tokens from DynamoDB
   - Decrypt tokens using KMS
   - Verify token validity
   - Display user tokens

#### Export Test Report
1. Click **"Export Report"** to download a JSON file
2. The report includes:
   - Complete test session data
   - Step-by-step execution log
   - Captured responses
   - Error details
   - Performance metrics

### 2. Manual Testing (Production Flow)

#### Step 1: Initiate OAuth Flow
1. Navigate to `http://localhost:3000/app/settings`
2. Click **"Connect Google Calendar"** in Calendar Settings
3. You'll be redirected to Google OAuth consent screen

#### Step 2: Complete Authorization
1. Sign in with your Google account
2. Grant requested permissions
3. You'll be redirected back to `/auth/callback`

#### Step 3: Verify Token Storage
1. Check browser console for detailed logs
2. Verify tokens are stored in DynamoDB
3. Confirm encryption is working

### 3. API Testing (Direct Integration)

#### Test OAuth URL Generation
```javascript
import { generateGoogleAuthUrl } from '@/lib/google-oauth';

const authUrl = await generateGoogleAuthUrl();
console.log('OAuth URL:', authUrl);
```

#### Test Token Exchange
```javascript
import { exchangeCodeForTokens } from '@/lib/google-oauth';

const tokens = await exchangeCodeForTokens('authorization-code');
console.log('Tokens:', tokens);
```

#### Test DynamoDB Storage
```javascript
import { storeOAuthTokens, getOAuthTokens } from '@/lib/dynamodb-storage';

// Store tokens
const record = await storeOAuthTokens(
  'user-123',
  'user@example.com',
  'google',
  userInfo,
  tokens
);

// Retrieve tokens
const storedTokens = await getOAuthTokens('user-123', 'google');
```

## Testing Scenarios

### 1. Happy Path Testing
- **Scenario**: Complete OAuth flow with valid credentials
- **Expected**: 
  - OAuth URL generated successfully
  - User redirected to Google
  - Authorization completed
  - Tokens exchanged successfully
  - User info retrieved
  - Tokens stored in DynamoDB
  - Tokens encrypted with KMS

### 2. Error Handling Testing
- **Scenario**: Invalid authorization code
- **Expected**: 
  - Error logged with details
  - User redirected to error page
  - No tokens stored
  - Error captured in test report

### 3. Token Expiration Testing
- **Scenario**: Tokens expire during session
- **Expected**: 
  - Automatic token refresh
  - New tokens stored
  - Old tokens marked as expired
  - Seamless user experience

### 4. DynamoDB Storage Testing
- **Scenario**: Verify token storage and retrieval
- **Expected**: 
  - Tokens encrypted before storage
  - Tokens decrypted on retrieval
  - User info stored correctly
  - Timestamps updated properly

## Monitoring and Debugging

### 1. Browser Console Logs
```javascript
// Enable detailed logging
console.log('[OAuth Testing] Session created:', sessionId);
console.log('[OAuth Testing] Step completed:', step, success);
console.log('[OAuth Testing] Response captured:', responseType, data);
```

### 2. DynamoDB Logs
```bash
# Check OAuth tokens table
aws dynamodb scan --table-name action-it-oauth-tokens

# Check OAuth flow logs
aws dynamodb scan --table-name action-it-oauth-tokens-logs
```

### 3. CloudWatch Logs
- Monitor AWS API calls
- Track error rates
- Monitor performance metrics

### 4. Test Report Analysis
```json
{
  "summary": {
    "sessionId": "test-1234567890-abc123",
    "flowId": "flow-1234567890-def456",
    "duration": 2500,
    "totalSteps": 6,
    "successRate": 100,
    "errorCount": 0
  },
  "steps": [
    {
      "step": "generate_auth_url",
      "timestamp": "2024-01-01T00:00:00Z",
      "success": true
    }
  ],
  "responses": [
    {
      "type": "auth_url",
      "timestamp": "2024-01-01T00:00:00Z",
      "data": {
        "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
      }
    }
  ],
  "errors": []
}
```

## Troubleshooting

### Common Issues

#### 1. "Access Denied" for DynamoDB
**Symptoms**: Cannot store/retrieve tokens
**Solutions**:
- Verify IAM policy includes DynamoDB permissions
- Check table ARN in policy
- Ensure region matches

#### 2. "Invalid redirect URI"
**Symptoms**: Google OAuth returns error
**Solutions**:
- Verify redirect URI in Google Console
- Check that callback URL matches exactly
- Ensure HTTPS in production

#### 3. "Token encryption failed"
**Symptoms**: Cannot encrypt/decrypt tokens
**Solutions**:
- Verify KMS key alias is correct
- Check KMS permissions in IAM policy
- Ensure KMS key is in same region

#### 4. "Secrets Manager access denied"
**Symptoms**: Cannot retrieve Google OAuth credentials
**Solutions**:
- Verify secret name matches exactly
- Check IAM permissions for Secrets Manager
- Ensure secret exists in correct region

### Debug Commands

#### Test AWS Credentials
```bash
aws sts get-caller-identity
```

#### Test DynamoDB Access
```bash
aws dynamodb describe-table --table-name action-it-oauth-tokens
```

#### Test Secrets Manager Access
```bash
aws secretsmanager get-secret-value --secret-id action-it/google-oauth
```

#### Test KMS Access
```bash
aws kms describe-key --key-id alias/action-it-oauth
```

## Performance Testing

### 1. Load Testing
- Test with multiple concurrent users
- Monitor DynamoDB capacity
- Check KMS encryption performance

### 2. Token Refresh Testing
- Test automatic token refresh
- Monitor refresh success rates
- Verify seamless user experience

### 3. Cleanup Testing
- Test expired token cleanup
- Monitor DynamoDB storage usage
- Verify TTL functionality

## Security Testing

### 1. Token Encryption
- Verify tokens are encrypted before storage
- Test decryption functionality
- Ensure no plaintext tokens in logs

### 2. Access Control
- Test IAM permissions
- Verify least privilege access
- Check for unauthorized access

### 3. Data Retention
- Test token expiration
- Verify cleanup procedures
- Check log retention policies

## Production Deployment Testing

### 1. Environment Validation
- Verify all environment variables
- Test production OAuth URLs
- Check HTTPS configuration

### 2. End-to-End Testing
- Complete OAuth flow in production
- Verify token storage
- Test calendar API access

### 3. Monitoring Setup
- Configure CloudWatch alarms
- Set up error tracking
- Monitor performance metrics

## Best Practices

### 1. Testing Strategy
- Test in development first
- Use staging environment for integration testing
- Perform production smoke tests

### 2. Error Handling
- Test all error scenarios
- Verify error logging
- Check user experience during errors

### 3. Security
- Never log sensitive data
- Use encrypted storage
- Implement proper access controls

### 4. Monitoring
- Set up comprehensive logging
- Monitor key metrics
- Implement alerting

## Next Steps

1. **Complete AWS Infrastructure Setup**
2. **Configure Google OAuth**
3. **Run Development Tests**
4. **Deploy to Staging**
5. **Perform Production Testing**
6. **Set up Monitoring**
7. **Go Live**
