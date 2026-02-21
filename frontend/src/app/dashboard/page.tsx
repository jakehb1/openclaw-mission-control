"use client";

export const dynamic = "force-dynamic";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  GitCommit, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Zap,
  ArrowRight,
  Bot,
  Calendar,
} from "lucide-react";

import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { Button } from "@/components/ui/button";

import { AgentCard, AgentCardCompact } from "@/components/clawdbot/AgentCard";
import { ActivityFeed, ActivityFeedCompact } from "@/components/clawdbot/ActivityFeed";
import { ProgressRing, ProgressBar } from "@/components/clawdbot/ProgressRing";
import { StatsCard, StatsCardMini } from "@/components/clawdbot/StatsCard";

import { 
  useClawdbotAgents, 
  useTodayProgress, 
  useRecentActivity,
  useClawdbotSessions,
  useGatewayHealth,
} from "@/lib/use-clawdbot";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  
  const { agents, gatewayConnected } = useClawdbotAgents();
  const { tasksCompleted, plannedTasks, progress, commits, messages, todayActivity } = useTodayProgress();
  const { activity: recentActivity } = useRecentActivity(15);
  const sessionsQuery = useClawdbotSessions(7);
  const healthQuery = useGatewayHealth();
  
  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy');
  const activeSessions = sessionsQuery.data?.filter(s => s.status === 'active') ?? [];
  
  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const sessions = sessionsQuery.data ?? [];
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const errorSessions = sessions.filter(s => s.status === 'error').length;
    
    return {
      totalSessions: sessions.length,
      totalMessages,
      completedSessions,
      errorSessions,
      successRate: sessions.length > 0 
        ? Math.round((completedSessions / sessions.length) * 100)
        : 100,
    };
  }, [sessionsQuery.data]);

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel
          message="Sign in to access the dashboard."
          forceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-[color:var(--bg-secondary)]">
          {/* Header */}
          <div className="border-b border-[color:var(--border-light)] bg-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-[color:var(--text)] tracking-tight">
                  Dashboard
                </h2>
                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                  Welcome back. Here's what's happening today.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-4 py-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full",
                    gatewayConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  )} />
                  <span className="text-xs font-medium text-[color:var(--text-muted)]">
                    {gatewayConnected ? 'Gateway Connected' : 'Gateway Offline'}
                  </span>
                </div>
                <Link href="/reports">
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    View Reports
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Today's Progress Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[color:var(--text)]">Today's Progress</h3>
                <span className="text-sm text-[color:var(--text-quiet)]">{formatTime()}</span>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
                {/* Progress ring and stats */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                  <div className="flex items-center gap-8">
                    <ProgressRing
                      progress={progress}
                      size={140}
                      strokeWidth={10}
                      color={progress >= 80 ? 'green' : progress >= 50 ? 'blue' : 'orange'}
                    >
                      <div className="text-center">
                        <span className="text-3xl font-semibold text-[color:var(--text)]">
                          {tasksCompleted}
                        </span>
                        <span className="text-lg text-[color:var(--text-quiet)]">/{plannedTasks}</span>
                        <p className="text-[10px] text-[color:var(--text-quiet)] uppercase mt-0.5">
                          Tasks
                        </p>
                      </div>
                    </ProgressRing>
                    
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[color:var(--text-muted)]">Daily Goal</span>
                          <span className="text-sm font-medium text-[color:var(--text)]">{progress}%</span>
                        </div>
                        <ProgressBar progress={progress} height={8} color={progress >= 80 ? 'green' : 'blue'} />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[color:var(--border-light)]">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
                            <GitCommit className="h-4 w-4" />
                            <span className="text-xl font-semibold">{commits}</span>
                          </div>
                          <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Commits</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xl font-semibold">{messages}</span>
                          </div>
                          <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Messages</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                            <Bot className="h-4 w-4" />
                            <span className="text-xl font-semibold">{onlineAgents.length}</span>
                          </div>
                          <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick actions / Active sessions */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] mb-4">
                    Active Sessions
                  </h4>
                  {activeSessions.length > 0 ? (
                    <div className="space-y-3">
                      {activeSessions.slice(0, 3).map((session) => (
                        <div 
                          key={session.id}
                          className="flex items-center gap-3 rounded-xl bg-[color:var(--surface-muted)] px-4 py-3"
                        >
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[color:var(--text)] truncate">
                              {session.agentName}
                            </p>
                            <p className="text-xs text-[color:var(--text-quiet)]">
                              {session.channel} • {session.messageCount} messages
                            </p>
                          </div>
                          <Zap className="h-4 w-4 text-[color:var(--accent)]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--surface-muted)] mb-3">
                        <Bot className="h-6 w-6 text-[color:var(--text-quiet)]" />
                      </div>
                      <p className="text-sm text-[color:var(--text-muted)]">No active sessions</p>
                      <p className="text-xs text-[color:var(--text-quiet)] mt-1">Sessions will appear here when agents are working</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Agents Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[color:var(--text)]">Agents</h3>
                <Link 
                  href="/agents" 
                  className="text-sm text-[color:var(--accent)] hover:underline flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    showDetails={false}
                    className="h-full"
                  />
                ))}
              </div>
            </div>
            
            {/* Activity and Stats */}
            <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
              {/* Activity feed */}
              <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[color:var(--text)]">Recent Activity</h3>
                  <Link 
                    href="/activity" 
                    className="text-xs text-[color:var(--accent)] hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <ActivityFeed activities={recentActivity} maxItems={10} />
              </div>
              
              {/* Weekly stats */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] mb-4">
                    This Week
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--text-muted)]">Total Sessions</span>
                      <span className="text-lg font-semibold text-[color:var(--text)]">
                        {weeklyStats.totalSessions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--text-muted)]">Messages Processed</span>
                      <span className="text-lg font-semibold text-[color:var(--text)]">
                        {weeklyStats.totalMessages}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[color:var(--text-muted)]">Success Rate</span>
                      <span className={cn(
                        "text-lg font-semibold",
                        weeklyStats.successRate >= 90 ? "text-green-600" : 
                        weeklyStats.successRate >= 70 ? "text-orange-600" : "text-red-600"
                      )}>
                        {weeklyStats.successRate}%
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-[color:var(--border-light)]">
                      <ProgressBar 
                        progress={weeklyStats.successRate} 
                        height={8} 
                        color={weeklyStats.successRate >= 90 ? 'green' : weeklyStats.successRate >= 70 ? 'orange' : 'red'}
                        showLabel
                      />
                    </div>
                  </div>
                </div>
                
                {/* Quick links */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] mb-4">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <Link
                      href="/reports"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[color:var(--surface-muted)]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--text)]">Daily Reports</p>
                        <p className="text-xs text-[color:var(--text-quiet)]">View detailed activity reports</p>
                      </div>
                    </Link>
                    <Link
                      href="/activity"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-[color:var(--surface-muted)]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[color:var(--text)]">Live Feed</p>
                        <p className="text-xs text-[color:var(--text-quiet)]">Real-time activity stream</p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
