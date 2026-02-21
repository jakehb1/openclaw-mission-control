"use client";

import Link from "next/link";
import { ClawdbotAgent } from "@/lib/clawdbot-gateway";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: ClawdbotAgent;
  showDetails?: boolean;
  metrics?: {
    commits?: number;
    tasksCompleted?: number;
    messagesProcessed?: number;
  };
  className?: string;
}

export function AgentCard({ agent, showDetails = false, metrics, className }: AgentCardProps) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-300",
    busy: "bg-orange-500",
    idle: "bg-blue-400",
  };

  const statusLabels = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    idle: "Idle",
  };

  return (
    <Link
      href={`/agents/${agent.id}`}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-[color:var(--border-light)] bg-white p-5",
        "transition-all duration-300 ease-apple",
        "hover:border-[color:var(--accent)] hover:shadow-apple-lg hover:-translate-y-1",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--surface-muted)] to-[color:var(--surface-strong)] text-2xl shadow-sm">
            {agent.emoji}
          </div>
          <div>
            <h3 className="font-semibold text-[color:var(--text)] text-[15px] tracking-tight">
              {agent.name}
            </h3>
            <p className="text-xs text-[color:var(--text-quiet)] mt-0.5">
              Agent
            </p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statusColors[agent.status],
              agent.status === "online" && "animate-pulse-glow"
            )}
          />
          <span className="text-xs font-medium text-[color:var(--text-muted)]">
            {statusLabels[agent.status]}
          </span>
        </div>
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <div className="mb-4 rounded-lg bg-[color:var(--surface-muted)] px-3 py-2">
          <p className="text-xs font-medium text-[color:var(--text-quiet)] mb-0.5">Current Task</p>
          <p className="text-sm text-[color:var(--text)] line-clamp-1">
            {agent.currentTask}
          </p>
        </div>
      )}

      {/* Metrics (optional) */}
      {showDetails && metrics && (
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[color:var(--border-light)]">
          <div className="text-center">
            <p className="text-lg font-semibold text-[color:var(--text)]">
              {metrics.commits ?? 0}
            </p>
            <p className="text-[10px] text-[color:var(--text-quiet)] uppercase tracking-wide">
              Commits
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[color:var(--text)]">
              {metrics.tasksCompleted ?? 0}
            </p>
            <p className="text-[10px] text-[color:var(--text-quiet)] uppercase tracking-wide">
              Tasks
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[color:var(--text)]">
              {metrics.messagesProcessed ?? 0}
            </p>
            <p className="text-[10px] text-[color:var(--text-quiet)] uppercase tracking-wide">
              Messages
            </p>
          </div>
        </div>
      )}

      {/* Last seen */}
      {agent.lastSeen && (
        <p className="text-xs text-[color:var(--text-quiet)] mt-3 pt-3 border-t border-[color:var(--border-light)]">
          Last seen {formatRelativeTime(agent.lastSeen)}
        </p>
      )}

      {/* Hover arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <svg className="h-5 w-5 text-[color:var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export function AgentCardCompact({ agent, className }: { agent: ClawdbotAgent; className?: string }) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-300",
    busy: "bg-orange-500",
    idle: "bg-blue-400",
  };

  return (
    <Link
      href={`/agents/${agent.id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-[color:var(--border-light)] bg-white px-4 py-3",
        "transition-all duration-200 hover:border-[color:var(--accent)] hover:shadow-sm",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--surface-muted)] text-xl">
        {agent.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[color:var(--text)] truncate">
          {agent.name}
        </p>
        {agent.currentTask && (
          <p className="text-xs text-[color:var(--text-quiet)] truncate">
            {agent.currentTask}
          </p>
        )}
      </div>
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          statusColors[agent.status],
          agent.status === "online" && "animate-pulse-glow"
        )}
      />
    </Link>
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
