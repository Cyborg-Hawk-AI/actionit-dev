import { NextRequest, NextResponse } from 'next/server';

const RECALL_BASE = "https://us-west-2.recall.ai";

interface CreateCalendarRequest {
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Recall.ai API] ===== CREATE CALENDAR REQUEST (SIMPLE) =====');
    console.log('[Recall.ai API] Environment check:', {
      hasAwsRegion: !!process.env.AWS_REGION,
      hasAwsAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRecallApiKey: !!process.env.RECALL_API_KEY,
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    });
    
    const body: CreateCalendarRequest = await request.json();
    console.log('[Recall.ai API] Request body received:', {
      hasAccessToken: !!body.googleTokens?.access_token,
      hasRefreshToken: !!body.googleTokens?.refresh_token,
      expiresAt: body.googleTokens?.expires_at,
      accessTokenPrefix: body.googleTokens?.access_token?.substring(0, 10) + '...',
      refreshTokenPrefix: body.googleTokens?.refresh_token?.substring(0, 10) + '...'
    });

    if (!body.googleTokens?.refresh_token) {
      return NextResponse.json(
        { error: 'Google refresh token is required' },
        { status: 400 }
      );
    }

    // Get credentials from environment variables
    const recallApiKey = process.env.RECALL_API_KEY;
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!recallApiKey || !googleClientId || !googleClientSecret) {
      console.error('[Recall.ai API] Missing required environment variables:', {
        hasRecallApiKey: !!recallApiKey,
        hasGoogleClientId: !!googleClientId,
        hasGoogleClientSecret: !!googleClientSecret
      });
      return NextResponse.json(
        { error: 'Missing required environment variables for Recall.ai integration' },
        { status: 500 }
      );
    }

    console.log('[Recall.ai API] Using environment variables:', {
      hasRecallApiKey: !!recallApiKey,
      hasGoogleClientId: !!googleClientId,
      hasGoogleClientSecret: !!googleClientSecret,
      recallApiKeyPrefix: recallApiKey.substring(0, 10) + '...',
      googleClientIdPrefix: googleClientId.substring(0, 10) + '...',
      googleClientSecretPrefix: googleClientSecret.substring(0, 10) + '...'
    });

    // Create Recall.ai calendar
    console.log('[Recall.ai API] Creating Recall.ai calendar...');
    const requestBody = {
      oauth_client_id: googleClientId,
      oauth_client_secret: googleClientSecret,
      oauth_refresh_token: body.googleTokens.refresh_token,
      platform: 'google_calendar',
    };

    console.log('[Recall.ai API] Request body (sensitive data masked):', {
      oauth_client_id: googleClientId.substring(0, 10) + '...',
      oauth_client_secret: googleClientSecret.substring(0, 10) + '...',
      oauth_refresh_token: body.googleTokens.refresh_token.substring(0, 10) + '...',
      platform: 'google_calendar'
    });

    console.log('[Recall.ai API] Making request to Recall.ai API...');
    console.log('[Recall.ai API] Full URL:', `${RECALL_BASE}/api/v2/calendars/`);

    let recallResponse;
    try {
      recallResponse = await fetch(`${RECALL_BASE}/api/v2/calendars/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${recallApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (fetchError) {
      console.error('[Recall.ai API] Failed to make request to Recall.ai:', fetchError);
      throw new Error(`Failed to make request to Recall.ai: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }

    console.log('[Recall.ai API] Response received:', {
      status: recallResponse.status,
      statusText: recallResponse.statusText,
      ok: recallResponse.ok,
      headers: Object.fromEntries(recallResponse.headers.entries())
    });

    if (!recallResponse.ok) {
      console.error('[Recall.ai API] Request failed, attempting to parse error response...');
      let errorData;
      try {
        const responseText = await recallResponse.text();
        console.error('[Recall.ai API] Raw error response:', responseText);
        errorData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[Recall.ai API] Failed to parse error response:', parseError);
        return NextResponse.json(
          { error: `Recall.ai calendar creation failed: ${recallResponse.status} - ${recallResponse.statusText} - Unable to parse error response` },
          { status: 500 }
        );
      }
      
      console.error('[Recall.ai API] Parsed error data:', errorData);
      return NextResponse.json(
        { error: `Recall.ai calendar creation failed: ${errorData.detail || errorData.error || recallResponse.statusText}` },
        { status: 500 }
      );
    }

    console.log('[Recall.ai API] Request successful, parsing response...');
    const calendar = await recallResponse.json();
    console.log('[Recall.ai API] Calendar created successfully:', {
      id: calendar.id,
      status: calendar.status,
      platform: calendar.platform,
      platform_email: calendar.platform_email,
      created_at: calendar.created_at,
      updated_at: calendar.updated_at
    });

    console.log('[Recall.ai API] ===== CALENDAR CREATION COMPLETED =====');
    return NextResponse.json(calendar);

  } catch (error) {
    console.error('[Recall.ai API] ===== CALENDAR CREATION FAILED =====');
    console.error('[Recall.ai API] Error type:', typeof error);
    console.error('[Recall.ai API] Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('[Recall.ai API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Recall.ai API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Recall.ai API] Error cause:', error instanceof Error ? error.cause : undefined);

    return NextResponse.json(
      { error: 'Failed to create Recall.ai calendar', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
