import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { secretsManagerClient, CONFIG, type GoogleOAuthConfig } from './aws-config';

/**
 * Retrieves Google OAuth configuration from AWS Secrets Manager
 */
export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: CONFIG.GOOGLE_OAUTH_SECRET_NAME,
    });

    const response = await secretsManagerClient.send(command);
    
    if (!response.SecretString) {
      throw new Error('No secret string found in AWS Secrets Manager');
    }

    const config = JSON.parse(response.SecretString) as GoogleOAuthConfig;
    
    // Validate required fields
    if (!config.client_id || !config.client_secret || !config.redirect_uri) {
      throw new Error('Invalid OAuth configuration: missing required fields');
    }

    return config;
  } catch (error) {
    console.error('Failed to retrieve Google OAuth config:', error);
    throw new Error('Failed to retrieve OAuth configuration from AWS Secrets Manager');
  }
}

/**
 * Cached OAuth config to avoid repeated AWS calls
 */
let cachedOAuthConfig: GoogleOAuthConfig | null = null;
let configCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getCachedGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  const now = Date.now();
  
  if (cachedOAuthConfig && (now - configCacheTime) < CACHE_DURATION) {
    return cachedOAuthConfig;
  }

  cachedOAuthConfig = await getGoogleOAuthConfig();
  configCacheTime = now;
  
  return cachedOAuthConfig;
}

