/**
 * React hooks for Clawdbot Gateway integration
 */

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CLAWDBOT_AGENTS,
  ClawdbotAgent,
  ClawdbotSession,
  AgentActivity,
  DailyReport,
  GatewayHealth,
  fetchGatewayHealth,
  generateMockActivity,
  generateMockDailyReport,
  generateMockSessions,
} from './clawdbot-gateway';

// Use mock data in development or when gateway isn't available
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL;

export function useGatewayHealth() {
  return useQuery({
    queryKey: ['clawdbot', 'health'],
    queryFn: fetchGatewayHealth,
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useClawdbotAgents() {
  const healthQuery = useGatewayHealth();
  
  // In a real implementation, this would fetch agent status from the gateway
  const [agents, setAgents] = useState<ClawdbotAgent[]>(CLAWDBOT_AGENTS);
  
  useEffect(() => {
    if (USE_MOCK_DATA) {
      // Simulate some agents being online
      const updatedAgents = CLAWDBOT_AGENTS.map(agent => ({
        ...agent,
        status: Math.random() > 0.5 ? 'online' : (Math.random() > 0.5 ? 'idle' : 'offline'),
        currentTask: Math.random() > 0.6 ? 'Processing task...' : undefined,
        lastSeen: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      })) as ClawdbotAgent[];
      setAgents(updatedAgents);
    }
  }, [healthQuery.data?.ok]);
  
  return {
    agents,
    isLoading: healthQuery.isLoading,
    isError: healthQuery.isError,
    gatewayConnected: healthQuery.data?.ok ?? false,
  };
}

export function useClawdbotSessions(days: number = 7) {
  return useQuery({
    queryKey: ['clawdbot', 'sessions', days],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return generateMockSessions(days);
      }
      // Real implementation would fetch from gateway
      return [];
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useClawdbotActivity(days: number = 7) {
  return useQuery({
    queryKey: ['clawdbot', 'activity', days],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return generateMockActivity(days);
      }
      // Real implementation would fetch from gateway
      return [];
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: ['clawdbot', 'report', date],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return generateMockDailyReport(date);
      }
      // Real implementation would fetch from gateway/backend
      return null;
    },
    staleTime: 300000, // 5 minutes
  });
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalCommits: number;
  totalTasksCompleted: number;
  totalMessages: number;
  totalErrors: number;
  totalSessions: number;
  activeAgents: number;
  totalActiveTime: number; // minutes
  agentStats: {
    agentId: string;
    agentName: string;
    emoji: string;
    commits: number;
    tasksCompleted: number;
    messagesProcessed: number;
    errors: number;
    activeTime: number;
    sessions: number;
  }[];
  dailyTrends: {
    date: string;
    commits: number;
    tasksCompleted: number;
    messages: number;
    errors: number;
  }[];
  highlights: string[];
  comparisonToPrevWeek: {
    commits: number; // percentage change
    tasksCompleted: number;
    messages: number;
    errors: number;
  };
}

function generateMockWeeklyReport(weekStart: Date): WeeklyReport {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const agentStats = CLAWDBOT_AGENTS.map(agent => {
    const commits = Math.floor(Math.random() * 80) + 10;
    const tasksCompleted = Math.floor(Math.random() * 50) + 5;
    const messagesProcessed = Math.floor(Math.random() * 200) + 30;
    const errors = Math.floor(Math.random() * 10);
    const activeTime = Math.floor(Math.random() * 2400) + 300; // 5-45 hours in minutes
    const sessions = Math.floor(Math.random() * 30) + 5;
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      commits,
      tasksCompleted,
      messagesProcessed,
      errors,
      activeTime,
      sessions,
    };
  });
  
  const dailyTrends = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dailyTrends.push({
      date: date.toISOString().split('T')[0],
      commits: Math.floor(Math.random() * 30) + 5,
      tasksCompleted: Math.floor(Math.random() * 20) + 3,
      messages: Math.floor(Math.random() * 100) + 20,
      errors: Math.floor(Math.random() * 5),
    });
  }
  
  const totalCommits = agentStats.reduce((sum, a) => sum + a.commits, 0);
  const totalTasksCompleted = agentStats.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalMessages = agentStats.reduce((sum, a) => sum + a.messagesProcessed, 0);
  const totalErrors = agentStats.reduce((sum, a) => sum + a.errors, 0);
  const totalSessions = agentStats.reduce((sum, a) => sum + a.sessions, 0);
  const totalActiveTime = agentStats.reduce((sum, a) => sum + a.activeTime, 0);
  
  const topAgent = agentStats.reduce((top, a) => a.tasksCompleted > top.tasksCompleted ? a : top, agentStats[0]);
  const mostActiveAgent = agentStats.reduce((top, a) => a.activeTime > top.activeTime ? a : top, agentStats[0]);
  
  const highlights = [
    `${topAgent.emoji} ${topAgent.agentName} led the team with ${topAgent.tasksCompleted} tasks completed`,
    `${mostActiveAgent.emoji} ${mostActiveAgent.agentName} was most active with ${Math.floor(mostActiveAgent.activeTime / 60)}h of work`,
    `Total of ${totalCommits} commits pushed across all agents`,
    totalErrors > 5 ? `⚠️ ${totalErrors} errors occurred - review recommended` : `✅ Low error rate this week`,
  ];
  
  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    totalCommits,
    totalTasksCompleted,
    totalMessages,
    totalErrors,
    totalSessions,
    activeAgents: agentStats.filter(a => a.activeTime > 60).length,
    totalActiveTime,
    agentStats,
    dailyTrends,
    highlights,
    comparisonToPrevWeek: {
      commits: Math.floor(Math.random() * 40) - 20,
      tasksCompleted: Math.floor(Math.random() * 40) - 20,
      messages: Math.floor(Math.random() * 40) - 20,
      errors: Math.floor(Math.random() * 40) - 20,
    },
  };
}

export function useWeeklyReport(weekStart: Date) {
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['clawdbot', 'weekly-report', weekStartStr],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return generateMockWeeklyReport(weekStart);
      }
      // Real implementation would fetch from gateway/backend
      return null;
    },
    staleTime: 300000, // 5 minutes
  });
}

export function useMultiWeekReports(weeks: number = 4) {
  const now = new Date();
  const weekStarts: Date[] = [];
  
  for (let i = 0; i < weeks; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (date.getDay() + (i * 7))); // Start of each week (Sunday)
    weekStarts.push(date);
  }
  
  return useQuery({
    queryKey: ['clawdbot', 'multi-week-reports', weeks],
    queryFn: async () => {
      if (USE_MOCK_DATA) {
        return weekStarts.map(ws => generateMockWeeklyReport(ws));
      }
      return [];
    },
    staleTime: 300000,
  });
}

export function useAgentDetail(agentId: string) {
  const activityQuery = useClawdbotActivity(30);
  const sessionsQuery = useClawdbotSessions(30);
  
  const agent = CLAWDBOT_AGENTS.find(a => a.id === agentId);
  
  const agentActivity = activityQuery.data?.filter(a => a.agentId === agentId) ?? [];
  const agentSessions = sessionsQuery.data?.filter(s => s.agentId === agentId) ?? [];
  
  // Calculate metrics
  const last7Days = agentActivity.filter(a => {
    const actDate = new Date(a.timestamp);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return actDate >= weekAgo;
  });
  
  const commits = last7Days.filter(a => a.type === 'commit').length;
  const tasksCompleted = last7Days.filter(a => a.type === 'task_completed').length;
  const messagesProcessed = last7Days.filter(a => a.type === 'message').length;
  const errors = last7Days.filter(a => a.type === 'error').length;
  
  return {
    agent: agent ? {
      ...agent,
      status: Math.random() > 0.5 ? 'online' : 'offline',
    } as ClawdbotAgent : null,
    activity: agentActivity,
    sessions: agentSessions,
    metrics: {
      commits,
      tasksCompleted,
      messagesProcessed,
      errors,
      totalSessions: agentSessions.length,
      avgSessionDuration: agentSessions.length > 0
        ? Math.floor(agentSessions.reduce((sum, s) => {
            if (!s.endedAt) return sum;
            return sum + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
          }, 0) / agentSessions.length)
        : 0,
    },
    isLoading: activityQuery.isLoading || sessionsQuery.isLoading,
  };
}

export function useTodayProgress() {
  const activityQuery = useClawdbotActivity(1);
  
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = activityQuery.data?.filter(a => 
    a.timestamp.startsWith(today)
  ) ?? [];
  
  const tasksCompleted = todayActivity.filter(a => a.type === 'task_completed').length;
  const commits = todayActivity.filter(a => a.type === 'commit').length;
  const messages = todayActivity.filter(a => a.type === 'message').length;
  
  // Mock planned tasks for demo
  const plannedTasks = 12;
  const progress = Math.min(100, Math.round((tasksCompleted / plannedTasks) * 100));
  
  return {
    tasksCompleted,
    plannedTasks,
    progress,
    commits,
    messages,
    isLoading: activityQuery.isLoading,
    todayActivity,
  };
}

export function useRecentActivity(limit: number = 20) {
  const activityQuery = useClawdbotActivity(1);
  
  const recentActivity = activityQuery.data?.slice(0, limit) ?? [];
  
  return {
    activity: recentActivity,
    isLoading: activityQuery.isLoading,
  };
}

// Helper to get week number
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper to get start of week
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

// Helper to format week range
export function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}
