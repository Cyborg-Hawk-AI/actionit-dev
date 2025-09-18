# Google OAuth Setup Instructions

## 1. Google Cloud Console Configuration

### Step 1: Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your **Project ID** for later use

### Step 2: Enable Required APIs
1. Navigate to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Google Calendar API**
   - **Google+ API** (for user profile information)

### Step 3: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (unless you have Google Workspace)
3. Fill out required fields:
   - **App name**: `Action.IT`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `../auth/calendar`
   - `../auth/calendar.events`
   - `../auth/calendar.calendarlist`
5. Add test users (for development):
   - Add your email and any test user emails

### Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: `Action.IT Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-vercel-domain.vercel.app
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/auth/callback
     https://your-vercel-domain.vercel.app/auth/callback
     ```
5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for AWS Secrets Manager

## 2. AWS Secrets Manager Configuration

### Step 1: Create Secret
1. Go to [AWS Secrets Manager Console](https://console.aws.amazon.com/secretsmanager/)
2. Click **Store a new secret**
3. Choose **Other type of secret**
4. Add these key-value pairs:
   ```json
   {
     "client_id": "your-google-client-id-from-step-4",
     "client_secret": "your-google-client-secret-from-step-4",
     "redirect_uri": "https://your-vercel-domain.vercel.app/auth/callback"
   }
   ```
5. **Secret name**: `action-it/google-oauth`
6. **Description**: `Google OAuth Client Credentials for Action.IT`
7. Click **Store**

### Step 2: Create KMS Key
1. Go to [AWS KMS Console](https://console.aws.amazon.com/kms/)
2. Click **Create key**
3. Configure:
   - **Key type**: Symmetric
   - **Key usage**: Encrypt and decrypt
   - **Key material origin**: KMS
4. **Alias**: `action-it-oauth`
5. **Description**: `Action.IT OAuth Token Encryption`
6. Click **Create key**

### Step 3: IAM Policy Setup
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create new policy with this JSON:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue"
         ],
         "Resource": "arn:aws:secretsmanager:YOUR_REGION:YOUR_ACCOUNT:secret:action-it/google-oauth*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "kms:Decrypt",
           "kms:Encrypt",
           "kms:GenerateDataKey"
         ],
         "Resource": "arn:aws:kms:YOUR_REGION:YOUR_ACCOUNT:key/YOUR_KEY_ID"
       }
     ]
   }
   ```
3. Attach policy to your IAM user/role

## 3. Vercel Configuration

### Step 1: Environment Variables
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:

   **Production Environment:**
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   GOOGLE_OAUTH_SECRET_NAME=action-it/google-oauth
   KMS_KEY_ALIAS=alias/action-it-oauth
   NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

   **Development Environment:**
   ```
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   GOOGLE_OAUTH_SECRET_NAME=action-it/google-oauth
   KMS_KEY_ALIAS=alias/action-it-oauth
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

### Step 2: Domain Configuration
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain if needed
3. Update Google OAuth redirect URIs with your actual Vercel domain

## 4. Local Development Setup

### Step 1: Environment File
1. Copy `env.example` to `.env.local`
2. Update with your values:
   ```bash
   # AWS Configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key

   # Google OAuth Configuration
   GOOGLE_OAUTH_SECRET_NAME=action-it/google-oauth
   KMS_KEY_ALIAS=alias/action-it-oauth

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   ```

### Step 2: Test OAuth Flow
1. Run `npm run dev`
2. Navigate to `http://localhost:3000`
3. Click "Connect Google Calendar"
4. Complete OAuth flow
5. Verify calendar connection in settings

## 5. Production Deployment Checklist

### Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] Production redirect URIs added
- [ ] APIs enabled (Calendar, Google+)
- [ ] Client ID and secret copied

### AWS Configuration
- [ ] Secrets Manager secret created with Google credentials
- [ ] KMS key created with alias `action-it-oauth`
- [ ] IAM policy attached with proper permissions
- [ ] AWS credentials configured in Vercel

### Vercel Configuration
- [ ] Environment variables set for production
- [ ] Custom domain configured (if applicable)
- [ ] Deployment successful

### Testing
- [ ] OAuth flow works in production
- [ ] Calendar connection successful
- [ ] Token encryption/decryption working
- [ ] Error handling functional

## 6. Troubleshooting

### Common Issues

**"Invalid redirect URI"**
- Verify redirect URI in Google Console matches your Vercel domain
- Check that callback URL is exactly: `https://your-domain.vercel.app/auth/callback`

**"Access denied"**
- Ensure OAuth consent screen is configured
- Check that required APIs are enabled
- Verify test users are added (for development)

**"AWS credentials not found"**
- Verify AWS credentials in Vercel environment variables
- Check IAM permissions for Secrets Manager and KMS
- Ensure secret name matches exactly: `action-it/google-oauth`

**"Token encryption failed"**
- Verify KMS key alias: `alias/action-it-oauth`
- Check KMS permissions in IAM policy
- Ensure KMS key is in the same region as your app

### Debug Steps
1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test AWS credentials with AWS CLI
4. Check Google OAuth consent screen status
5. Verify redirect URIs match exactly

## 7. Security Notes

- Never commit AWS credentials to version control
- Use environment variables for all sensitive data
- Regularly rotate AWS access keys
- Monitor AWS CloudTrail for security events
- Keep Google OAuth client secret secure
- Use HTTPS in production (Vercel provides this automatically)
