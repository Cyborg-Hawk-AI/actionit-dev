# DynamoDB Setup for OAuth Token Storage

## 1. DynamoDB Table Creation

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

### Create OAuth Flow Logs Table
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

## 2. IAM Policy for DynamoDB Access

### Update IAM Policy
Add these permissions to your existing `ActionIT-OAuth-Policy`:

```json
{
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
}
```

## 3. Environment Variables

### Add to your .env file:
```bash
# DynamoDB Configuration
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
```

### Add to Vercel Environment Variables:
```
DYNAMODB_OAUTH_TABLE=axnt-oauth-tokens
DYNAMODB_OAUTH_LOGS_TABLE=axnt-oauth-tokens-logs
```

## 4. Table Schema

### OAuth Tokens Table (axnt-oauth-tokens)
```json
{
  "userId": "string (HASH)",
  "provider": "string (RANGE)",
  "email": "string",
  "encryptedTokens": "object",
  "userInfo": "object",
  "createdAt": "string",
  "updatedAt": "string",
  "expiresAt": "number",
  "isActive": "boolean",
  "lastUsed": "string"
}
```

### OAuth Flow Logs Table (axnt-oauth-tokens-logs)
```json
{
  "userId": "string (HASH)",
  "timestamp": "string (RANGE)",
  "flowId": "string",
  "step": "string",
  "data": "object",
  "error": "string",
  "ipAddress": "string",
  "userAgent": "string"
}
```

## 5. Testing the Setup

### Test DynamoDB Connection
```bash
# Test table access
aws dynamodb describe-table \
  --table-name axnt-oauth-tokens \
  --region us-east-1

# Test write access
aws dynamodb put-item \
  --table-name axnt-oauth-tokens \
  --item '{
    "userId": {"S": "test-user-123"},
    "provider": {"S": "google"},
    "email": {"S": "test@example.com"},
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00Z"}
  }' \
  --region us-east-1

# Test read access
aws dynamodb get-item \
  --table-name axnt-oauth-tokens \
  --key '{
    "userId": {"S": "test-user-123"},
    "provider": {"S": "google"}
  }' \
  --region us-east-1
```

## 6. Security Considerations

### Encryption at Rest
- DynamoDB tables are encrypted by default
- OAuth tokens are encrypted with KMS before storage
- Sensitive data is double-encrypted

### Access Control
- IAM policies restrict access to specific tables
- Least privilege principle applied
- No public access to tables

### Data Retention
- Implement TTL for automatic cleanup
- Regular cleanup of expired tokens
- Log retention policies

## 7. Monitoring and Alerts

### CloudWatch Metrics
- Monitor DynamoDB read/write capacity
- Set up alarms for throttling
- Track error rates

### CloudTrail Logging
- Log all DynamoDB API calls
- Monitor for unauthorized access
- Track token access patterns

## 8. Backup and Recovery

### Point-in-Time Recovery
```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name axnt-oauth-tokens \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

### Cross-Region Replication
- Consider for disaster recovery
- Replicate to secondary region
- Test failover procedures

## 9. Cost Optimization

### On-Demand vs Provisioned
- Start with on-demand billing
- Monitor usage patterns
- Switch to provisioned if cost-effective

### TTL for Cleanup
```bash
# Set TTL attribute
aws dynamodb update-time-to-live \
  --table-name axnt-oauth-tokens \
  --time-to-live-specification AttributeName=expiresAt,Enabled=true \
  --region us-east-1
```

## 10. Troubleshooting

### Common Issues

**"Access Denied" for DynamoDB:**
- Verify IAM policy includes DynamoDB permissions
- Check table ARN in policy
- Ensure region matches

**"Table not found":**
- Verify table name is correct
- Check region configuration
- Ensure table is created

**"Throttling errors":**
- Check DynamoDB capacity
- Consider increasing capacity
- Implement exponential backoff

### Debug Commands
```bash
# Check table status
aws dynamodb describe-table --table-name axnt-oauth-tokens

# List all tables
aws dynamodb list-tables

# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name your-username
```
