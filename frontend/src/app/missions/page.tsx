"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardPageLayout } from "@/components/templates/DashboardPageLayout";
import { Clock, Play, Pause, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CLAWDBOT_AGENTS } from "@/lib/clawdbot-gateway";

interface Job {
  id: string;
  name: string;
  agentId: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  mission: string;
  nextRun?: number;
  lastRun?: number;
  lastStatus?: string;
}

function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await fetch('/api/gateway/jobs');
      const data = await response.json();
      return data.jobs as Job[];
    },
    refetchInterval: 30000,
  });
}

function formatNextRun(ms?: number) {
  if (!ms) return 'Not scheduled';
  const date = new Date(ms);
  const now = new Date();
  const diffMs = ms - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffMs < 0) return 'Overdue';
  if (diffHours < 24) {
    return `in ${diffHours}h ${diffMins}m`;
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}

function formatSchedule(schedule: Job['schedule']) {
  const expr = schedule.expr;
  // Parse common cron patterns
  if (expr === '0 7 * * *') return 'Daily at 7:00 AM';
  if (expr === '0 8 * * *') return 'Daily at 8:00 AM';
  if (expr === '0 9 * * *') return 'Daily at 9:00 AM';
  if (expr === '0 10 * * *') return 'Daily at 10:00 AM';
  if (expr === '0 18 * * 0') return 'Sundays at 6:00 PM';
  if (expr === '0 23 * * *') return 'Daily at 11:00 PM';
  return `${expr} (${schedule.tz})`;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  
  const styles = {
    ok: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    skipped: 'bg-yellow-100 text-yellow-700',
  };
  
  const icons = {
    ok: <CheckCircle className="h-3 w-3" />,
    error: <XCircle className="h-3 w-3" />,
    skipped: <AlertCircle className="h-3 w-3" />,
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  );
}

export default function MissionsPage() {
  const { data: jobs, isLoading } = useJobs();
  
  // Group jobs by agent
  const jobsByAgent = (jobs || []).reduce((acc, job) => {
    if (!acc[job.agentId]) acc[job.agentId] = [];
    acc[job.agentId].push(job);
    return acc;
  }, {} as Record<string, Job[]>);
  
  const agentOrder = ['scout', 'scribe', 'sentinel', 'forge', 'archive', 'main'];
  
  return (
    <DashboardPageLayout
      signedOut={{
        message: "Sign in to view agent missions.",
        forceRedirectUrl: "/missions",
      }}
      title="Agent Missions"
      description="Scheduled jobs and responsibilities for each agent."
      isAdmin={true}
      stickyHeader
    >
      <div className="space-y-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">Loading missions...</div>
        ) : (
          agentOrder.map(agentId => {
            const agentJobs = jobsByAgent[agentId];
            if (!agentJobs?.length) return null;
            
            const agent = CLAWDBOT_AGENTS.find(a => a.id === agentId);
            
            return (
              <div key={agentId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Agent Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{agent?.emoji || '🤖'}</span>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{agent?.name || agentId}</h2>
                        <p className="text-sm text-slate-500">{agent?.currentTask}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">{agentJobs.length} job{agentJobs.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                
                {/* Jobs */}
                <div className="divide-y divide-slate-100">
                  {agentJobs.map(job => (
                    <div key={job.id} className="px-6 py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">{job.name}</h3>
                          {!job.enabled && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500">Disabled</span>
                          )}
                          <StatusBadge status={job.lastStatus} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatSchedule(job.schedule)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatNextRun(job.nextRun)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mission Details */}
                      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                        {job.mission}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardPageLayout>
  );
}
