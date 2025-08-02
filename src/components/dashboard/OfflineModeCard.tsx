import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Wifi, 
  WifiOff, 
  Cloud,
  HardDrive,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Settings,
  Lock
} from 'lucide-react';

interface SyncItem {
  id: string;
  type: 'meeting' | 'transcript' | 'insight' | 'action_item';
  title: string;
  size: number; // in bytes
  status: 'pending' | 'uploading' | 'synced' | 'error';
  createdAt: string;
}

interface OfflineModeCardProps {
  isOfflineMode: boolean;
  onToggleOfflineMode: (enabled: boolean) => void;
  syncQueue: SyncItem[];
  localStorageUsed: number; // in MB
  totalStorage: number; // in MB
  onSyncNow: () => void;
  onViewSyncQueue: () => void;
  className?: string;
}

export function OfflineModeCard({ 
  isOfflineMode, 
  onToggleOfflineMode,
  syncQueue,
  localStorageUsed,
  totalStorage,
  onSyncNow,
  onViewSyncQueue,
  className 
}: OfflineModeCardProps) {
  const pendingItems = syncQueue.filter(item => item.status === 'pending');
  const uploadingItems = syncQueue.filter(item => item.status === 'uploading');
  const errorItems = syncQueue.filter(item => item.status === 'error');
  const syncedItems = syncQueue.filter(item => item.status === 'synced');

  const storagePercentage = (localStorageUsed / totalStorage) * 100;

  const getStatusIcon = (status: SyncItem['status']) => {
    switch (status) {
      case 'pending':
        return <Cloud className="h-4 w-4 text-amber-600" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: SyncItem['status']) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      uploading: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      synced: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <Card className={`bg-gradient-to-br from-slate-50/80 via-gray-50/40 to-zinc-50/30 dark:from-slate-950/20 dark:via-gray-950/10 dark:to-zinc-950/10 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-slate-100/50 to-gray-100/50 dark:from-slate-900/20 dark:to-gray-900/20 border-b border-slate-200/30 dark:border-slate-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-slate-600 to-gray-600 rounded-full p-2">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Offline Mode
              </CardTitle>
              <CardDescription className="text-slate-700/70 dark:text-slate-300/70">
                Privacy-first local processing
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={isOfflineMode}
              onCheckedChange={onToggleOfflineMode}
            />
            <Badge className={`${isOfflineMode ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300'}`}>
              {isOfflineMode ? 'Active' : 'Online'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-4 pb-4 space-y-4">
          {/* Security Status */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isOfflineMode ? (
                  <Lock className="h-4 w-4 text-green-600" />
                ) : (
                  <Wifi className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {isOfflineMode ? 'Security Mode: No Internet Used' : 'Online Mode: Cloud Processing'}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-600/70 dark:text-slate-400/70">
              {isOfflineMode 
                ? 'All processing happens locally. No data leaves your device.'
                : 'Data is processed in the cloud for enhanced AI capabilities.'
              }
            </p>
          </div>

          {/* Local Storage */}
          <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-slate-200/30 dark:border-slate-800/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Local Storage
                </span>
              </div>
              <span className="text-xs text-slate-600/70 dark:text-slate-400/70">
                {formatBytes(localStorageUsed * 1024 * 1024)} / {formatBytes(totalStorage * 1024 * 1024)}
              </span>
            </div>
            
            <Progress value={storagePercentage} className="h-2 mb-2" />
            
            <div className="flex items-center justify-between text-xs text-slate-600/70 dark:text-slate-400/70">
              <span>{Math.round(storagePercentage)}% used</span>
              <span>{formatBytes((totalStorage - localStorageUsed) * 1024 * 1024)} available</span>
            </div>
          </div>

          {/* Sync Queue */}
          {syncQueue.length > 0 && (
            <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-slate-200/30 dark:border-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Sync Queue
                </h5>
                <div className="flex gap-2">
                  {pendingItems.length > 0 && (
                    <Badge className="bg-amber-100/50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                      {pendingItems.length} pending
                    </Badge>
                  )}
                  {errorItems.length > 0 && (
                    <Badge className="bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs">
                      {errorItems.length} errors
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {syncQueue.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-950/20 rounded">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-xs text-slate-700/70 dark:text-slate-300/70 truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600/70 dark:text-slate-400/70">
                        {formatBytes(item.size)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
              
              {syncQueue.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewSyncQueue}
                  className="w-full mt-3 text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20"
                >
                  View All {syncQueue.length} Items
                </Button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSyncNow}
              disabled={syncQueue.length === 0}
              className="flex-1 text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20"
            >
              <Upload className="h-3 w-3 mr-1" />
              Sync Now
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/20"
            >
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 