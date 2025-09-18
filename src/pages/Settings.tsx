
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RecallSettings } from '@/components/settings/RecallSettings';
import { CalendarSettings } from '@/components/settings/CalendarSettings';
import { OAuthTestPanel } from '@/components/testing/OAuthTestPanel';
import { RecallCalendarStatus } from '@/components/RecallCalendarStatus';
import { Link } from 'react-router-dom';
import { ExternalLink, Palette } from 'lucide-react';

const Settings = () => {

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card variant="apple" className="dark:bg-[#1A1A1A] dark:border-[#2C2C2C]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="sf-display">Appearance</CardTitle>
                  <CardDescription className="sf-text">Customize the look and feel of the application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium sf-display">Theme</p>
                    <p className="text-sm text-muted-foreground sf-text">Switch between light and dark mode</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Integration */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-2">Integrations</h3>
            <CalendarSettings />
          </div>

          {/* Meeting Bot Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium mb-2">Meeting Bot</h3>
            <RecallSettings />
            
            <div className="text-sm text-muted-foreground mt-4">
              <p>
                <Link to="/docs/action-it-bot-meeting-functionality" className="text-primary inline-flex items-center hover:underline">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  How the Action.IT Bot works with your calendar and meetings
                </Link>
              </p>
            </div>
          </div>

          {/* OAuth Testing Panel - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-6">
              <Separator />
              <h3 className="text-lg font-medium mb-2">OAuth Testing</h3>
              <OAuthTestPanel />
            </div>
          )}
        </div>
      </div>
      
      {/* Recall.ai Integration */}
      <div className="mt-8">
        <RecallCalendarStatus />
      </div>
    </div>
  );
};

export default Settings;
