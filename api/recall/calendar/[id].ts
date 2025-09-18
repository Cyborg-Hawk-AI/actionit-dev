import { NextRequest, NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const RECALL_BASE = "https://us-west-2.recall.ai";
const RECALL_GOOGLE_OAUTH_SECRET_NAME = "axnt-recall-google-oauth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Recall.ai API] ===== GET CALENDAR REQUEST =====');
    console.log('[Recall.ai API] Calendar ID:', params.id);

    // Get credentials from AWS Secrets Manager
    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });

    const command = new GetSecretValueCommand({
      SecretId: RECALL_GOOGLE_OAUTH_SECRET_NAME,
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error('No secret string found in AWS Secrets Manager');
    }

    const credentials = JSON.parse(response.SecretString);
    
    if (!credentials.recall_api_key) {
      throw new Error('Recall.ai API key not found in AWS Secrets Manager');
    }

    // Get calendar from Recall.ai
    const recallResponse = await fetch(`${RECALL_BASE}/api/v2/calendars/${params.id}`, {
      headers: {
        'Authorization': `Token ${credentials.recall_api_key}`,
      },
    });

    if (!recallResponse.ok) {
      const errorData = await recallResponse.json();
      return NextResponse.json(
        { error: `Failed to get calendar: ${errorData.detail || errorData.error || recallResponse.statusText}` },
        { status: recallResponse.status }
      );
    }

    const calendar = await recallResponse.json();
    console.log('[Recall.ai API] Calendar retrieved successfully:', calendar.id);
    
    return NextResponse.json(calendar);

  } catch (error) {
    console.error('[Recall.ai API] Failed to get calendar:', error);
    return NextResponse.json(
      { error: 'Failed to get calendar', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
