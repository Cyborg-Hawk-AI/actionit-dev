import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  generateGoogleAuthUrl, 
  exchangeCodeForTokens, 
  getGoogleUserInfo,
  getUserSession,
  clearUserSession,
  revokeToken,
  storeUserSession,
  type GoogleUserInfo,
  type OAuthTokens
} from "@/lib/google-oauth";

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
  recallCalendarId?: string;
  recallCalendarStatus?: string;
}

interface Session {
  user: User;
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  handleOAuthCallback: (code: string, state?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing Google OAuth session
    const initializeAuth = async () => {
      try {
        const googleSession = await getUserSession();
        if (googleSession) {
          setUser(googleSession.user);
          setSession({
            user: googleSession.user,
            access_token: googleSession.tokens.access_token,
            refresh_token: googleSession.tokens.refresh_token,
            expires_at: googleSession.expiresAt,
          });
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        clearUserSession();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Replace with AWS API Gateway call
      // For now, simulate login for test account
      if (email === 'test@action.it' && password === 'testpassword123') {
        const mockUser: User = {
          id: 'test-user-id',
          email: email,
          name: 'Test User'
        };
        const mockSession: Session = {
          user: mockUser,
          access_token: 'mock-access-token'
        };
        
        setUser(mockUser);
        setSession(mockSession);
        localStorage.setItem('auth_session', JSON.stringify(mockSession));
        toast.success("Successfully signed in!");
        return Promise.resolve();
      } else {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to log in.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      // TODO: Replace with AWS API Gateway call
      // For now, simulate signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Sign up successful! Please check your email for verification.");
      return Promise.resolve();
    } catch (error: any) {
      toast.error("Failed to sign up.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Generate Google OAuth URL and redirect
      const authUrl = await generateGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('[AuthContext] Google login failed:', error);
      toast.error("Failed to initiate Google login");
      setLoading(false);
    }
  };
  
  const loginWithMicrosoft = async () => {
    try {
      // TODO: Replace with AWS API Gateway OAuth flow
      toast.info("Microsoft OAuth integration coming soon with AWS backend");
    } catch (error) {
      toast.error("Microsoft login failed");
    }
  };
  
  const handleOAuthCallback = useCallback(async (code: string, state?: string) => {
    try {
      setLoading(true);
      
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      
      // Get user info
      const userInfo = await getGoogleUserInfo(tokens.access_token);
      
      // Store session with encrypted tokens
      const storedSession = await storeUserSession(userInfo, tokens);
      
      // Update context state
      setUser(userInfo);
      setSession({
        user: userInfo,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: storedSession.expiresAt,
      });
      
      // Connect to Recall.ai calendar integration
      try {
        const recallCalendar = await connectToRecallCalendar(userInfo.id, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || '',
          expires_at: storedSession.expiresAt,
        });
        
        // Update user object with Recall.ai calendar information
        const updatedUser = {
          ...userInfo,
          recallCalendarId: recallCalendar.id,
          recallCalendarStatus: recallCalendar.status,
        };
        
        // Update context state with Recall.ai calendar info
        setUser(updatedUser);
        setSession({
          user: updatedUser,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: storedSession.expiresAt,
        });
        
        toast.success("Successfully connected to Recall.ai! Bots will automatically join your meetings.");
      } catch (recallError) {
        console.error('[AuthContext] Failed to connect to Recall.ai:', recallError);
        // Don't fail the OAuth flow if Recall.ai connection fails
        toast.warning("Google Calendar connected, but Recall.ai integration is not available. You can try connecting later in Settings.");
      }
      
      toast.success("Successfully signed in with Google!");
    } catch (error) {
      console.error('[AuthContext] OAuth callback failed:', error);
      toast.error("Failed to complete Google sign-in");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const connectToRecallCalendar = async (userId: string, googleTokens: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  }) => {
    try {
      console.log('[Recall.ai Debug] Starting Recall.ai calendar connection...');
      console.log('[Recall.ai Debug] User ID:', userId);
      console.log('[Recall.ai Debug] Google tokens received:', {
        hasAccessToken: !!googleTokens.access_token,
        hasRefreshToken: !!googleTokens.refresh_token,
        expiresAt: googleTokens.expires_at,
        accessTokenPrefix: googleTokens.access_token?.substring(0, 10) + '...',
        refreshTokenPrefix: googleTokens.refresh_token?.substring(0, 10) + '...'
      });
      
      // Import the Recall.ai calendar integration
      console.log('[Recall.ai Debug] Importing recall-calendar module...');
      const { createRecallCalendar } = await import('@/lib/recall-calendar');
      console.log('[Recall.ai Debug] Successfully imported createRecallCalendar function');
      
      // Get Google OAuth credentials from environment
      console.log('[Recall.ai Debug] Checking environment variables...');
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      console.log('[Recall.ai Debug] Environment variables:', {
        hasGoogleClientId: !!googleClientId,
        hasGoogleClientSecret: !!googleClientSecret,
        googleClientIdPrefix: googleClientId?.substring(0, 10) + '...',
        googleClientSecretPrefix: googleClientSecret?.substring(0, 10) + '...',
        allEnvVars: Object.keys(process.env).filter(key => key.includes('GOOGLE') || key.includes('RECALL'))
      });
      
      if (!googleClientId || !googleClientSecret) {
        console.error('[Recall.ai Debug] Missing Google OAuth credentials:', {
          missingClientId: !googleClientId,
          missingClientSecret: !googleClientSecret,
          availableEnvVars: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
        });
        throw new Error('Google OAuth credentials not configured');
      }
      
      console.log('[Recall.ai Debug] All credentials found, creating Recall.ai calendar...');
      
      // Create Recall.ai calendar
      const calendar = await createRecallCalendar(
        googleTokens,
        googleClientId,
        googleClientSecret
      );
      
      console.log('[Recall.ai Debug] Recall.ai calendar created successfully:', {
        calendarId: calendar.id,
        status: calendar.status,
        platform: calendar.platform,
        platformEmail: calendar.platform_email,
        createdAt: calendar.created_at
      });
      
      // Store the calendar ID in the user session for future reference
      console.log('[Recall.ai Debug] Storing calendar info in user session...');
      const currentSession = await getUserSession();
      if (currentSession) {
        currentSession.recallCalendarId = calendar.id;
        currentSession.recallCalendarStatus = calendar.status;
        // Update the stored session with Recall.ai calendar info
        localStorage.setItem('user_session', JSON.stringify(currentSession));
        console.log('[Recall.ai Debug] Session updated with Recall.ai calendar info');
      } else {
        console.warn('[Recall.ai Debug] No current session found to update');
      }
      
      return calendar;
    } catch (error) {
      console.error('[Recall.ai Debug] Failed to connect to Recall.ai calendar:', error);
      console.error('[Recall.ai Debug] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        cause: error instanceof Error ? error.cause : undefined
      });
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const googleSession = await getUserSession();
      if (googleSession) {
        setUser(googleSession.user);
        setSession({
          user: googleSession.user,
          access_token: googleSession.tokens.access_token,
          refresh_token: googleSession.tokens.refresh_token,
          expires_at: googleSession.expiresAt,
        });
      } else {
        // Session is invalid, clear state
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('[AuthContext] Session refresh failed:', error);
      setUser(null);
      setSession(null);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Revoke Google token if we have one
      if (session?.access_token) {
        try {
          await revokeToken(session.access_token);
        } catch (revokeError) {
          console.warn('[AuthContext] Failed to revoke token:', revokeError);
          // Continue with logout even if revoke fails
        }
      }
      
      // Clear local session
      clearUserSession();
      setUser(null);
      setSession(null);
      
      toast.info("You have been signed out.");
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      signUp,
      loginWithGoogle,
      loginWithMicrosoft,
      handleOAuthCallback,
      logout,
      isAuthenticated,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('[AuthContext] useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
