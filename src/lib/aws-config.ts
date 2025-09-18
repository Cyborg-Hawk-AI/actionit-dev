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

// Initialize AWS clients
export const secretsManagerClient = new SecretsManagerClient(awsConfig);
export const kmsClient = new KMSClient(awsConfig);

// Configuration constants
export const CONFIG = {
  GOOGLE_OAUTH_SECRET_NAME: process.env.GOOGLE_OAUTH_SECRET_NAME || 'axnt/google-oauth',
  KMS_KEY_ALIAS: process.env.KMS_KEY_ALIAS || 'alias/axnt-oauth',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Types for OAuth configuration
export interface GoogleOAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface EncryptedToken {
  encryptedData: string;
  keyId: string;
}
