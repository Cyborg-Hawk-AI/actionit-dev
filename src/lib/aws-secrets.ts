import { GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { secretsManagerClient, CONFIG, type GoogleOAuthConfig } from './aws-config';

/**
 * Retrieves Google OAuth configuration from AWS Secrets Manager
 */
export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  try {
    console.log('[AWS Secrets] Attempting to retrieve OAuth config...');
    console.log('[AWS Secrets] Secret name:', CONFIG.GOOGLE_OAUTH_SECRET_NAME);
    console.log('[AWS Secrets] AWS region:', process.env.AWS_REGION);
    
    const command = new GetSecretValueCommand({
      SecretId: CONFIG.GOOGLE_OAUTH_SECRET_NAME,
    });

    console.log('[AWS Secrets] Sending command to AWS Secrets Manager...');
    const response = await secretsManagerClient.send(command);
    console.log('[AWS Secrets] Response received:', {
      hasSecretString: !!response.SecretString,
      hasSecretBinary: !!response.SecretBinary,
      versionId: response.VersionId,
    });
    
    if (!response.SecretString) {
      throw new Error('No secret string found in AWS Secrets Manager');
    }

    const config = JSON.parse(response.SecretString) as GoogleOAuthConfig;
    console.log('[AWS Secrets] Parsed config:', {
      hasClientId: !!config.client_id,
      hasClientSecret: !!config.client_secret,
      hasRedirectUri: !!config.redirect_uri,
      redirectUri: config.redirect_uri,
    });
    
    // Validate required fields
    if (!config.client_id || !config.client_secret || !config.redirect_uri) {
      throw new Error('Invalid OAuth configuration: missing required fields');
    }

    console.log('[AWS Secrets] OAuth config retrieved successfully');
    return config;
  } catch (error) {
    console.error('[AWS Secrets] Failed to retrieve Google OAuth config:', error);
    console.error('[AWS Secrets] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      name: (error as any)?.name,
      stack: error instanceof Error ? error.stack : undefined,
    });
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

