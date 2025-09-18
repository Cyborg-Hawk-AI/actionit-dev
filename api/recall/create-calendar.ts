import { NextRequest, NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const RECALL_BASE = "https://us-west-2.recall.ai";
const RECALL_GOOGLE_OAUTH_SECRET_NAME = "axnt-recall-google-oauth";

interface CreateCalendarRequest {
  googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Recall.ai API] ===== CREATE CALENDAR REQUEST =====');
    
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

    // Get Google OAuth credentials from AWS Secrets Manager
    console.log('[Recall.ai API] Getting Google OAuth credentials from AWS Secrets Manager...');
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new GetSecretValueCommand({
      SecretId: RECALL_GOOGLE_OAUTH_SECRET_NAME,
    });

    const response = await client.send(command);
    console.log('[Recall.ai API] Secret retrieved from AWS');

    if (!response.SecretString) {
      throw new Error('No secret string found in AWS Secrets Manager');
    }

    const credentials = JSON.parse(response.SecretString);
    console.log('[Recall.ai API] Credentials parsed:', {
      hasClientId: !!credentials.client_id,
      hasClientSecret: !!credentials.client_secret,
      hasRecallApiKey: !!credentials.recall_api_key,
      clientIdPrefix: credentials.client_id?.substring(0, 10) + '...',
      clientSecretPrefix: credentials.client_secret?.substring(0, 10) + '...',
      recallApiKeyPrefix: credentials.recall_api_key?.substring(0, 10) + '...'
    });

    if (!credentials.recall_api_key) {
      throw new Error('Recall.ai API key not found in AWS Secrets Manager');
    }

    // Create Recall.ai calendar
    console.log('[Recall.ai API] Creating Recall.ai calendar...');
    const requestBody = {
      oauth_client_id: credentials.client_id,
      oauth_client_secret: credentials.client_secret,
      oauth_refresh_token: body.googleTokens.refresh_token,
      platform: 'google_calendar',
    };

    console.log('[Recall.ai API] Request body (sensitive data masked):', {
      oauth_client_id: credentials.client_id.substring(0, 10) + '...',
      oauth_client_secret: credentials.client_secret.substring(0, 10) + '...',
      oauth_refresh_token: body.googleTokens.refresh_token.substring(0, 10) + '...',
      platform: 'google_calendar'
    });

    console.log('[Recall.ai API] Making request to Recall.ai API...');
    console.log('[Recall.ai API] Full URL:', `${RECALL_BASE}/api/v2/calendars/`);

    const recallResponse = await fetch(`${RECALL_BASE}/api/v2/calendars/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${credentials.recall_api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

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
