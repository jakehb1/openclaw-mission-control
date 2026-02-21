"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  Download, 
  GitCommit, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
} from "lucide-react";

import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { Button } from "@/components/ui/button";

import { ProgressRing, ProgressBar } from "@/components/clawdbot/ProgressRing";
import { StatsCard } from "@/components/clawdbot/StatsCard";
import { TrendChart, BarChart, ComparisonBadge, SparkLine } from "@/components/clawdbot/TrendChart";

import { useWeeklyReport, useMultiWeekReports, getWeekStart, formatWeekRange } from "@/lib/use-clawdbot";
import { CLAWDBOT_AGENTS } from "@/lib/clawdbot-gateway";
import { cn } from "@/lib/utils";

export default function WeeklyReportsPage() {
  const { isSignedIn } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Calculate week start date
  const weekStart = useMemo(() => {
    const today = new Date();
    const start = getWeekStart(today);
    start.setDate(start.getDate() - (weekOffset * 7));
    return start;
  }, [weekOffset]);
  
  const isCurrentWeek = weekOffset === 0;
  
  const reportQuery = useWeeklyReport(weekStart);
  const multiWeekQuery = useMultiWeekReports(8);
  
  const report = reportQuery.data;
  const weeklyReports = multiWeekQuery.data ?? [];
  
  // Calculate week-over-week trends from multiweek data
  const weeklyTrends = useMemo(() => {
    if (weeklyReports.length === 0) return null;
    
    return {
      commits: weeklyReports.map(r => ({ label: formatWeekRange(new Date(r.weekStart)).split(' ')[0], value: r.totalCommits })).reverse(),
      tasks: weeklyReports.map(r => ({ label: formatWeekRange(new Date(r.weekStart)).split(' ')[0], value: r.totalTasksCompleted })).reverse(),
      messages: weeklyReports.map(r => ({ label: formatWeekRange(new Date(r.weekStart)).split(' ')[0], value: r.totalMessages })).reverse(),
      errors: weeklyReports.map(r => ({ label: formatWeekRange(new Date(r.weekStart)).split(' ')[0], value: r.totalErrors })).reverse(),
    };
  }, [weeklyReports]);

  const handlePrevWeek = () => setWeekOffset(prev => prev + 1);
  const handleNextWeek = () => setWeekOffset(prev => Math.max(0, prev - 1));
  
  const handleExportMarkdown = () => {
    if (!report) return;
    
    let md = `# Weekly Report - ${formatWeekRange(new Date(report.weekStart))}\n\n`;
    md += `## Summary\n`;
    md += `- **Commits:** ${report.totalCommits}`;
    if (report.comparisonToPrevWeek.commits !== 0) {
      md += ` (${report.comparisonToPrevWeek.commits > 0 ? '+' : ''}${report.comparisonToPrevWeek.commits}% vs prev week)`;
    }
    md += `\n`;
    md += `- **Tasks Completed:** ${report.totalTasksCompleted}\n`;
    md += `- **Messages:** ${report.totalMessages}\n`;
    md += `- **Errors:** ${report.totalErrors}\n`;
    md += `- **Total Sessions:** ${report.totalSessions}\n`;
    md += `- **Active Agents:** ${report.activeAgents}\n\n`;
    
    md += `## Highlights\n`;
    report.highlights.forEach(h => {
      md += `- ${h}\n`;
    });
    md += `\n`;
    
    md += `## Agent Performance\n\n`;
    report.agentStats.forEach(agent => {
      md += `### ${agent.emoji} ${agent.agentName}\n`;
      md += `- Commits: ${agent.commits}\n`;
      md += `- Tasks: ${agent.tasksCompleted}\n`;
      md += `- Messages: ${agent.messagesProcessed}\n`;
      md += `- Active Time: ${Math.floor(agent.activeTime / 60)}h ${agent.activeTime % 60}m\n`;
      md += `- Sessions: ${agent.sessions}\n\n`;
    });
    
    md += `## Daily Breakdown\n\n`;
    md += `| Date | Commits | Tasks | Messages | Errors |\n`;
    md += `|------|---------|-------|----------|--------|\n`;
    report.dailyTrends.forEach(day => {
      md += `| ${day.date} | ${day.commits} | ${day.tasksCompleted} | ${day.messages} | ${day.errors} |\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${report.weekStart}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel
          message="Sign in to view reports."
          forceRedirectUrl="/reports/weekly"
          signUpForceRedirectUrl="/reports/weekly"
        />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-[color:var(--bg-secondary)]">
          {/* Header */}
          <div className="border-b border-[color:var(--border-light)] bg-white px-8 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/reports"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)]"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-[color:var(--text)] tracking-tight">
                    Weekly Report
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                    Aggregated metrics and trends for the week
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportMarkdown}
                  disabled={!report}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Week navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevWeek}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-[color:var(--text-muted)] transition hover:bg-white hover:shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous Week
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-[color:var(--text)]">
                  {report ? formatWeekRange(new Date(report.weekStart)) : 'Loading...'}
                </h3>
                {isCurrentWeek && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 mt-1">
                    Current Week
                  </span>
                )}
              </div>
              
              <button
                onClick={handleNextWeek}
                disabled={isCurrentWeek}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                  isCurrentWeek
                    ? "text-[color:var(--text-quiet)] cursor-not-allowed"
                    : "text-[color:var(--text-muted)] hover:bg-white hover:shadow-sm"
                )}
              >
                Next Week
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            
            {report && (
              <>
                {/* Key metrics with comparison */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <StatsCard
                    title="Commits"
                    value={report.totalCommits}
                    icon={<GitCommit className="h-5 w-5" />}
                    color="purple"
                    trend={report.comparisonToPrevWeek.commits !== 0 ? {
                      value: report.comparisonToPrevWeek.commits,
                      label: "vs last week",
                      isPositive: report.comparisonToPrevWeek.commits > 0,
                    } : undefined}
                  />
                  <StatsCard
                    title="Tasks Completed"
                    value={report.totalTasksCompleted}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    color="green"
                    trend={report.comparisonToPrevWeek.tasksCompleted !== 0 ? {
                      value: report.comparisonToPrevWeek.tasksCompleted,
                      label: "vs last week",
                      isPositive: report.comparisonToPrevWeek.tasksCompleted > 0,
                    } : undefined}
                  />
                  <StatsCard
                    title="Messages"
                    value={report.totalMessages}
                    icon={<MessageSquare className="h-5 w-5" />}
                    color="blue"
                    trend={report.comparisonToPrevWeek.messages !== 0 ? {
                      value: report.comparisonToPrevWeek.messages,
                      label: "vs last week",
                      isPositive: report.comparisonToPrevWeek.messages > 0,
                    } : undefined}
                  />
                  <StatsCard
                    title="Errors"
                    value={report.totalErrors}
                    icon={<AlertCircle className="h-5 w-5" />}
                    color={report.totalErrors > 10 ? "red" : "gray"}
                    trend={report.comparisonToPrevWeek.errors !== 0 ? {
                      value: report.comparisonToPrevWeek.errors,
                      label: "vs last week",
                      isPositive: report.comparisonToPrevWeek.errors < 0, // Fewer errors is good
                    } : undefined}
                  />
                </div>
                
                {/* Highlights */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6 mb-8">
                  <h4 className="text-sm font-semibold text-[color:var(--text)] mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[color:var(--accent)]" />
                    Weekly Highlights
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {report.highlights.map((highlight, i) => (
                      <div 
                        key={i}
                        className="flex items-start gap-3 rounded-xl bg-[color:var(--surface-muted)] px-4 py-3"
                      >
                        <span className="text-lg">{highlight.startsWith('⚠️') || highlight.startsWith('✅') ? '' : '✨'}</span>
                        <p className="text-sm text-[color:var(--text)]">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Trend Charts */}
                <div className="grid gap-6 lg:grid-cols-2 mb-8">
                  {/* Daily breakdown chart */}
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                    <h4 className="text-sm font-semibold text-[color:var(--text)] mb-4">
                      Daily Commits & Tasks
                    </h4>
                    <BarChart
                      data={report.dailyTrends.map(d => ({ 
                        label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: d.commits + d.tasksCompleted
                      }))}
                      height={180}
                      color="purple"
                    />
                  </div>
                  
                  {/* Messages trend */}
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                    <h4 className="text-sm font-semibold text-[color:var(--text)] mb-4">
                      Messages Processed
                    </h4>
                    <TrendChart
                      data={report.dailyTrends.map(d => ({ 
                        label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        value: d.messages
                      }))}
                      height={180}
                      color="blue"
                    />
                  </div>
                </div>
                
                {/* Multi-week trends */}
                {weeklyTrends && (
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6 mb-8">
                    <h4 className="text-sm font-semibold text-[color:var(--text)] mb-6">
                      8-Week Trend
                    </h4>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-[color:var(--text-quiet)] uppercase mb-2">Commits</p>
                        <TrendChart data={weeklyTrends.commits} height={80} color="purple" showLabels={false} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[color:var(--text-quiet)] uppercase mb-2">Tasks</p>
                        <TrendChart data={weeklyTrends.tasks} height={80} color="green" showLabels={false} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[color:var(--text-quiet)] uppercase mb-2">Messages</p>
                        <TrendChart data={weeklyTrends.messages} height={80} color="blue" showLabels={false} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[color:var(--text-quiet)] uppercase mb-2">Errors</p>
                        <TrendChart data={weeklyTrends.errors} height={80} color="red" showLabels={false} />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Agent performance table */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white overflow-hidden">
                  <div className="px-6 py-4 border-b border-[color:var(--border-light)]">
                    <h4 className="text-sm font-semibold text-[color:var(--text)] flex items-center gap-2">
                      <Users className="h-4 w-4 text-[color:var(--text-muted)]" />
                      Agent Performance
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[color:var(--border-light)] bg-[color:var(--surface-muted)]">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Agent
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Commits
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Tasks
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Messages
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Active Time
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Sessions
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                            Errors
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[color:var(--border-light)]">
                        {report.agentStats
                          .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
                          .map((agent, index) => (
                            <tr 
                              key={agent.agentId}
                              className="hover:bg-[color:var(--surface-muted)] transition-colors"
                            >
                              <td className="px-6 py-4">
                                <Link
                                  href={`/agents/${agent.agentId}`}
                                  className="flex items-center gap-3 hover:text-[color:var(--accent)]"
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-muted)] text-lg">
                                    {agent.emoji}
                                  </div>
                                  <div>
                                    <p className="font-medium text-[color:var(--text)]">
                                      {agent.agentName}
                                    </p>
                                    {index === 0 && (
                                      <span className="text-[10px] text-[color:var(--accent)] font-medium">
                                        Top Performer
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-semibold text-[color:var(--text)]">{agent.commits}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-semibold text-[color:var(--text)]">{agent.tasksCompleted}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="font-semibold text-[color:var(--text)]">{agent.messagesProcessed}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm text-[color:var(--text-muted)]">
                                  {Math.floor(agent.activeTime / 60)}h {agent.activeTime % 60}m
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm text-[color:var(--text-muted)]">{agent.sessions}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {agent.errors > 0 ? (
                                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                    {agent.errors}
                                  </span>
                                ) : (
                                  <span className="text-sm text-[color:var(--text-quiet)]">0</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            
            {reportQuery.isLoading && (
              <div className="flex items-center justify-center py-20">
                <p className="text-[color:var(--text-muted)]">Loading weekly report...</p>
              </div>
            )}
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
