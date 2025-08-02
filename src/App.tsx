
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                {/* Default route now points to home page */}
                <Route path="/" element={<Index />} />
                
                {/* Coming soon page preserved at /coming-soon */}
                <Route path="/coming-soon" element={<ComingSoon />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Legal pages */}
                <Route path="/TOS" element={<TermsOfService />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                
                {/* App routes */}
                <Route path="/app" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="meetings/:meetingId" element={<MeetingDetail />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                {/* Error routes */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
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
