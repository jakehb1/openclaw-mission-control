"use client";

import { AgentActivity, CLAWDBOT_AGENTS } from "@/lib/clawdbot-gateway";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: AgentActivity[];
  showAgentName?: boolean;
  maxItems?: number;
  className?: string;
}

const activityIcons: Record<AgentActivity['type'], { icon: string; color: string; bg: string }> = {
  message: { icon: "💬", color: "text-blue-600", bg: "bg-blue-50" },
  task_completed: { icon: "✅", color: "text-green-600", bg: "bg-green-50" },
  commit: { icon: "📝", color: "text-purple-600", bg: "bg-purple-50" },
  file_created: { icon: "📄", color: "text-teal-600", bg: "bg-teal-50" },
  file_modified: { icon: "✏️", color: "text-orange-600", bg: "bg-orange-50" },
  error: { icon: "⚠️", color: "text-red-600", bg: "bg-red-50" },
  spawn: { icon: "🔀", color: "text-indigo-600", bg: "bg-indigo-50" },
};

const activityLabels: Record<AgentActivity['type'], string> = {
  message: "Message",
  task_completed: "Task Completed",
  commit: "Commit",
  file_created: "File Created",
  file_modified: "File Modified",
  error: "Error",
  spawn: "Agent Spawn",
};

export function ActivityFeed({ activities, showAgentName = true, maxItems = 20, className }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  if (displayedActivities.length === 0) {
    return (
      <div className={cn("rounded-xl border border-dashed border-[color:var(--border)] p-8 text-center", className)}>
        <p className="text-sm text-[color:var(--text-muted)]">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {displayedActivities.map((activity, index) => (
        <ActivityItem 
          key={activity.id} 
          activity={activity} 
          showAgentName={showAgentName}
          isLast={index === displayedActivities.length - 1}
        />
      ))}
    </div>
  );
}

function ActivityItem({ 
  activity, 
  showAgentName,
  isLast 
}: { 
  activity: AgentActivity; 
  showAgentName: boolean;
  isLast: boolean;
}) {
  const { icon, bg } = activityIcons[activity.type];
  const agent = CLAWDBOT_AGENTS.find(a => a.id === activity.agentId);
  
  return (
    <div className="group flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[color:var(--surface-muted)]">
      {/* Icon */}
      <div className={cn(
        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-base",
        bg
      )}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {showAgentName && agent && (
              <span className="text-xs font-medium text-[color:var(--text-muted)]">
                {agent.emoji} {agent.name}
              </span>
            )}
            <p className="text-sm text-[color:var(--text)] truncate">
              {activity.description}
            </p>
          </div>
          <span className="text-xs text-[color:var(--text-quiet)] whitespace-nowrap flex-shrink-0">
            {formatTime(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs text-[color:var(--text-quiet)] mt-0.5">
          {activityLabels[activity.type]}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeedCompact({ activities, maxItems = 5, className }: Omit<ActivityFeedProps, 'showAgentName'>) {
  const displayedActivities = activities.slice(0, maxItems);
  
  return (
    <div className={cn("space-y-1", className)}>
      {displayedActivities.map((activity) => {
        const { icon } = activityIcons[activity.type];
        const agent = CLAWDBOT_AGENTS.find(a => a.id === activity.agentId);
        
        return (
          <div 
            key={activity.id}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[color:var(--surface-muted)]"
          >
            <span className="text-sm">{icon}</span>
            <span className="text-xs text-[color:var(--text-quiet)]">{agent?.emoji}</span>
            <span className="flex-1 truncate text-[color:var(--text)]">{activity.description}</span>
            <span className="text-xs text-[color:var(--text-quiet)]">{formatTime(activity.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
