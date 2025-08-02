import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Calendar,
  Settings as SettingsIcon,
  Home,
  LogOut,
  Menu,
  X,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchInput from '@/components/dashboard/SearchInput';
import JoinMeetingModal from '@/components/dashboard/JoinMeetingModal';
import { useRecallData } from '@/hooks/useRecallData';
import { JoinMode } from '@/services/recallService';
import { toast } from '@/hooks/use-toast';

const Layout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const { joinMeetingWithBot } = useRecallData();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const navigationItems = [
    { to: '/app', icon: Home, label: 'Dashboard' },
    { to: '/app/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/app/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const handleSearch = (term: string) => {
    // Search functionality is handled in SearchInput component
  };

  const handleJoinMeeting = async (meetingInfo: {
    url: string;
    title: string;
    joinMode: JoinMode;
    useBot: boolean;
  }) => {
    if (!meetingInfo.useBot) {
      // If no bot is requested, we're done after creating the meeting record
      return;
    }

    try {
      // The meeting record was already created in the modal
      // Now we need to trigger the bot to join
      
      // Note: We would need the meeting ID here to join with bot
      // For now, just show success message as the bot logic will be handled by webhooks
      toast({
        title: "Bot Setup Complete",
        description: "The meeting bot will join when the meeting starts.",
      });
    } catch (error) {
      console.error('[Layout] Error setting up bot for meeting:', error);
      toast({
        title: "Bot Setup Failed",
        description: error instanceof Error ? error.message : "Failed to setup meeting bot",
        variant: "destructive",
      });
    }
  };

  const NavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Logo section */}
      <div className={`${mobile ? 'p-4' : 'p-3'} border-b border-border dark:border-[#2C2C2C]`}>
        <Link 
          to="/app" 
          className="flex items-center gap-3"
          onClick={() => mobile && setMobileMenuOpen(false)}
        >
          <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-1.5 overflow-hidden">
            <img 
              src="/lovable-uploads/bc71da7b-c851-4555-a84a-74eddc25384a.png" 
              alt="Action.IT Logo" 
              className="w-8 h-8 object-contain" 
            />
          </div>
          {mobile && (
            <span className="text-lg font-semibold text-foreground">Action.IT</span>
          )}
        </Link>
      </div>
      
      {/* Navigation items */}
      <nav className={`flex-1 ${mobile ? 'p-4' : 'p-2'} space-y-2`}>
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={`flex items-center ${mobile ? 'gap-3 px-4 py-3' : 'justify-center w-12 h-12'} rounded-md transition-colors ${
              location.pathname === item.to 
                ? 'bg-primary/10 dark:bg-primary/20 text-primary' 
                : 'hover:bg-muted dark:hover:bg-[#1F1F1F] text-muted-foreground hover:text-foreground'
            }`}
            title={mobile ? undefined : item.label}
          >
            <item.icon className="w-5 h-5" />
            {mobile && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      {/* User section */}
      <div className={`${mobile ? 'p-4' : 'p-2'} border-t border-border dark:border-[#2C2C2C] space-y-2`}>
        <div className={`flex ${mobile ? 'items-center gap-3' : 'flex-col items-center'}`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
            <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary text-xs">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {mobile && (
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          )}
        </div>
        
        <div className={`flex ${mobile ? 'justify-between' : 'flex-col'} gap-2`}>
          <ThemeToggle variant="icon" className={`w-8 h-8 ${mobile ? '' : 'mx-auto'}`} />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            title="Log out" 
            className={`w-8 h-8 ${mobile ? '' : 'mx-auto'} text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-[#1F1F1F] transition-colors`}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-30 w-16 bg-card dark:bg-[#1A1A1A] shadow-sm border-r border-border dark:border-[#2C2C2C]">
          <div className="flex flex-col h-full">
            <NavContent />
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-40 bg-card dark:bg-[#1A1A1A] border-b border-border dark:border-[#2C2C2C] px-4 py-3">
            <div className="flex items-center justify-between">
              <Link to="/app" className="flex items-center gap-2">
                <div className="bg-primary/10 dark:bg-primary/20 rounded-full p-1.5 overflow-hidden">
                  <img 
                    src="/lovable-uploads/bc71da7b-c851-4555-a84a-74eddc25384a.png" 
                    alt="Action.IT Logo" 
                    className="w-6 h-6 object-contain" 
                  />
                </div>
                <span className="text-lg font-semibold text-foreground">Action.IT</span>
              </Link>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-foreground"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Sidebar Overlay */}
          {mobileMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-black/50" 
                onClick={() => setMobileMenuOpen(false)}
              />
              <aside className="fixed inset-y-0 left-0 z-50 w-80 bg-card dark:bg-[#1A1A1A] shadow-xl border-r border-border dark:border-[#2C2C2C] transform transition-transform duration-300">
                <div className="flex flex-col h-full">
                  <NavContent mobile />
                </div>
              </aside>
            </>
          )}
        </>
      )}

      {/* Desktop Header Bar */}
      {!isMobile && (
        <div className="fixed top-0 left-16 right-0 z-30 bg-card/80 dark:bg-[#1A1A1A]/80 backdrop-blur-sm border-b border-border/40 dark:border-[#2C2C2C]/40">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex-1">
              {/* Left side can be used for page title or breadcrumbs in the future */}
            </div>
            
            <div className="flex items-center gap-4">
              <SearchInput 
                placeholder="Search meetings..." 
                onSearch={handleSearch}
                className="w-80"
              />
              <Button 
                onClick={() => setShowJoinModal(true)}
                className="action-button interactive-element flex items-center gap-2"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 ${isMobile ? 'pt-16' : 'ml-16 pt-16'}`}>
        <div className={`container mx-auto ${isMobile ? 'px-4 py-4' : 'px-4 py-6'}`}>
          {/* Mobile Search and Join Button */}
          {isMobile && (
            <div className="mb-6 space-y-4">
              <SearchInput 
                placeholder="Search meetings..." 
                onSearch={handleSearch}
                className="w-full"
              />
              <Button 
                onClick={() => setShowJoinModal(true)}
                className="action-button interactive-element flex items-center gap-2 w-full"
              >
                <Video className="h-4 w-4" />
                Join Meeting
              </Button>
            </div>
          )}
          
          <Outlet />
        </div>
      </main>

      {/* Join Meeting Modal */}
      <JoinMeetingModal
        open={showJoinModal}
        onOpenChange={setShowJoinModal}
        onJoinMeeting={handleJoinMeeting}
      />
    </div>
  );
};

export default Layout;
