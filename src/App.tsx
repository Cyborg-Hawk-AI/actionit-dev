
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import Index from '@/pages/Index';
import ComingSoon from '@/pages/ComingSoon';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CalendarPage from '@/pages/Calendar';
import MeetingDetail from '@/pages/MeetingDetail';
import Settings from '@/pages/Settings';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
  },
});

function App() {
  console.log('[App] Component rendering - App.tsx');
  console.log('[App] Current window location:', window.location.href);
  console.log('[App] Current pathname:', window.location.pathname);
  console.log('[App] Current search:', window.location.search);
  console.log('[App] Current hash:', window.location.hash);

  // Debug function to log route changes
  const logRouteChange = (path: string, component: string) => {
    console.log(`[App] Route accessed: ${path} -> Component: ${component}`);
    console.log(`[App] Full URL: ${window.location.href}`);
    console.log(`[App] User Agent: ${navigator.userAgent}`);
    console.log(`[App] Timestamp: ${new Date().toISOString()}`);
    return null; // Return null for React compatibility
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                {/* Default route now points to home page */}
                <Route path="/" element={
                  <React.Fragment>
                    {logRouteChange('/', 'Index')}
                    <Index />
                  </React.Fragment>
                } />
                
                {/* Coming soon page preserved at /coming-soon */}
                <Route path="/coming-soon" element={
                  <React.Fragment>
                    {logRouteChange('/coming-soon', 'ComingSoon')}
                    <ComingSoon />
                  </React.Fragment>
                } />
                
                {/* Auth routes */}
                <Route path="/login" element={
                  <React.Fragment>
                    {logRouteChange('/login', 'Login')}
                    <Login />
                  </React.Fragment>
                } />
                <Route path="/auth/callback" element={
                  <React.Fragment>
                    {logRouteChange('/auth/callback', 'AuthCallback')}
                    <AuthCallback />
                  </React.Fragment>
                } />
                
                {/* Legal pages */}
                <Route path="/TOS" element={
                  <React.Fragment>
                    {logRouteChange('/TOS', 'TermsOfService')}
                    <TermsOfService />
                  </React.Fragment>
                } />
                <Route path="/privacy-policy" element={
                  <React.Fragment>
                    {logRouteChange('/privacy-policy', 'PrivacyPolicy')}
                    <PrivacyPolicy />
                  </React.Fragment>
                } />
                
                {/* App routes */}
                <Route path="/app" element={
                  <React.Fragment>
                    {logRouteChange('/app', 'Layout')}
                    <Layout />
                  </React.Fragment>
                }>
                  <Route index element={
                    <React.Fragment>
                      {logRouteChange('/app', 'Dashboard')}
                      <Dashboard />
                    </React.Fragment>
                  } />
                  <Route path="calendar" element={
                    <React.Fragment>
                      {logRouteChange('/app/calendar', 'CalendarPage')}
                      <CalendarPage />
                    </React.Fragment>
                  } />
                  <Route path="meetings/:meetingId" element={
                    <React.Fragment>
                      {logRouteChange('/app/meetings/:meetingId', 'MeetingDetail')}
                      <MeetingDetail />
                    </React.Fragment>
                  } />
                  <Route path="settings" element={
                    <React.Fragment>
                      {logRouteChange('/app/settings', 'Settings')}
                      <Settings />
                    </React.Fragment>
                  } />
                </Route>
                
                {/* Error routes */}
                <Route path="/404" element={
                  <React.Fragment>
                    {logRouteChange('/404', 'NotFound')}
                    <NotFound />
                  </React.Fragment>
                } />
                <Route path="*" element={
                  <React.Fragment>
                    {logRouteChange('*', 'Navigate to 404')}
                    <Navigate to="/404" replace />
                  </React.Fragment>
                } />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
