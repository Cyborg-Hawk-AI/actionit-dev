import { VercelRequest, VercelResponse } from '@vercel/node';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Token exchange endpoint called');
    
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    console.log('[API] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      HAS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY_ID,
      HAS_SECRET_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    });

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

    console.log('[API] AWS client initialized');

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
    console.log('[API] Secret data parsed:', {
      hasClientId: !!secretData['axntt-client-id'],
      hasClientSecret: !!secretData['axnt-secret'],
      hasRedirectUri: !!secretData['axnt-redirect-uri'],
    });

    // Convert to standard format
    const config = {
      client_id: secretData['axntt-client-id'],
      client_secret: secretData['axnt-secret'],
      redirect_uri: secretData['axnt-redirect-uri'],
    };

    // Validate required fields
    if (!config.client_id || !config.client_secret || !config.redirect_uri) {
      throw new Error('Invalid OAuth configuration: missing required fields');
    }

    console.log('[API] OAuth config validated, exchanging code for tokens');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirect_uri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('[API] Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await tokenResponse.json();
    console.log('[API] Tokens received successfully');

    // Validate required fields
    if (!tokens.access_token || !tokens.expires_in) {
      throw new Error('Invalid token response: missing required fields');
    }

    return res.json(tokens);
  } catch (error) {
    console.error('[API] Token exchange error:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      error: 'Failed to exchange code for tokens',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
