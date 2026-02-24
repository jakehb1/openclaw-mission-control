"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  GitCommit, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TrendingUp,
  Calendar as CalendarIcon,
  Activity as ActivityIcon,
  Target,
  Zap,
} from "lucide-react";

import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { Button } from "@/components/ui/button";

import { ActivityFeed } from "@/components/clawdbot/ActivityFeed";
import { ProgressRing, ProgressBar } from "@/components/clawdbot/ProgressRing";
import { StatsCard, StatsRow } from "@/components/clawdbot/StatsCard";

import { useAgentDetail } from "@/lib/use-clawdbot";
import { CLAWDBOT_AGENTS, ClawdbotSession } from "@/lib/clawdbot-gateway";
import { cn } from "@/lib/utils";

export default function AgentDetailPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const agentIdParam = params?.agentId;
  const agentId = Array.isArray(agentIdParam) ? agentIdParam[0] : agentIdParam;

  const { agent, activity, sessions, metrics, isLoading } = useAgentDetail(agentId || '');
  
  // Fetch missions/jobs for this agent
  const { data: jobs } = useQuery({
    queryKey: ['jobs', agentId],
    queryFn: async () => {
      const response = await fetch('/api/gateway/jobs');
      const data = await response.json();
      return (data.jobs || []).filter((j: any) => j.agentId === agentId);
    },
    refetchInterval: 30000,
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'activity' | 'sessions'>('overview');
  
  // Calculate performance score (mock)
  const performanceScore = useMemo(() => {
    if (!metrics) return 0;
    const score = Math.min(100, 
      (metrics.tasksCompleted * 10) + 
      (metrics.commits * 5) - 
      (metrics.errors * 15)
    );
    return Math.max(0, score);
  }, [metrics]);
  
  const statusColors = {
    online: { bg: "bg-green-500", text: "text-green-700", bgLight: "bg-green-50" },
    offline: { bg: "bg-gray-300", text: "text-gray-700", bgLight: "bg-gray-50" },
    busy: { bg: "bg-orange-500", text: "text-orange-700", bgLight: "bg-orange-50" },
    idle: { bg: "bg-blue-400", text: "text-blue-700", bgLight: "bg-blue-50" },
  };
  
  const statusLabels = {
    online: "Online",
    offline: "Offline", 
    busy: "Busy",
    idle: "Idle",
  };

  if (!agent) {
    return (
      <DashboardShell>
        <DashboardSidebar />
        <main className="flex flex-1 items-center justify-center bg-[color:var(--bg-secondary)]">
          <div className="text-center">
            <p className="text-[color:var(--text-muted)]">Agent not found</p>
            <Button variant="outline" onClick={() => router.push('/agents')} className="mt-4">
              Back to Agents
            </Button>
          </div>
        </main>
      </DashboardShell>
    );
  }

  const status = agent.status || 'offline';
  const colors = statusColors[status];

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel
          message="Sign in to view agent details."
          forceRedirectUrl={`/agents/${agentId}`}
          signUpForceRedirectUrl={`/agents/${agentId}`}
        />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-[color:var(--bg-secondary)]">
          {/* Header */}
          <div className="border-b border-[color:var(--border-light)] bg-white">
            <div className="px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  {/* Agent avatar */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--surface-muted)] to-[color:var(--surface-strong)] text-4xl shadow-apple">
                    {agent.emoji}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-semibold text-[color:var(--text)] tracking-tight">
                        {agent.name}
                      </h1>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                        colors.bgLight,
                        colors.text
                      )}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", colors.bg, status === 'online' && "animate-pulse")} />
                        {statusLabels[status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                      Clawdbot Agent • Last active {agent.lastSeen ? formatRelativeTime(agent.lastSeen) : 'never'}
                    </p>
                    {agent.currentTask && (
                      <p className="mt-2 text-sm text-[color:var(--accent)]">
                        Currently: {agent.currentTask}
                      </p>
                    )}
                  </div>
                </div>
                
                <Button variant="outline" onClick={() => router.push('/agents')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  All Agents
                </Button>
              </div>
              
              {/* Tabs */}
              <div className="mt-6 flex gap-1">
                {(['overview', 'missions', 'activity', 'sessions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      activeTab === tab
                        ? "bg-[color:var(--accent)] text-white"
                        : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)]"
                    )}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Commits"
                    value={metrics.commits}
                    subtitle="Last 7 days"
                    icon={<GitCommit className="h-5 w-5" />}
                    color="purple"
                  />
                  <StatsCard
                    title="Tasks Completed"
                    value={metrics.tasksCompleted}
                    subtitle="Last 7 days"
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    color="green"
                  />
                  <StatsCard
                    title="Messages"
                    value={metrics.messagesProcessed}
                    subtitle="Last 7 days"
                    icon={<MessageSquare className="h-5 w-5" />}
                    color="blue"
                  />
                  <StatsCard
                    title="Errors"
                    value={metrics.errors}
                    subtitle="Last 7 days"
                    icon={<AlertCircle className="h-5 w-5" />}
                    color={metrics.errors > 0 ? "red" : "gray"}
                  />
                </div>
                
                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                  {/* Performance chart area */}
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                    <h3 className="text-sm font-semibold text-[color:var(--text)] mb-6">
                      Performance Overview
                    </h3>
                    <div className="flex items-center justify-center py-8">
                      <ProgressRing
                        progress={performanceScore}
                        size={180}
                        strokeWidth={12}
                        color={performanceScore > 70 ? 'green' : performanceScore > 40 ? 'orange' : 'red'}
                      >
                        <div className="text-center">
                          <span className="text-4xl font-semibold text-[color:var(--text)]">
                            {performanceScore}
                          </span>
                          <p className="text-xs text-[color:var(--text-quiet)] mt-1">
                            Performance Score
                          </p>
                        </div>
                      </ProgressRing>
                    </div>
                    
                    {/* Metric breakdown */}
                    <div className="mt-6 pt-6 border-t border-[color:var(--border-light)] space-y-3">
                      <MetricBar label="Task Completion" value={85} color="green" />
                      <MetricBar label="Response Time" value={72} color="blue" />
                      <MetricBar label="Code Quality" value={90} color="purple" />
                      <MetricBar label="Error Rate" value={metrics.errors > 0 ? 100 - (metrics.errors * 10) : 100} color={metrics.errors > 0 ? "orange" : "green"} />
                    </div>
                  </div>
                  
                  {/* Session stats */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] mb-4">
                        Session Stats
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[color:var(--text-muted)]">Total Sessions</span>
                          <span className="text-sm font-semibold text-[color:var(--text)]">{metrics.totalSessions}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[color:var(--text-muted)]">Avg Duration</span>
                          <span className="text-sm font-semibold text-[color:var(--text)]">{metrics.avgSessionDuration}m</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent activity preview */}
                    <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                          Recent Activity
                        </h4>
                        <button
                          onClick={() => setActiveTab('activity')}
                          className="text-xs text-[color:var(--accent)] hover:underline"
                        >
                          View all
                        </button>
                      </div>
                      <ActivityFeed 
                        activities={activity.slice(0, 5)} 
                        showAgentName={false}
                        maxItems={5}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Missions Tab */}
            {activeTab === 'missions' && (
              <div className="space-y-4">
                {!jobs || jobs.length === 0 ? (
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-8 text-center">
                    <Target className="h-12 w-12 mx-auto text-[color:var(--text-quiet)] mb-3" />
                    <p className="text-[color:var(--text-muted)]">No scheduled missions for this agent.</p>
                  </div>
                ) : (
                  jobs.map((job: any) => (
                    <div key={job.id} className="rounded-2xl border border-[color:var(--border-light)] bg-white overflow-hidden">
                      <div className="bg-[color:var(--surface-muted)] px-6 py-4 border-b border-[color:var(--border-light)]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Zap className="h-5 w-5 text-amber-500" />
                            <h3 className="font-semibold text-[color:var(--text)]">{job.name}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-[color:var(--text-muted)]">
                            <span className="flex items-center gap-1.5">
                              <CalendarIcon className="h-4 w-4" />
                              {formatCronSchedule(job.schedule?.expr)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {job.nextRun ? formatNextRun(job.nextRun) : 'Not scheduled'}
                            </span>
                            {job.lastStatus && (
                              <span className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                job.lastStatus === 'ok' && "bg-green-100 text-green-700",
                                job.lastStatus === 'error' && "bg-red-100 text-red-700",
                                job.lastStatus === 'skipped' && "bg-yellow-100 text-yellow-700"
                              )}>
                                {job.lastStatus === 'ok' && <CheckCircle2 className="h-3 w-3" />}
                                {job.lastStatus === 'error' && <AlertCircle className="h-3 w-3" />}
                                {job.lastStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-[color:var(--text-muted)] bg-[color:var(--surface-muted)] rounded-xl p-4 max-h-96 overflow-y-auto leading-relaxed">
                          {job.mission}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-[color:var(--text)]">
                    Activity History
                  </h3>
                  <span className="text-xs text-[color:var(--text-quiet)]">
                    {activity.length} events
                  </span>
                </div>
                <ActivityFeed activities={activity} showAgentName={false} maxItems={100} />
              </div>
            )}
            
            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <div className="rounded-2xl border border-[color:var(--border-light)] bg-white">
                <div className="border-b border-[color:var(--border-light)] px-6 py-4">
                  <h3 className="text-sm font-semibold text-[color:var(--text)]">
                    Session History
                  </h3>
                </div>
                <div className="divide-y divide-[color:var(--border-light)]">
                  {sessions.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[color:var(--text-muted)]">
                      No sessions recorded yet
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: 'green' | 'blue' | 'purple' | 'orange' | 'red' }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[color:var(--text-muted)]">{label}</span>
        <span className="text-xs font-medium text-[color:var(--text)]">{value}%</span>
      </div>
      <ProgressBar progress={value} height={6} color={color} />
    </div>
  );
}

function SessionRow({ session }: { session: ClawdbotSession }) {
  const statusColors = {
    active: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-700",
    error: "bg-red-100 text-red-700",
  };
  
  const channelIcons: Record<string, string> = {
    telegram: "📱",
    discord: "💬",
    webchat: "🌐",
    whatsapp: "📲",
    slack: "💼",
  };
  
  const duration = session.endedAt
    ? Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : null;
  
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-[color:var(--surface-muted)] transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--surface-muted)] text-lg">
        {channelIcons[session.channel] || "💬"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[color:var(--text)] truncate">
            {session.channel.charAt(0).toUpperCase() + session.channel.slice(1)} Session
          </p>
          <span className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
            statusColors[session.status]
          )}>
            {session.status}
          </span>
        </div>
        <p className="text-xs text-[color:var(--text-quiet)]">
          {formatDateTime(session.startedAt)}
          {duration !== null && ` • ${duration}m`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-[color:var(--text)]">{session.messageCount}</p>
        <p className="text-xs text-[color:var(--text-quiet)]">messages</p>
      </div>
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCronSchedule(expr?: string): string {
  if (!expr) return 'Not set';
  if (expr === '0 7 * * *') return 'Daily 7:00 AM';
  if (expr === '0 8 * * *') return 'Daily 8:00 AM';
  if (expr === '0 9 * * *') return 'Daily 9:00 AM';
  if (expr === '0 10 * * *') return 'Daily 10:00 AM';
  if (expr === '0 18 * * 0') return 'Sundays 6:00 PM';
  if (expr === '0 23 * * *') return 'Daily 11:00 PM';
  return expr;
}

function formatNextRun(ms: number): string {
  const date = new Date(ms);
  const now = new Date();
  const diffMs = ms - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffMs < 0) return 'Overdue';
  if (diffHours < 24) return `in ${diffHours}h ${diffMins}m`;
  return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
}
