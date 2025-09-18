import { VercelRequest, VercelResponse } from '@vercel/node';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Test config endpoint called');

    // Initialize AWS Secrets Manager client
    const secretsManagerClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY 
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });

    // Get OAuth config from AWS Secrets Manager
    const secretName = process.env.GOOGLE_OAUTH_SECRET_NAME || 'axnt-google-auth';
    console.log('[API] Retrieving secret:', secretName);

    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await secretsManagerClient.send(command);
    console.log('[API] Secret retrieved successfully');

    if (!response.SecretString) {
      throw new Error('No secret string found in AWS Secrets Manager');
    }

    const secretData = JSON.parse(response.SecretString);
    console.log('[API] Secret data parsed');

    // Convert to standard format
    const config = {
      client_id: secretData['axntt-client-id'],
      client_secret: secretData['axnt-secret'],
      redirect_uri: secretData['axnt-redirect-uri'],
    };

    // Return config for debugging (without sensitive data)
    return res.json({
      hasClientId: !!config.client_id,
      hasClientSecret: !!config.client_secret,
      redirectUri: config.redirect_uri,
      expectedRedirectUri: 'https://actionit-dev.vercel.app/auth/callback',
      redirectUriMatch: config.redirect_uri === 'https://actionit-dev.vercel.app/auth/callback',
      clientIdPrefix: config.client_id ? config.client_id.substring(0, 10) + '...' : 'missing',
    });
  } catch (error) {
    console.error('[API] Test config error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve config',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
