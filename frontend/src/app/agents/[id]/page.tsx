"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DashboardPageLayout } from "@/components/templates/DashboardPageLayout";
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Activity, Zap } from "lucide-react";
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

interface ActivityItem {
  id: string;
  agentId: string;
  agentName: string;
  type: string;
  description: string;
  timestamp: string;
}

function useAgentJobs(agentId: string) {
  return useQuery({
    queryKey: ['jobs', agentId],
    queryFn: async () => {
      const response = await fetch('/api/gateway/jobs');
      const data = await response.json();
      return (data.jobs as Job[]).filter(j => j.agentId === agentId);
    },
    refetchInterval: 30000,
  });
}

function useAgentActivity(agentId: string) {
  return useQuery({
    queryKey: ['activity', agentId],
    queryFn: async () => {
      const response = await fetch('/api/gateway/activity?days=7&limit=50');
      const data = await response.json();
      return (data as ActivityItem[]).filter(a => a.agentId === agentId).slice(0, 10);
    },
    refetchInterval: 60000,
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
  if (expr === '0 7 * * *') return 'Daily at 7:00 AM';
  if (expr === '0 8 * * *') return 'Daily at 8:00 AM';
  if (expr === '0 9 * * *') return 'Daily at 9:00 AM';
  if (expr === '0 10 * * *') return 'Daily at 10:00 AM';
  if (expr === '0 18 * * 0') return 'Sundays at 6:00 PM';
  if (expr === '0 23 * * *') return 'Daily at 11:00 PM';
  return `${expr} (${schedule.tz})`;
}

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  
  const styles: Record<string, string> = {
    ok: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    skipped: 'bg-yellow-100 text-yellow-700',
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status === 'ok' && <CheckCircle className="h-3 w-3" />}
      {status === 'error' && <XCircle className="h-3 w-3" />}
      {status === 'skipped' && <AlertCircle className="h-3 w-3" />}
      {status}
    </span>
  );
}

const activityIcons: Record<string, string> = {
  message: '💬',
  commit: '📝',
  file_created: '📄',
  file_modified: '✏️',
  error: '❌',
  spawn: '🔀',
};

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params.id as string;
  
  const agent = CLAWDBOT_AGENTS.find(a => a.id === agentId);
  const { data: jobs, isLoading: jobsLoading } = useAgentJobs(agentId);
  const { data: activity, isLoading: activityLoading } = useAgentActivity(agentId);
  
  if (!agent) {
    return (
      <DashboardPageLayout title="Agent Not Found" isAdmin={true}>
        <p>No agent with ID "{agentId}" found.</p>
      </DashboardPageLayout>
    );
  }
  
  return (
    <DashboardPageLayout
      title={`${agent.emoji} ${agent.name}`}
      description={agent.currentTask}
      isAdmin={true}
      stickyHeader
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column - Missions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{agent.emoji}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
                <p className="text-slate-500 mt-1">{agent.currentTask}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <div className={`h-2 w-2 rounded-full ${agent.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-slate-600 capitalize">{agent.status}</span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {jobs?.length || 0} scheduled job{jobs?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Missions */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Missions
              </h2>
            </div>
            
            {jobsLoading ? (
              <div className="p-6 text-center text-slate-500">Loading missions...</div>
            ) : jobs?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No scheduled missions for this agent.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs?.map(job => (
                  <div key={job.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{job.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatSchedule(job.schedule)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Next: {formatNextRun(job.nextRun)}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={job.lastStatus} />
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                      {job.mission}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar - Recent Activity */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Recent Activity
              </h2>
            </div>
            
            {activityLoading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : activity?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recent activity.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activity?.map(item => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{activityIcons[item.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{item.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatTimeAgo(item.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPageLayout>
  );
}
