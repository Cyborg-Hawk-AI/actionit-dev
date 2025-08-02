
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: any;
  type: 'decisions' | 'action_items' | 'insights' | 'today_meetings';
}

export const InsightModal: React.FC<InsightModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  type
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const renderContent = () => {
    if (!content) {
      return <p className="sf-text text-muted-foreground text-center py-8">No data available</p>;
    }

    switch (type) {
      case 'decisions':
        if (Array.isArray(content)) {
          return (
            <div className="space-y-4">
              {content.map((decision, index) => (
                <div key={index} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200/30 dark:border-emerald-700/30">
                  <p className="sf-text text-emerald-900 dark:text-emerald-100">{decision}</p>
                </div>
              ))}
            </div>
          );
        }
        return <p className="sf-text text-emerald-900 dark:text-emerald-100">{content}</p>;

      case 'action_items':
        if (Array.isArray(content)) {
          return (
            <div className="space-y-3">
              {content.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/30 dark:border-purple-700/30">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                  <p className="sf-text text-purple-900 dark:text-purple-100">{item}</p>
                </div>
              ))}
            </div>
          );
        }
        return <p className="sf-text text-purple-900 dark:text-purple-100">{content}</p>;

      case 'insights':
        return <p className="sf-text text-teal-900 dark:text-teal-100 leading-relaxed">{content}</p>;

      case 'today_meetings':
        if (Array.isArray(content)) {
          return (
            <div className="space-y-4">
              {content.map((meeting, index) => (
                <div key={index} className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/30 dark:border-blue-700/30">
                  <h4 className="sf-display font-medium text-blue-900 dark:text-blue-100 mb-2">{meeting.title}</h4>
                  <p className="sf-text text-sm text-blue-700 dark:text-blue-300">
                    {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(meeting.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {meeting.description && (
                    <p className="sf-text text-sm text-blue-600 dark:text-blue-400 mt-2">{meeting.description}</p>
                  )}
                </div>
              ))}
            </div>
          );
        }
        return <p className="sf-text text-blue-900 dark:text-blue-100">No meetings today</p>;

      default:
        return <p className="sf-text text-muted-foreground">No content available</p>;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        "relative w-full max-w-2xl max-h-[80vh] bg-white/80 dark:bg-black/20 backdrop-blur-md",
        "border border-white/20 dark:border-white/10 shadow-lg rounded-xl",
        "animate-fade-in"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-white/10">
          <h2 className="sf-display text-xl font-medium text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/20 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
