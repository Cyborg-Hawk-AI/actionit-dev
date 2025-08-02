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
  
  // Extensive debug logging
  console.log('[AuthContext] Component rendering');
  console.log('[AuthContext] Current user:', user?.email || 'null');
  console.log('[AuthContext] Session exists:', !!session);
  console.log('[AuthContext] Loading state:', loading);
  console.log('[AuthContext] Is authenticated:', !!user);
  console.log('[AuthContext] Current window location:', window.location.href);
  
  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    console.log('[AuthContext] Window location:', window.location.toString());
    console.log('[AuthContext] Protocol:', window.location.protocol);
    console.log('[AuthContext] Host:', window.location.host);
    console.log('[AuthContext] Hostname:', window.location.hostname);
    console.log('[AuthContext] Origin:', window.location.origin);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[AuthContext] Auth state changed:', event);
        console.log('[AuthContext] Current session:', currentSession ? `Present - User: ${currentSession.user.email}` : 'None');
        console.log('[AuthContext] Event type:', event);
        console.log('[AuthContext] Session user:', currentSession?.user?.email || 'null');
        console.log('[AuthContext] Session expires at:', currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : 'null');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('[AuthContext] User signed in:', currentSession?.user?.email);
          console.log('[AuthContext] Sign in timestamp:', new Date().toISOString());
          toast.success("Successfully signed in!");
        }
        if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] User signed out');
          console.log('[AuthContext] Sign out timestamp:', new Date().toISOString());
          toast.info("You have been signed out.");
        }
        if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] Token refreshed');
        }
        if (event === 'USER_UPDATED') {
          console.log('[AuthContext] User updated:', currentSession?.user?.email);
        }
      }
    );

    // THEN check for existing session
    console.log('[AuthContext] Checking for existing session');
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[AuthContext] Existing session:', currentSession ? `User: ${currentSession.user.email}` : 'None');
      if (currentSession) {
        console.log('[AuthContext] Session expires at:', new Date(currentSession.expires_at! * 1000).toISOString());
        console.log('[AuthContext] Token type:', currentSession.token_type);
        const accessTokenPreview = currentSession.access_token.substring(0, 10) + '...' + 
                                 currentSession.access_token.substring(currentSession.access_token.length - 10);
        console.log('[AuthContext] Access token preview:', accessTokenPreview);
      }
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
      console.log('[AuthContext] Initial session check complete');
    }).catch(error => {
      console.error('[AuthContext] Error fetching session:', error);
      setLoading(false);
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Attempting login for:', email);
    console.log('[AuthContext] Login timestamp:', new Date().toISOString());
    console.log('[AuthContext] Current window location:', window.location.href);
    console.log('[AuthContext] Current user before login:', user?.email || 'null');
    
    setLoading(true);
    try {
      console.log('[AuthContext] Calling Supabase signInWithPassword');
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Login error:', error.message);
        console.error('[AuthContext] Error details:', error);
        console.error('[AuthContext] Error code:', error.status);
        console.error('[AuthContext] Error name:', error.name);
        
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
        
        console.log('[AuthContext] User-friendly error message:', userMessage);
        toast.error(userMessage);
        throw error;
      }
      
      console.log('[AuthContext] Login successful');
      console.log('[AuthContext] Auth response data:', data.session ? 'Session present' : 'No session');
      console.log('[AuthContext] User after login:', data.user?.email || 'null');
      return Promise.resolve();
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      toast.error("Failed to log in.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Login process complete, loading set to false');
    }
  };
  
  const signUp = async (email: string, password: string) => {
    console.log('[AuthContext] Attempting signup for:', email);
    console.log('[AuthContext] Signup timestamp:', new Date().toISOString());
    console.log('[AuthContext] Current window location:', window.location.href);
    
    setLoading(true);
    try {
      console.log('[AuthContext] Calling Supabase signUp');
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[AuthContext] Signup error:', error.message);
        console.error('[AuthContext] Error details:', error);
        console.error('[AuthContext] Error code:', error.status);
        console.error('[AuthContext] Error name:', error.name);
        
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
        
        console.log('[AuthContext] User-friendly error message:', userMessage);
        toast.error(userMessage);
        throw error;
      }
      
      console.log('[AuthContext] Signup successful');
      console.log('[AuthContext] Auth response data:', data);
      console.log('[AuthContext] User after signup:', data.user?.email || 'null');
      toast.success("Sign up successful! Please check your email for verification.");
      return Promise.resolve();
    } catch (error) {
      console.error('[AuthContext] Signup failed:', error);
      toast.error("Failed to sign up.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Signup process complete, loading set to false');
    }
  };
  
  const loginWithGoogle = async () => {
    console.log('[AuthContext] Initiating Google login');
    console.log('[AuthContext] Google login timestamp:', new Date().toISOString());
    console.log('[AuthContext] Current window location:', window.location.href);
    
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      console.log('[AuthContext] Using redirect URL:', redirectTo);
      console.log('[AuthContext] Current URL protocol:', window.location.protocol);
      
      // Add detailed logging for domain info
      console.log('[AuthContext] Current hostname:', window.location.hostname);
      console.log('[AuthContext] Full redirect URL:', redirectTo);
      
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
        console.error('[AuthContext] Google login error:', error.message);
        console.error('[AuthContext] Error details:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[AuthContext] Google login flow initiated');
      console.log('[AuthContext] Auth provider URL:', data?.url || 'No URL provided');
      
      if (data?.url) {
        // Log the URL we're about to redirect to
        console.log('[AuthContext] Redirecting to OAuth URL:', data.url);
        
        // Parse and log the components of the URL
        try {
          const url = new URL(data.url);
          console.log('[AuthContext] OAuth URL protocol:', url.protocol);
          console.log('[AuthContext] OAuth URL hostname:', url.hostname);
          console.log('[AuthContext] OAuth URL pathname:', url.pathname);
          console.log('[AuthContext] OAuth URL search params:', url.search);
        } catch (e) {
          console.error('[AuthContext] Failed to parse OAuth URL:', e);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Google login failed:', error);
      toast.error("Google login failed");
    }
  };
  
  const loginWithMicrosoft = async () => {
    console.log('[AuthContext] Initiating Microsoft login');
    console.log('[AuthContext] Microsoft login timestamp:', new Date().toISOString());
    console.log('[AuthContext] Current window location:', window.location.href);
    
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      console.log('[AuthContext] Using redirect URL for Microsoft:', redirectTo);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo,
          scopes: 'openid profile email'
        }
      });
      
      if (error) {
        console.error('[AuthContext] Microsoft login error:', error.message);
        console.error('[AuthContext] Error details:', error);
        toast.error(error.message);
        throw error;
      }
      
      console.log('[AuthContext] Microsoft login flow initiated');
      console.log('[AuthContext] Auth provider URL:', data?.url || 'No URL provided');
      
      if (data?.url) {
        console.log('[AuthContext] Redirecting to Microsoft OAuth URL:', data.url);
      }
    } catch (error) {
      console.error('[AuthContext] Microsoft login failed:', error);
      toast.error("Microsoft login failed");
    }
  };
  
  const logout = async () => {
    console.log('[AuthContext] Logout initiated');
    console.log('[AuthContext] Logout timestamp:', new Date().toISOString());
    console.log('[AuthContext] Current user before logout:', user?.email || 'null');
    console.log('[AuthContext] Current window location:', window.location.href);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      } else {
        console.log('[AuthContext] Logout successful');
      }
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    }
  };

  const isAuthenticated = !!user;
  
  console.log('[AuthContext] Final state - User:', user?.email || 'null', 'Authenticated:', isAuthenticated);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      login,
      signUp,
      loginWithGoogle,
      loginWithMicrosoft,
      logout,
      isAuthenticated
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
