# Google OAuth Infrastructure Setup

## AWS Resources Required

### 1. Secrets Manager
```bash
# Create secret for Google OAuth credentials
aws secretsmanager create-secret \
  --name "action-it/google-oauth" \
  --description "Google OAuth Client Credentials" \
  --secret-string '{
    "client_id": "your-google-client-id",
    "client_secret": "your-google-client-secret",
    "redirect_uri": "https://your-domain.com/auth/callback"
  }'
```

### 2. KMS Key for Encryption
```bash
# Create KMS key for encrypting OAuth tokens
aws kms create-key \
  --description "Action.IT OAuth Token Encryption" \
  --key-usage ENCRYPT_DECRYPT \
  --key-spec SYMMETRIC_DEFAULT

# Create alias for easier reference
aws kms create-alias \
  --alias-name "alias/action-it-oauth" \
  --target-key-id "your-key-id"
```

### 3. IAM Role and Policy Setup

#### Step 1: Create IAM Policy
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Policies** → **Create Policy**
3. Choose **JSON** tab and paste this policy:

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
        "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT_ID:secret:action-it/google-oauth*"
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
        "arn:aws:kms:YOUR_REGION:YOUR_ACCOUNT_ID:alias/action-it-oauth"
      ]
    }
  ]
}
```

4. **Policy name**: `ActionIT-OAuth-Policy`
5. **Description**: `Policy for Action.IT OAuth integration with Secrets Manager and KMS access`
6. Click **Create Policy**

#### Step 2: Create IAM Role
1. In IAM Console, go to **Roles** → **Create Role**
2. **Trusted entity type**: `AWS service`
3. **Use case**: `EC2` (or `Lambda` if using serverless)
4. Click **Next**

#### Step 3: Attach Policies to Role
1. Search for and select: `ActionIT-OAuth-Policy` (the policy you just created)
2. **Optional**: Also attach `AmazonSSMReadOnlyAccess` for parameter store access
3. Click **Next**

#### Step 4: Configure Role Details
1. **Role name**: `ActionIT-OAuth-Role`
2. **Description**: `IAM role for Action.IT OAuth integration with AWS Secrets Manager and KMS`
3. **Tags** (optional):
   - Key: `Project`, Value: `ActionIT`
   - Key: `Environment`, Value: `Production`
4. Click **Create Role**

#### Step 5: Create IAM User (Alternative to Role)
If you prefer using IAM User instead of Role:

1. Go to **Users** → **Create User**
2. **User name**: `action-it-oauth-user`
3. **Access type**: `Programmatic access`
4. **Attach policies directly**: Select `ActionIT-OAuth-Policy`
5. **Tags**:
   - Key: `Project`, Value: `ActionIT`
   - Key: `Environment`, Value: `Production`
6. Click **Create User**
7. **IMPORTANT**: Download the CSV file with Access Key ID and Secret Access Key

#### Step 6: Configure Trust Policy (For Role Only)
If using IAM Role, update the trust policy:

1. Go to your created role: `ActionIT-OAuth-Role`
2. Click **Trust relationships** tab
3. Click **Edit trust policy**
4. Replace with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "ec2.amazonaws.com",
          "lambda.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### Step 7: Get Account ID and Region
To complete the policy ARNs, you need:

1. **Account ID**: 
   - Go to AWS Console → Click your username (top right)
   - Copy the Account ID from the dropdown

2. **Region**: 
   - Note your current AWS region (e.g., `us-east-1`)

3. **KMS Key ID**:
   - Go to KMS Console → Your Keys
   - Copy the Key ID from your `action-it-oauth` key

#### Step 8: Update Policy ARNs
Replace these placeholders in the policy:
- `YOUR_REGION` → Your AWS region (e.g., `us-east-1`)
- `YOUR_ACCOUNT_ID` → Your 12-digit AWS account ID
- `YOUR_KEY_ID` → Your KMS key ID (e.g., `12345678-1234-1234-1234-123456789012`)

#### Step 9: Test Permissions
Create a test script to verify permissions:

```bash
# Test Secrets Manager access
aws secretsmanager get-secret-value \
  --secret-id "action-it/google-oauth" \
  --region us-east-1

# Test KMS access
aws kms describe-key \
  --key-id "alias/action-it-oauth" \
  --region us-east-1
```

#### Step 10: Environment Configuration
Based on your choice (Role vs User):

**For IAM User:**
```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
```

**For IAM Role (EC2/Lambda):**
```bash
# No credentials needed - role is assumed automatically
# Just ensure your EC2 instance or Lambda has the role attached
```

#### Step 11: Security Best Practices
1. **Least Privilege**: Only grant necessary permissions
2. **Regular Rotation**: Rotate access keys every 90 days
3. **Monitoring**: Enable CloudTrail for API calls
4. **MFA**: Enable MFA for IAM user (if using user approach)
5. **Conditional Access**: Add IP restrictions if needed

#### Step 12: Troubleshooting IAM Issues
Common IAM permission errors:

**"Access Denied" for Secrets Manager:**
- Verify the secret ARN in the policy
- Check that the secret name matches exactly
- Ensure the region is correct

**"Access Denied" for KMS:**
- Verify the KMS key ARN in the policy
- Check that the key alias is correct
- Ensure the key is in the same region

**"Invalid credentials":**
- Verify AWS credentials are correct
- Check that credentials are not expired
- Ensure the IAM user/role has the policy attached

## Google Cloud Console Setup

### 1. OAuth 2.0 Client Configuration
- **Application type**: Web application
- **Authorized JavaScript origins**: 
  - `https://your-domain.com`
  - `http://localhost:3000` (for development)
- **Authorized redirect URIs**:
  - `https://your-domain.com/auth/callback`
  - `http://localhost:3000/auth/callback`

### 2. Required Scopes
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/calendar.calendarlist`

## Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Google OAuth (stored in Secrets Manager)
GOOGLE_OAUTH_SECRET_NAME=action-it/google-oauth
KMS_KEY_ALIAS=alias/action-it-oauth

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

