import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { KMSClient } from '@aws-sdk/client-kms';
import { fromEnv, fromInstanceMetadata } from '@aws-sdk/credential-providers';

// AWS Configuration - Use role-based authentication
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  // For role-based authentication, AWS SDK will automatically use:
  // 1. Environment variables (if available)
  // 2. Instance metadata (for EC2/Lambda)
  // 3. IAM roles (for Vercel/other services)
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY 
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Let AWS SDK auto-detect credentials
};

// Debug AWS configuration - Always log in production for debugging
console.log('[AWS Config] Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  AWS_REGION: process.env.AWS_REGION,
  HAS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY_ID,
  HAS_SECRET_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
  ACCESS_KEY_PREFIX: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
  SECRET_KEY_PREFIX: process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 8) + '...',
  USING_EXPLICIT_CREDENTIALS: !!awsConfig.credentials,
  REGION: awsConfig.region,
});

// Initialize AWS clients
export const secretsManagerClient = new SecretsManagerClient(awsConfig);
export const kmsClient = new KMSClient(awsConfig);

// Configuration constants
export const CONFIG = {
  GOOGLE_OAUTH_SECRET_NAME: process.env.GOOGLE_OAUTH_SECRET_NAME || 'axnt-google-auth',
  KMS_KEY_ALIAS: process.env.KMS_KEY_ALIAS || 'alias/axnt-secrets-decrypt',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Types for OAuth configuration
export interface GoogleOAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

// Types for the actual secret structure in AWS
export interface AxntGoogleAuthSecret {
  'axntt-client-id': string;
  'axnt-secret': string;
  'axnt-redirect-uri': string;
}

export interface EncryptedToken {
  encryptedData: string;
  keyId: string;
}
