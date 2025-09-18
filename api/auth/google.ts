import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Google OAuth endpoint called');
    console.log('[API] Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      AWS_REGION: process.env.AWS_REGION,
      HAS_ACCESS_KEY: !!process.env.AWS_ACCESS_KEY_ID,
      HAS_SECRET_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Try to import AWS libraries
    let getCachedGoogleOAuthConfig;
    try {
      const awsSecrets = await import('../../src/lib/aws-secrets');
      getCachedGoogleOAuthConfig = awsSecrets.getCachedGoogleOAuthConfig;
      console.log('[API] Successfully imported AWS secrets module');
    } catch (importError) {
      console.error('[API] Failed to import AWS secrets module:', importError);
      return res.status(500).json({ 
        error: 'Failed to import AWS modules',
        details: importError instanceof Error ? importError.message : 'Unknown import error'
      });
    }

    const config = await getCachedGoogleOAuthConfig();
    console.log('[API] OAuth config retrieved:', {
      hasClientId: !!config.client_id,
      hasClientSecret: !!config.client_secret,
      redirectUri: config.redirect_uri,
    });

    // Generate OAuth URL
    const params = new URLSearchParams({
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.calendarlist',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log('[API] Generated auth URL:', authUrl);

    return res.json({ authUrl });
  } catch (error) {
    console.error('[API] Google OAuth error:', error);
    console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
