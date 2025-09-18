import { getCachedGoogleOAuthConfig } from './aws-secrets';
import { encryptWithKMS, decryptWithKMS, type EncryptedToken } from './aws-kms';

// Google OAuth endpoints
const GOOGLE_OAUTH_ENDPOINTS = {
  authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revoke: 'https://oauth2.googleapis.com/revoke',
} as const;

// Required OAuth scopes
const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.calendarlist',
].join(' ');

// Types for OAuth flow
export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export interface StoredUserSession {
  user: GoogleUserInfo;
  tokens: OAuthTokens;
  encryptedTokens: EncryptedToken;
  expiresAt: number;
}

/**
 * Generates the Google OAuth authorization URL
 */
export async function generateGoogleAuthUrl(state?: string): Promise<string> {
  try {
    const config = await getCachedGoogleOAuthConfig();
    
    const params = new URLSearchParams({
      client_id: config.client_id,
      redirect_uri: config.redirect_uri,
      response_type: 'code',
      scope: OAUTH_SCOPES,
      access_type: 'offline', // Required to get refresh token
      prompt: 'consent', // Force consent screen to get refresh token
      ...(state && { state }),
    });

    return `${GOOGLE_OAUTH_ENDPOINTS.authorization}?${params.toString()}`;
  } catch (error) {
    console.error('Failed to generate Google auth URL:', error);
    throw new Error('Failed to generate Google OAuth URL');
  }
}

/**
 * Exchanges authorization code for access tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
  try {
    const config = await getCachedGoogleOAuthConfig();
    
    const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.token, {
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await response.json() as OAuthTokens;
    
    // Validate required fields
    if (!tokens.access_token || !tokens.expires_in) {
      throw new Error('Invalid token response: missing required fields');
    }

    return tokens;
  } catch (error) {
    console.error('Failed to exchange code for tokens:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Refreshes access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  try {
    const config = await getCachedGoogleOAuthConfig();
    
    const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await response.json() as OAuthTokens;
    
    if (!tokens.access_token) {
      throw new Error('Invalid refresh response: missing access token');
    }

    return tokens;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Gets user information from Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.userinfo, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`User info fetch failed: ${errorData.error_description || errorData.error}`);
    }

    const userInfo = await response.json() as GoogleUserInfo;
    
    // Validate required fields
    if (!userInfo.id || !userInfo.email) {
      throw new Error('Invalid user info response: missing required fields');
    }

    return userInfo;
  } catch (error) {
    console.error('Failed to get Google user info:', error);
    throw new Error('Failed to get user information from Google');
  }
}

/**
 * Revokes access token
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    const response = await fetch(GOOGLE_OAUTH_ENDPOINTS.revoke, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  } catch (error) {
    console.error('Failed to revoke token:', error);
    throw new Error('Failed to revoke access token');
  }
}

/**
 * Stores user session with encrypted tokens
 */
export async function storeUserSession(
  user: GoogleUserInfo, 
  tokens: OAuthTokens
): Promise<StoredUserSession> {
  try {
    // Encrypt tokens using KMS
    const tokensJson = JSON.stringify(tokens);
    const encryptedTokens = await encryptWithKMS(tokensJson);
    
    // Calculate expiration time
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    
    const session: StoredUserSession = {
      user,
      tokens,
      encryptedTokens,
      expiresAt,
    };
    
    // Store in localStorage (in production, consider more secure storage)
    localStorage.setItem('google_oauth_session', JSON.stringify(session));
    
    return session;
  } catch (error) {
    console.error('Failed to store user session:', error);
    throw new Error('Failed to store user session');
  }
}

/**
 * Retrieves and decrypts user session
 */
export async function getUserSession(): Promise<StoredUserSession | null> {
  try {
    const sessionData = localStorage.getItem('google_oauth_session');
    if (!sessionData) {
      return null;
    }
    
    const session = JSON.parse(sessionData) as StoredUserSession;
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      // Try to refresh token if we have a refresh token
      if (session.tokens.refresh_token) {
        try {
          const newTokens = await refreshAccessToken(session.tokens.refresh_token);
          const updatedSession = await storeUserSession(session.user, newTokens);
          return updatedSession;
        } catch (refreshError) {
          console.error('Failed to refresh expired session:', refreshError);
          // Clear invalid session
          localStorage.removeItem('google_oauth_session');
          return null;
        }
      } else {
        // No refresh token, clear session
        localStorage.removeItem('google_oauth_session');
        return null;
      }
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get user session:', error);
    localStorage.removeItem('google_oauth_session');
    return null;
  }
}

/**
 * Clears user session
 */
export function clearUserSession(): void {
  localStorage.removeItem('google_oauth_session');
}

