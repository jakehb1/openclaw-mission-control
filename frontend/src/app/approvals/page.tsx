"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedIn } from "@/auth/clerk";
import { CheckCircle, XCircle, Clock, AlertTriangle, Bot, Terminal, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PendingApproval {
  id: string;
  type: 'exec' | 'task' | 'deploy' | 'file';
  agent: string;
  title: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
  createdAt: Date;
  details?: Record<string, any>;
}

const AGENT_EMOJIS: Record<string, string> = {
  'echo': '🔮',
  'forge': '⚒️',
  'scribe': '✍️',
  'scout': '🔭',
  'sentinel': '🛡️',
  'archive': '📚',
  'main': '🤖',
};

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'exec': return <Terminal className="w-5 h-5" />;
    case 'task': return <Zap className="w-5 h-5" />;
    case 'deploy': return <Bot className="w-5 h-5" />;
    case 'file': return <FileText className="w-5 h-5" />;
    default: return <AlertTriangle className="w-5 h-5" />;
  }
}

function ApprovalCard({ 
  approval, 
  onApprove, 
  onReject 
}: { 
  approval: PendingApproval;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  
  const handleApprove = async () => {
    setLoading('approve');
    await onApprove(approval.id);
    setLoading(null);
  };
  
  const handleReject = async () => {
    setLoading('reject');
    await onReject(approval.id);
    setLoading(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <TypeIcon type={approval.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{AGENT_EMOJIS[approval.agent] || '🤖'}</span>
              <span className="font-medium text-slate-900 capitalize">{approval.agent}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium border",
                RISK_COLORS[approval.risk]
              )}>
                {approval.risk} risk
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{approval.title}</h3>
            <p className="text-sm text-slate-500 mb-3">{approval.description}</p>
            
            {approval.details && (
              <div className="bg-slate-50 rounded-lg p-3 mb-3">
                <pre className="text-xs text-slate-600 overflow-x-auto">
                  {typeof approval.details === 'string' 
                    ? approval.details 
                    : JSON.stringify(approval.details, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>Requested {approval.createdAt.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex border-t border-slate-100">
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            "text-red-600 hover:bg-red-50",
            loading === 'reject' && "opacity-50"
          )}
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
        <div className="w-px bg-slate-100" />
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
            "text-green-600 hover:bg-green-50",
            loading === 'approve' && "opacity-50"
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([
    {
      id: '1',
      type: 'exec',
      agent: 'forge',
      title: 'Run npm install',
      description: 'Install dependencies for mission-control frontend',
      risk: 'low',
      createdAt: new Date(Date.now() - 60000),
      details: { command: 'npm install', cwd: '~/clawdbot-agents/mission-control/frontend' },
    },
    {
      id: '2',
      type: 'deploy',
      agent: 'forge',
      title: 'Deploy to Railway',
      description: 'Deploy the updated dashboard to production',
      risk: 'medium',
      createdAt: new Date(Date.now() - 120000),
      details: { service: 'clawdbot-mission-control', environment: 'production' },
    },
    {
      id: '3',
      type: 'exec',
      agent: 'sentinel',
      title: 'Run system cleanup',
      description: 'Clear old session files and temporary data',
      risk: 'high',
      createdAt: new Date(Date.now() - 180000),
      details: { command: 'rm -rf /tmp/clawdbot-*', warning: 'This will delete temporary files' },
    },
  ]);

  const [history, setHistory] = useState<Array<PendingApproval & { status: 'approved' | 'rejected'; resolvedAt: Date }>>([]);

  const handleApprove = async (id: string) => {
    // In production, this would call the gateway API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const approval = approvals.find(a => a.id === id);
    if (approval) {
      setHistory(prev => [...prev, { ...approval, status: 'approved', resolvedAt: new Date() }]);
      setApprovals(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleReject = async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const approval = approvals.find(a => a.id === id);
    if (approval) {
      setHistory(prev => [...prev, { ...approval, status: 'rejected', resolvedAt: new Date() }]);
      setApprovals(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <SignedIn>
      <DashboardSidebar />
      <DashboardShell>
        <div className="p-6 max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>
            <p className="text-slate-500 text-sm">Review and approve agent actions before they execute</p>
          </div>

          {approvals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Pending ({approvals.length})
              </h2>
              <div className="space-y-4">
                {approvals.map(approval => (
                  <ApprovalCard 
                    key={approval.id} 
                    approval={approval}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            </div>
          )}

          {approvals.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <h3 className="font-medium text-slate-900 mb-1">All caught up!</h3>
              <p className="text-slate-500 text-sm">No pending approvals. Your agents are waiting for instructions.</p>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Recent History
              </h2>
              <div className="space-y-2">
                {history.slice(-5).reverse().map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      item.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                      {item.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <span className="text-lg">{AGENT_EMOJIS[item.agent]}</span>
                    <span className="flex-1 text-sm text-slate-600">{item.title}</span>
                    <span className="text-xs text-slate-400">{item.resolvedAt.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardShell>
    </SignedIn>
  );
}
