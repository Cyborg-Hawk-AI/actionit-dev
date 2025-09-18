import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { encryptWithKMS, decryptWithKMS, type EncryptedToken } from './aws-kms';

// DynamoDB Configuration
const dynamoClient = new DynamoDBClient({
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
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table configuration
const OAUTH_TOKENS_TABLE = process.env.DYNAMODB_OAUTH_TABLE || 'axnt-oauth-tokens';

// Types for OAuth token storage
export interface OAuthTokenRecord {
  userId: string;
  email: string;
  provider: 'google' | 'microsoft';
  encryptedTokens: EncryptedToken;
  userInfo: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
  isActive: boolean;
  lastUsed?: string;
}

export interface OAuthFlowLog {
  userId: string;
  flowId: string;
  step: 'initiated' | 'callback_received' | 'token_exchanged' | 'user_info_retrieved' | 'stored' | 'failed';
  timestamp: string;
  data?: any;
  error?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Stores OAuth tokens in DynamoDB with encryption
 */
export async function storeOAuthTokens(
  userId: string,
  email: string,
  provider: 'google' | 'microsoft',
  userInfo: any,
  tokens: any
): Promise<OAuthTokenRecord> {
  try {
    // Encrypt tokens using KMS
    const tokensJson = JSON.stringify(tokens);
    const encryptedTokens = await encryptWithKMS(tokensJson);
    
    const now = new Date().toISOString();
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    const record: OAuthTokenRecord = {
      userId,
      email,
      provider,
      encryptedTokens,
      userInfo: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      },
      createdAt: now,
      updatedAt: now,
      expiresAt,
      isActive: true,
      lastUsed: now,
    };
    
    await docClient.send(new PutCommand({
      TableName: OAUTH_TOKENS_TABLE,
      Item: record,
    }));
    
    console.log(`[DynamoDB] Stored OAuth tokens for user ${userId} (${email})`);
    return record;
  } catch (error) {
    console.error('[DynamoDB] Failed to store OAuth tokens:', error);
    throw new Error('Failed to store OAuth tokens');
  }
}

/**
 * Retrieves OAuth tokens from DynamoDB and decrypts them
 */
export async function getOAuthTokens(userId: string, provider: 'google' | 'microsoft'): Promise<any | null> {
  try {
    const result = await docClient.send(new GetCommand({
      TableName: OAUTH_TOKENS_TABLE,
      Key: {
        userId,
        provider,
      },
    }));
    
    if (!result.Item) {
      return null;
    }
    
    const record = result.Item as OAuthTokenRecord;
    
    // Check if token is expired
    if (Date.now() > record.expiresAt) {
      console.log(`[DynamoDB] Token expired for user ${userId}`);
      return null;
    }
    
    // Decrypt tokens
    const decryptedTokens = await decryptWithKMS(record.encryptedTokens);
    const tokens = JSON.parse(decryptedTokens);
    
    // Update last used timestamp
    await updateLastUsed(userId, provider);
    
    return tokens;
  } catch (error) {
    console.error('[DynamoDB] Failed to retrieve OAuth tokens:', error);
    return null;
  }
}

/**
 * Updates the last used timestamp
 */
export async function updateLastUsed(userId: string, provider: 'google' | 'microsoft'): Promise<void> {
  try {
    await docClient.send(new UpdateCommand({
      TableName: OAUTH_TOKENS_TABLE,
      Key: {
        userId,
        provider,
      },
      UpdateExpression: 'SET lastUsed = :timestamp, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error('[DynamoDB] Failed to update last used timestamp:', error);
  }
}

/**
 * Deactivates OAuth tokens
 */
export async function deactivateOAuthTokens(userId: string, provider: 'google' | 'microsoft'): Promise<void> {
  try {
    await docClient.send(new UpdateCommand({
      TableName: OAUTH_TOKENS_TABLE,
      Key: {
        userId,
        provider,
      },
      UpdateExpression: 'SET isActive = :active, updatedAt = :timestamp',
      ExpressionAttributeValues: {
        ':active': false,
        ':timestamp': new Date().toISOString(),
      },
    }));
    
    console.log(`[DynamoDB] Deactivated OAuth tokens for user ${userId}`);
  } catch (error) {
    console.error('[DynamoDB] Failed to deactivate OAuth tokens:', error);
  }
}

/**
 * Gets all OAuth tokens for a user
 */
export async function getUserOAuthTokens(userId: string): Promise<OAuthTokenRecord[]> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: OAUTH_TOKENS_TABLE,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    }));
    
    return result.Items as OAuthTokenRecord[] || [];
  } catch (error) {
    console.error('[DynamoDB] Failed to get user OAuth tokens:', error);
    return [];
  }
}

/**
 * Logs OAuth flow steps for debugging
 */
export async function logOAuthFlow(
  userId: string,
  flowId: string,
  step: OAuthFlowLog['step'],
  data?: any,
  error?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const log: OAuthFlowLog = {
      userId,
      flowId,
      step,
      timestamp: new Date().toISOString(),
      data,
      error,
      ipAddress,
      userAgent,
    };
    
    // Store in a separate logs table or append to existing record
    await docClient.send(new PutCommand({
      TableName: `${OAUTH_TOKENS_TABLE}-logs`,
      Item: log,
    }));
    
    console.log(`[OAuth Flow] ${step} for user ${userId} (${flowId})`);
  } catch (error) {
    console.error('[DynamoDB] Failed to log OAuth flow:', error);
  }
}

/**
 * Gets OAuth flow logs for debugging
 */
export async function getOAuthFlowLogs(userId: string, flowId?: string): Promise<OAuthFlowLog[]> {
  try {
    const params: any = {
      TableName: `${OAUTH_TOKENS_TABLE}-logs`,
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    };
    
    if (flowId) {
      params.FilterExpression += ' AND flowId = :flowId';
      params.ExpressionAttributeValues[':flowId'] = flowId;
    }
    
    const result = await docClient.send(new ScanCommand(params));
    return result.Items as OAuthFlowLog[] || [];
  } catch (error) {
    console.error('[DynamoDB] Failed to get OAuth flow logs:', error);
    return [];
  }
}

/**
 * Cleans up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: OAUTH_TOKENS_TABLE,
      FilterExpression: 'expiresAt < :now',
      ExpressionAttributeValues: {
        ':now': Date.now(),
      },
    }));
    
    let cleanedCount = 0;
    for (const item of result.Items || []) {
      await docClient.send(new DeleteCommand({
        TableName: OAUTH_TOKENS_TABLE,
        Key: {
          userId: item.userId,
          provider: item.provider,
        },
      }));
      cleanedCount++;
    }
    
    console.log(`[DynamoDB] Cleaned up ${cleanedCount} expired tokens`);
    return cleanedCount;
  } catch (error) {
    console.error('[DynamoDB] Failed to cleanup expired tokens:', error);
    return 0;
  }
}
