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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          toast.success("Successfully signed in!");
        }
        if (event === 'SIGNED_OUT') {
          toast.info("You have been signed out.");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('[AuthContext] Error fetching session:', error);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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
      
      return Promise.resolve();
    } catch (error) {
      toast.error("Failed to log in.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
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
      
      toast.success("Sign up successful! Please check your email for verification.");
      return Promise.resolve();
    } catch (error) {
      toast.error("Failed to sign up.");
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithGoogle = async () => {
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      
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
        toast.error(error.message);
        throw error;
      }
      
      if (data?.url) {
        // Parse and log the components of the URL
        try {
          const url = new URL(data.url);
        } catch (e) {
          console.error('[AuthContext] Failed to parse OAuth URL:', e);
        }
      }
    } catch (error) {
      toast.error("Google login failed");
    }
  };
  
  const loginWithMicrosoft = async () => {
    try {
      // Important: Use the raw origin without any modification for redirectTo
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback`;
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo,
          scopes: 'openid profile email'
        }
      });
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      if (data?.url) {
        console.log('[AuthContext] Redirecting to Microsoft OAuth URL:', data.url);
      }
    } catch (error) {
      toast.error("Microsoft login failed");
    }
  };
  
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[AuthContext] Logout error:', error);
      }
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
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
