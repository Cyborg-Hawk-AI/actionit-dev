import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserExistsModal, setShowUserExistsModal] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState('');
  const navigate = useNavigate();
  const { login, signUp, loginWithGoogle, loginWithMicrosoft, isAuthenticated } = useAuth();
  useGoogleAnalytics();

  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      await login(email, password);
      navigate('/app');
    } catch (error: any) {
      // Handle specific error cases in the component
      if (error?.message?.includes('User not found') || error?.message?.includes('No account found')) {
        // Switch to signup tab if user doesn't exist
        const signupTab = document.querySelector('[data-value="signup"]') as HTMLElement;
        if (signupTab) {
          signupTab.click();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password);
      // Don't navigate automatically - user needs to verify email first
      // Clear the form after successful signup
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      // Handle specific error cases in the component
      if (error?.message?.includes('already exists') || error?.message?.includes('already registered')) {
        // Show popup modal for existing user
        setExistingUserEmail(email);
        setShowUserExistsModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('[Login] Google login error:', error);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await loginWithMicrosoft();
    } catch (error) {
      console.error('[Login] Microsoft login error:', error);
    }
  };

  const handleSwitchToLogin = () => {
    setShowUserExistsModal(false);
    
    // Switch to login tab
    const loginTab = document.querySelector('[data-value="login"]') as HTMLElement;
    if (loginTab) {
      loginTab.click();
    }
    
    // Pre-fill the email field
    setEmail(existingUserEmail);
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    try {
      // Use a test account for development
      await login('test@action.it', 'testpassword123');
      navigate('/app');
    } catch (error) {
      console.error('[Login] Test login failed:', error);
      toast.error("Test login failed. Please try the regular login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory dark:bg-charcoal p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-teal text-forest p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm0 5v5l3 3"></path>
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-charcoal dark:text-ivory">Action.IT</CardTitle>
          <CardDescription className="text-medium-gray dark:text-sand">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.0003 4.67676C13.3274 4.67676 14.5252 5.15466 15.4762 6.01126L18.9181 2.57092C17.0273 0.924957 14.6364 0 12.0003 0C7.5999 0 3.74903 2.55366 1.88989 6.34417L5.81333 9.42717C6.76946 6.66275 9.17332 4.67676 12.0003 4.67676Z" fill="#EA4335" />
                <path d="M23.49 12.2744C23.49 11.4607 23.4177 10.6402 23.2654 9.83606H12V14.4673H18.4547C18.1354 16.0128 17.26 17.2545 15.9795 18.1051L19.8943 21.1938C22.1393 19.1274 23.49 16.0128 23.49 12.2744Z" fill="#4285F4" />
                <path d="M5.81331 14.573C5.55167 13.8562 5.40747 13.0898 5.40747 12.3001C5.40747 11.5103 5.55167 10.7439 5.81331 10.0271L1.88987 6.94409C0.985309 8.5338 0.5 10.3544 0.5 12.3001C0.5 14.2457 0.985309 16.0663 1.88987 17.656L5.81331 14.573Z" fill="#FBBC05" />
                <path d="M12.0004 24C14.7029 24 16.975 23.1052 18.6837 21.5132L14.769 18.4243C13.9143 19.0392 12.8614 19.3233 12.0004 19.3233C9.17345 19.3233 6.76957 17.3373 5.81345 14.573L1.89001 17.656C3.75001 21.4465 7.60088 24 12.0004 24Z" fill="#34A853" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full" type="button" onClick={handleMicrosoftLogin}>
              <svg viewBox="0 0 23 23" className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"></path>
                <path fill="#f35325" d="M1 1h10v10H1z"></path>
                <path fill="#81bc06" d="M12 1h10v10H12z"></path>
                <path fill="#05a6f0" d="M1 12h10v10H1z"></path>
                <path fill="#ffba08" d="M12 12h10v10H12z"></path>
              </svg>
              Microsoft
            </Button>
          </div>
          
          {/* Test Login Button for Development */}
          <div className="mt-4">
            <Button 
              variant="secondary" 
              className="w-full" 
              type="button" 
              onClick={handleTestLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Test Login (Development)'}
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-medium-gray/20 dark:border-taupe/20"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-medium-gray dark:text-sand">
                Or continue with
              </span>
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-value="login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-teal text-forest hover:bg-aqua" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                    }}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-teal text-forest hover:bg-aqua" disabled={isLoading}>
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </Button>
                <p className="text-xs text-medium-gray dark:text-sand text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center">
          <Button variant="link" onClick={() => {
            navigate('/');
          }}>
            Return to home
          </Button>
        </CardFooter>
      </Card>
      
      {/* User Already Exists Modal */}
      <Dialog open={showUserExistsModal} onOpenChange={setShowUserExistsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Account Already Exists
            </DialogTitle>
            <DialogDescription>
              We found an account with the email address <strong>{existingUserEmail}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800/50">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-medium mb-1">Account Found</p>
                <p>An account with this email address already exists in our system. Would you like to sign in instead?</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUserExistsModal(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSwitchToLogin}
              className="w-full sm:w-auto bg-teal text-forest hover:bg-aqua"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Sign In Instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
