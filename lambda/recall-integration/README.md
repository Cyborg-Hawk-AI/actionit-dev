# Recall.ai Integration Lambda Function

This AWS Lambda function handles the integration between Google OAuth and Recall.ai calendar creation.

## Overview

The Lambda function:
1. Receives Google OAuth tokens from the Vercel app
2. Retrieves Recall.ai credentials from AWS Secrets Manager
3. Creates a Recall.ai calendar using the Google tokens
4. Returns the calendar information to the calling application

## Architecture

```
Vercel App → API Route → Lambda Function → Recall.ai API
                ↓
        AWS Secrets Manager (credentials)
                ↓
        AWS KMS (encryption)
```

## Prerequisites

- AWS CLI configured with appropriate permissions
- Recall.ai API key stored in AWS Secrets Manager
- Google OAuth credentials stored in AWS Secrets Manager
- KMS key for encryption (created automatically by deploy script)

## Deployment

1. **Deploy the Lambda function:**
   ```bash
   cd lambda/recall-integration
   ./deploy.sh
   ```

2. **Set environment variables in Vercel:**
   - `RECALL_LAMBDA_FUNCTION_NAME`: `axnt-recall-integration`
   - `AWS_REGION`: `us-east-1`

## Environment Variables

The Lambda function uses the following environment variables:

- `KMS_KEY_ID`: KMS key ID for encryption (default: `alias/axnt-encryption-key`)

## Required AWS Permissions

The Lambda function requires the following permissions:

- `secretsmanager:GetSecretValue` for the `axnt-recall-google-oauth` secret
- `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey`, `kms:DescribeKey` for encryption
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for logging

## KMS Key

The deployment script automatically creates a KMS key with the following specifications:

- **Key Type**: Symmetric (AES-256)
- **Usage**: Encrypt/Decrypt
- **Alias**: `axnt-encryption-key`
- **Description**: "KMS key for Recall.ai integration encryption"

The Lambda function uses this key for encrypting sensitive data before storage or transmission.

## Input Format

The Lambda function expects the following input:

```json
{
  "userId": "user-123",
  "googleTokens": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//05n78zP...",
    "expires_at": 1758179387514
  }
}
```

## Output Format

Successful execution returns:

```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "userId": "user-123",
    "calendarId": "cal_abc123",
    "status": "connected",
    "platform": "google_calendar",
    "platform_email": "user@example.com",
    "created_at": "2025-01-18T06:00:00Z",
    "message": "Recall.ai calendar created successfully"
  }
}
```

## Error Handling

The function handles various error scenarios:

- Missing required parameters
- AWS Secrets Manager access failures
- Recall.ai API errors
- Network timeouts
- KMS encryption/decryption failures

## Monitoring

- CloudWatch Logs: `/aws/lambda/axnt-recall-integration`
- CloudWatch Metrics: Lambda execution metrics
- X-Ray tracing (if enabled)

## Security

- All credentials stored in AWS Secrets Manager
- KMS encryption for sensitive data
- IAM role-based permissions
- No hardcoded secrets in code

## Testing

### Automated Testing

Use the provided test script:

```bash
cd lambda/recall-integration
./test-lambda.sh
```

### Manual Testing

Test the Lambda function manually:

```bash
# Create test event
echo '{
  "userId": "test-user-123",
  "googleTokens": {
    "access_token": "test-access-token",
    "refresh_token": "test-refresh-token",
    "expires_at": 1758179387514
  }
}' > test-event.json

# Invoke function
aws lambda invoke \
  --function-name axnt-recall-integration \
  --payload file://test-event.json \
  --region us-east-1 \
  response.json

# Check response
cat response.json | jq '.'
```

### Testing with Real Credentials

For production testing, ensure you have:

1. Valid Google OAuth credentials in AWS Secrets Manager
2. Valid Recall.ai API key in the secret
3. Proper IAM permissions for the Lambda function

## Troubleshooting

Common issues and solutions:

1. **Permission denied errors**: Check IAM role permissions
2. **Secret not found**: Verify secret exists in Secrets Manager
3. **Recall.ai API errors**: Check API key and network connectivity
4. **Timeout errors**: Increase Lambda timeout or check network latency
