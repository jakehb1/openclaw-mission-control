"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Download, TrendingUp, AlertCircle, CheckCircle2, GitCommit, CalendarDays, BarChart3 } from "lucide-react";

import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";

import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { Button } from "@/components/ui/button";

import { Calendar } from "@/components/clawdbot/Calendar";
import { AgentCard } from "@/components/clawdbot/AgentCard";
import { ActivityFeed } from "@/components/clawdbot/ActivityFeed";
import { ProgressRing, ProgressBar } from "@/components/clawdbot/ProgressRing";
import { StatsCard, StatsRow } from "@/components/clawdbot/StatsCard";

import { useDailyReport, useClawdbotActivity } from "@/lib/use-clawdbot";
import { CLAWDBOT_AGENTS } from "@/lib/clawdbot-gateway";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dateStr = selectedDate.toISOString().split('T')[0];
  const reportQuery = useDailyReport(dateStr);
  const activityQuery = useClawdbotActivity(30);
  
  const report = reportQuery.data;
  
  // Filter activity for selected date
  const dayActivity = useMemo(() => {
    if (!activityQuery.data) return [];
    return activityQuery.data.filter(a => a.timestamp.startsWith(dateStr));
  }, [activityQuery.data, dateStr]);
  
  // Get dates with activity for highlighting
  const highlightedDates = useMemo(() => {
    if (!activityQuery.data) return [];
    const dateSet = new Set<string>();
    activityQuery.data.forEach(a => {
      dateSet.add(a.timestamp.split('T')[0]);
    });
    return Array.from(dateSet).map(d => new Date(d));
  }, [activityQuery.data]);
  
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  
  const formatDateHeader = (date: Date) => {
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleExportMarkdown = () => {
    if (!report) return;
    
    let md = `# Daily Report - ${formatDateHeader(selectedDate)}\n\n`;
    md += `## Summary\n${report.summary}\n\n`;
    md += `## Stats\n`;
    md += `- **Commits:** ${report.totalCommits}\n`;
    md += `- **Tasks Completed:** ${report.totalTasksCompleted}\n`;
    md += `- **Messages:** ${report.totalMessages}\n`;
    md += `- **Errors:** ${report.totalErrors}\n\n`;
    md += `## Agent Activity\n\n`;
    
    report.agents.forEach(agent => {
      md += `### ${agent.emoji} ${agent.agentName}\n`;
      md += `- Commits: ${agent.commits}\n`;
      md += `- Tasks: ${agent.tasksCompleted}\n`;
      md += `- Files Modified: ${agent.filesModified}\n`;
      md += `- Active Time: ${Math.floor(agent.activeTime / 60)}h ${agent.activeTime % 60}m\n`;
      if (agent.highlights.length > 0) {
        md += `- Highlights: ${agent.highlights.join(', ')}\n`;
      }
      md += '\n';
    });
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateStr}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel
          message="Sign in to view reports."
          forceRedirectUrl="/reports"
          signUpForceRedirectUrl="/reports"
        />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-[color:var(--bg-secondary)]">
          {/* Header */}
          <div className="border-b border-[color:var(--border-light)] bg-white px-8 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-[color:var(--text)] tracking-tight">
                  Reports
                </h2>
                <p className="mt-1 text-sm text-[color:var(--text-muted)]">
                  Track agent activity and performance over time
                </p>
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
            
            {/* View Toggle */}
            <div className="flex gap-2">
              <div className="flex rounded-lg bg-[color:var(--surface-muted)] p-1">
                <button
                  className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-[color:var(--text)] shadow-sm"
                >
                  <CalendarDays className="h-4 w-4" />
                  Daily
                </button>
                <Link
                  href="/reports/weekly"
                  className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[color:var(--text-muted)] transition hover:text-[color:var(--text)]"
                >
                  <BarChart3 className="h-4 w-4" />
                  Weekly
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
              {/* Left sidebar - Calendar */}
              <div className="space-y-6">
                <Calendar
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  highlightedDates={highlightedDates}
                  maxDate={new Date()}
                />
                
                {/* Quick stats for selected date */}
                {report && (
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-quiet)]">
                      Quick Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-xl bg-[color:var(--surface-muted)]">
                        <p className="text-2xl font-semibold text-[color:var(--text)]">{report.totalCommits}</p>
                        <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Commits</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-[color:var(--surface-muted)]">
                        <p className="text-2xl font-semibold text-[color:var(--text)]">{report.totalTasksCompleted}</p>
                        <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Tasks</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-[color:var(--surface-muted)]">
                        <p className="text-2xl font-semibold text-[color:var(--text)]">{report.totalMessages}</p>
                        <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Messages</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-[color:var(--surface-muted)]">
                        <p className="text-2xl font-semibold text-[color:var(--text)]">{report.totalErrors}</p>
                        <p className="text-[10px] text-[color:var(--text-quiet)] uppercase">Errors</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Main content - Report */}
              <div className="space-y-6">
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[color:var(--text)]">
                    {formatDateHeader(selectedDate)}
                  </h3>
                  {isToday && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Live
                    </span>
                  )}
                </div>
                
                {/* Summary card */}
                {report && (
                  <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[color:var(--text)]">Daily Summary</h4>
                        <p className="mt-2 text-sm text-[color:var(--text-muted)] leading-relaxed">
                          {report.summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Agent activity cards */}
                <div>
                  <h4 className="text-sm font-semibold text-[color:var(--text-muted)] mb-4">
                    Agent Activity
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {report?.agents.map((agentSummary) => {
                      const agent = CLAWDBOT_AGENTS.find(a => a.id === agentSummary.agentId);
                      if (!agent) return null;
                      
                      return (
                        <div
                          key={agentSummary.agentId}
                          className="rounded-2xl border border-[color:var(--border-light)] bg-white p-5 transition-all duration-200 hover:shadow-apple hover:border-[color:var(--accent)]"
                        >
                          {/* Agent header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--surface-muted)] text-xl">
                              {agentSummary.emoji}
                            </div>
                            <div>
                              <h5 className="font-semibold text-[color:var(--text)]">{agentSummary.agentName}</h5>
                              <p className="text-xs text-[color:var(--text-quiet)]">
                                {Math.floor(agentSummary.activeTime / 60)}h {agentSummary.activeTime % 60}m active
                              </p>
                            </div>
                          </div>
                          
                          {/* Metrics grid */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center p-2 rounded-lg bg-[color:var(--surface-muted)]">
                              <p className="text-lg font-semibold text-[color:var(--text)]">{agentSummary.commits}</p>
                              <p className="text-[10px] text-[color:var(--text-quiet)]">Commits</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-[color:var(--surface-muted)]">
                              <p className="text-lg font-semibold text-[color:var(--text)]">{agentSummary.tasksCompleted}</p>
                              <p className="text-[10px] text-[color:var(--text-quiet)]">Tasks</p>
                            </div>
                            <div className="text-center p-2 rounded-lg bg-[color:var(--surface-muted)]">
                              <p className="text-lg font-semibold text-[color:var(--text)]">{agentSummary.filesModified}</p>
                              <p className="text-[10px] text-[color:var(--text-quiet)]">Files</p>
                            </div>
                          </div>
                          
                          {/* Highlights */}
                          {agentSummary.highlights.length > 0 && (
                            <div className="pt-3 border-t border-[color:var(--border-light)]">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-quiet)] mb-2">
                                Highlights
                              </p>
                              {agentSummary.highlights.map((highlight, i) => (
                                <p key={i} className="text-xs text-[color:var(--text-muted)] flex items-center gap-1.5 mb-1">
                                  <span className="text-green-500">✓</span>
                                  {highlight}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {/* Errors warning */}
                          {agentSummary.errors > 0 && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span className="text-xs text-red-700">{agentSummary.errors} error{agentSummary.errors > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Activity timeline */}
                <div className="rounded-2xl border border-[color:var(--border-light)] bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-[color:var(--text)]">Activity Timeline</h4>
                    <span className="text-xs text-[color:var(--text-quiet)]">{dayActivity.length} events</span>
                  </div>
                  <ActivityFeed activities={dayActivity} maxItems={30} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
