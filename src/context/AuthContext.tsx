import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    console.log('[Auth DEBUG] Setting up auth state listener');
    console.log('[Auth DEBUG] Window location:', window.location.toString());
    console.log('[Auth DEBUG] Protocol:', window.location.protocol);
    console.log('[Auth DEBUG] Host:', window.location.host);
    console.log('[Auth DEBUG] Hostname:', window.location.hostname);
    console.log('[Auth DEBUG] Origin:', window.location.origin);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Auth DEBUG] Auth state changed:', event);
        console.log('[Auth DEBUG] Current session:', currentSession ? `Present - User: ${currentSession.user.email}` : 'None');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('[Auth DEBUG] User signed in:', currentSession?.user?.email);
          toast.success("Successfully signed in!");
        }
        if (event === 'SIGNED_OUT') {
          console.log('[Auth DEBUG] User signed out');
          toast.info("You have been signed out.");
        }
      }
    );

    // THEN check for existing session
    console.log('[Auth DEBUG] Checking for existing session');
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[Auth DEBUG] Existing session:', currentSession ? `User: ${currentSession.user.email}` : 'None');
      if (currentSession) {
        console.log('[Auth DEBUG] Session expires at:', new Date(currentSession.expires_at! * 1000).toISOString());
        console.log('[Auth DEBUG] Token type:', currentSession.token_type);
        const accessTokenPreview = currentSession.access_token.substring(0, 10) + '...' + 
                                 currentSession.access_token.substring(currentSession.access_token.length - 10);
        console.log('[Auth DEBUG] Access token preview:', accessTokenPreview);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('[Auth DEBUG] Error fetching session:', error);
      setLoading(false);
    });

    return () => {
      console.log('[Auth DEBUG] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[Auth DEBUG] Attempting login for:', email);
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth DEBUG] Login error:', error.message);
        console.error('[Auth DEBUG] Error details:', error);
        
        // Enhanced error handling with user-friendly messages
        let userMessage = "Failed to log in.";
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = "Please check your email and click the verification link before logging in.";
        } else if (error.message.includes('rate limit') || error.message.includes('28 seconds')) {
          userMessage = "Too many login attempts. Please wait a moment before trying again.";
        } else if (error.message.includes('User not found')) {
          userMessage = "No account found with this email. Please sign up first.";
        } else {
          userMessage = error.message;
        }
        
        toast.error(userMessage);
        throw error;
      }
      
      console.log('[Auth DEBUG] Login successful');
      console.log('[Auth DEBUG] Auth response data:', data.session ? 'Session present' : 'No session');
      return Promise.resolve();
    } catch (error) {
      console.error('[Auth DEBUG] Login failed:', error);
      toast.error("Failed to log in.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string) => {
    console.log('[Auth DEBUG] Attempting signup for:', email);
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[Auth DEBUG] Signup error:', error.message);
        console.error('[Auth DEBUG] Error details:', error);
        
        // Enhanced error handling with user-friendly messages
        let userMessage = "Failed to sign up.";
        
        if (error.message.includes('rate limit') || error.message.includes('28 seconds')) {
          userMessage = "Too many signup attempts. Please wait a moment before trying again.";
        } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
          userMessage = "An account with this email already exists. Please try logging in instead.";
        } else if (error.message.includes('invalid email')) {
          userMessage = "Please enter a valid email address.";
        } else if (error.message.includes('password')) {
          userMessage = "Password must be at least 6 characters long.";
        } else {
          userMessage = error.message;
        }
        
        toast.error(userMessage);
        throw error;
      }
      
      console.log('[Auth DEBUG] Signup successful');
      console.log('[Auth DEBUG] Auth response data:', data);
      toast.success("Sign up successful! Please check your email for verification.");
      return Promise.resolve();
    } catch (error) {
      console.error('[Auth DEBUG] Signup failed:', error);
      toast.error("Failed to sign up.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    console.log('[Auth DEBUG] Initiating Google login');
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      console.log('[Auth DEBUG] Using redirect URL:', redirectTo);
      console.log('[Auth DEBUG] Current URL protocol:', window.location.protocol);
      
      // Add detailed logging for domain info
      console.log('[Auth DEBUG] Current hostname:', window.location.hostname);
      console.log('[Auth DEBUG] Full redirect URL:', redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.calendarlist',
            'https://www.googleapis.com/auth/calendar.settings.readonly',
            'https://www.googleapis.com/auth/calendar.acls',
            'https://www.googleapis.com/auth/calendar.freebusy',
            'https://www.googleapis.com/auth/calendar.app.created'
          ].join(' ')
        }
      });
      
      if (error) {
        console.error('[Auth DEBUG] Google login error:', error.message);
        console.error('[Auth DEBUG] Error details:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[Auth DEBUG] Google login flow initiated');
      console.log('[Auth DEBUG] Auth provider URL:', data?.url || 'No URL provided');
      
      if (data?.url) {
        // Log the URL we're about to redirect to
        console.log('[Auth DEBUG] Redirecting to OAuth URL:', data.url);
        
        // Parse and log the components of the URL
        try {
          const url = new URL(data.url);
          console.log('[Auth DEBUG] OAuth URL protocol:', url.protocol);
          console.log('[Auth DEBUG] OAuth URL hostname:', url.hostname);
          console.log('[Auth DEBUG] OAuth URL pathname:', url.pathname);
          console.log('[Auth DEBUG] OAuth URL search params:', url.search);
        } catch (e) {
          console.error('[Auth DEBUG] Failed to parse OAuth URL:', e);
        }
      }
    } catch (error) {
      console.error('[Auth DEBUG] Google login failed:', error);
      toast.error("Google login failed");
    }
  };
  
  const loginWithMicrosoft = async () => {
    console.log('[Auth DEBUG] Initiating Microsoft login');
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      console.log('[Auth DEBUG] Using redirect URL:', redirectTo);
      console.log('[Auth DEBUG] Current URL protocol:', window.location.protocol);
      
      // Add detailed logging for domain info
      console.log('[Auth DEBUG] Current hostname:', window.location.hostname);
      console.log('[Auth DEBUG] Full redirect URL:', redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo,
          scopes: 'offline_access User.Read Calendars.Read'
        }
      });
      
      if (error) {
        console.error('[Auth DEBUG] Microsoft login error:', error.message);
        console.error('[Auth DEBUG] Error details:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[Auth DEBUG] Microsoft login flow initiated');
      console.log('[Auth DEBUG] Auth provider URL:', data?.url || 'No URL provided');
      
      if (data?.url) {
        // Log the URL we're about to redirect to
        console.log('[Auth DEBUG] Redirecting to OAuth URL:', data.url);
        
        // Parse and log the components of the URL
        try {
          const url = new URL(data.url);
          console.log('[Auth DEBUG] OAuth URL protocol:', url.protocol);
          console.log('[Auth DEBUG] OAuth URL hostname:', url.hostname);
          console.log('[Auth DEBUG] OAuth URL pathname:', url.pathname);
          console.log('[Auth DEBUG] OAuth URL search params:', url.search);
        } catch (e) {
          console.error('[Auth DEBUG] Failed to parse OAuth URL:', e);
        }
      }
    } catch (error) {
      console.error('[Auth DEBUG] Microsoft login failed:', error);
      toast.error("Microsoft login failed");
    }
  };

  const logout = async () => {
    console.log('[Auth DEBUG] Logging out');
    try {
      await supabase.auth.signOut();
      console.log('[Auth DEBUG] Logout successful');
    } catch (error) {
      console.error('[Auth DEBUG] Logout error:', error);
      toast.error("Logout failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        signUp,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
