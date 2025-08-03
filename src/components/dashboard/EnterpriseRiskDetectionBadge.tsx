import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskItem {
  id: string;
  type: 'compliance' | 'security' | 'delivery' | 'ownership' | 'timeline';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  meetingId?: string;
  meetingTitle?: string;
  detectedAt: string;
  status: 'active' | 'resolved' | 'acknowledged';
}

interface EnterpriseRiskDetectionBadgeProps {
  risks: RiskItem[];
  isLoading?: boolean;
  onViewRisk: (risk: RiskItem) => void;
  onAcknowledgeRisk: (riskId: string) => void;
  onResolveRisk: (riskId: string) => void;
  className?: string;
}

export function EnterpriseRiskDetectionBadge({ 
  risks, 
  isLoading = false,
  onViewRisk,
  onAcknowledgeRisk,
  onResolveRisk,
  className 
}: EnterpriseRiskDetectionBadgeProps) {
  const activeRisks = risks.filter(risk => risk.status === 'active');
  const highSeverityRisks = activeRisks.filter(risk => risk.severity === 'high');

  if (isLoading) {
    return (
      <Card className={`bg-gradient-to-br from-red-50/80 via-orange-50/40 to-amber-50/30 dark:from-red-950/20 dark:via-orange-950/10 dark:to-amber-950/10 backdrop-blur-sm border-red-200/50 dark:border-red-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
        <CardHeader className="bg-gradient-to-r from-red-100/50 to-orange-100/50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200/30 dark:border-red-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-full p-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-red-900 dark:text-red-100">
                  Enterprise Risk Detection
                </CardTitle>
                <CardDescription className="text-red-700/70 dark:text-red-300/70">
                  Monitoring compliance and security
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              Loading...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-red-200/50 rounded"></div>
            <div className="h-4 bg-red-200/50 rounded w-3/4"></div>
            <div className="h-4 bg-red-200/50 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeRisks.length === 0) {
    return (
      <Card className={`bg-gradient-to-br from-green-50/80 via-emerald-50/40 to-teal-50/30 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/10 backdrop-blur-sm border-green-200/50 dark:border-green-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
        <CardHeader className="bg-gradient-to-r from-green-100/50 to-emerald-100/50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-200/30 dark:border-green-800/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-full p-2">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">
                  Enterprise Risk Detection
                </CardTitle>
                <CardDescription className="text-green-700/70 dark:text-green-300/70">
                  All clear - no risks detected
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100/50 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-700 dark:text-green-300 font-medium">
              No active risks detected
            </p>
            <p className="text-green-600/70 dark:text-green-400/70 text-sm mt-1">
              Your meetings and decisions are compliant
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-red-50/80 via-orange-50/40 to-amber-50/30 dark:from-red-950/20 dark:via-orange-950/10 dark:to-amber-950/10 backdrop-blur-sm border-red-200/50 dark:border-red-800/30 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] rounded-xl ${className}`}>
      <CardHeader className="bg-gradient-to-r from-red-100/50 to-orange-100/50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-red-200/30 dark:border-red-800/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-full p-2">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-red-900 dark:text-red-100">
                Enterprise Risk Detection
              </CardTitle>
              <CardDescription className="text-red-700/70 dark:text-red-300/70">
                {activeRisks.length} risk{activeRisks.length !== 1 ? 's' : ''} detected
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {highSeverityRisks.length > 0 && (
              <Badge className="bg-red-100/50 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                {highSeverityRisks.length} High
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="px-4 pb-4 space-y-3">
          {activeRisks.slice(0, 3).map((risk) => (
            <div key={risk.id} className="p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg border border-red-200/30 dark:border-red-800/30">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900 dark:text-red-100">
                    {risk.title}
                  </span>
                </div>
                <Badge className={`${
                  risk.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' :
                  risk.severity === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                }`}>
                  {risk.severity}
                </Badge>
              </div>
              
              <p className="text-sm text-red-700/70 dark:text-red-300/70 mb-2">
                {risk.description}
              </p>
              
              {risk.meetingTitle && (
                <div className="flex items-center gap-1 text-xs text-red-600/70 dark:text-red-400/70 mb-2">
                  <span>From: {risk.meetingTitle}</span>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewRisk(risk)}
                  className="text-xs border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledgeRisk(risk.id)}
                  className="text-xs border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                >
                  Acknowledge
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolveRisk(risk.id)}
                  className="text-xs border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/20"
                >
                  Resolve
                </Button>
              </div>
            </div>
          ))}
          
          {activeRisks.length > 3 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewRisk(activeRisks[0])}
                className="text-xs border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                View All {activeRisks.length} Risks
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 