"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedIn } from "@/auth/clerk";
import { Activity, Bot, MessageSquare, Terminal, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveEvent {
  id: string;
  type: 'message' | 'exec' | 'tool' | 'session' | 'system';
  agent?: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const AGENT_COLORS: Record<string, string> = {
  'echo': 'bg-purple-500',
  'forge': 'bg-orange-500',
  'scribe': 'bg-blue-500',
  'scout': 'bg-green-500',
  'sentinel': 'bg-red-500',
  'archive': 'bg-amber-500',
  'main': 'bg-slate-500',
};

const AGENT_EMOJIS: Record<string, string> = {
  'echo': '🔮',
  'forge': '⚒️',
  'scribe': '✍️',
  'scout': '🔭',
  'sentinel': '🛡️',
  'archive': '📚',
  'main': '🤖',
};

function EventIcon({ type }: { type: string }) {
  switch (type) {
    case 'message': return <MessageSquare className="w-4 h-4" />;
    case 'exec': return <Terminal className="w-4 h-4" />;
    case 'tool': return <Zap className="w-4 h-4" />;
    case 'session': return <Bot className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
}

function LiveEventCard({ event }: { event: LiveEvent }) {
  const agentColor = event.agent ? AGENT_COLORS[event.agent] || 'bg-slate-500' : 'bg-slate-400';
  const agentEmoji = event.agent ? AGENT_EMOJIS[event.agent] || '🤖' : '⚙️';
  
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-lg", agentColor)}>
        {agentEmoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900 capitalize">{event.agent || 'System'}</span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <EventIcon type={event.type} />
            {event.type}
          </span>
          <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {event.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-600 truncate">{event.content}</p>
      </div>
    </div>
  );
}

export default function LiveFeedPage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const eventIdRef = useRef(0);

  useEffect(() => {
    // Generate some mock events for demo
    const mockEvents: LiveEvent[] = [
      { id: '1', type: 'session', agent: 'main', content: 'Session started with Jake B', timestamp: new Date(Date.now() - 300000) },
      { id: '2', type: 'message', agent: 'echo', content: 'Processing user request...', timestamp: new Date(Date.now() - 240000) },
      { id: '3', type: 'tool', agent: 'forge', content: 'Called exec: npm run build', timestamp: new Date(Date.now() - 180000) },
      { id: '4', type: 'exec', agent: 'forge', content: 'Build completed successfully', timestamp: new Date(Date.now() - 120000) },
      { id: '5', type: 'message', agent: 'scribe', content: 'Updated documentation files', timestamp: new Date(Date.now() - 60000) },
      { id: '6', type: 'system', content: 'Daily report cron job scheduled for 23:00 HST', timestamp: new Date() },
    ];
    setEvents(mockEvents);
    setConnected(true);

    // In production, connect to gateway WebSocket
    const gatewayUrl = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL;
    if (gatewayUrl) {
      try {
        const wsUrl = gatewayUrl.replace('http', 'ws') + '/ws';
        // WebSocket connection would go here
        // wsRef.current = new WebSocket(wsUrl);
      } catch (err) {
        console.error('WebSocket connection failed:', err);
      }
    }

    // Simulate live events
    const interval = setInterval(() => {
      const agents = ['echo', 'forge', 'scribe', 'scout', 'sentinel', 'archive'];
      const types: LiveEvent['type'][] = ['message', 'exec', 'tool', 'session'];
      const messages = [
        'Processing request...',
        'Executing command...',
        'Analyzing data...',
        'Writing to file...',
        'Fetching from API...',
        'Compiling code...',
        'Running tests...',
        'Generating report...',
      ];
      
      const newEvent: LiveEvent = {
        id: String(++eventIdRef.current),
        type: types[Math.floor(Math.random() * types.length)],
        agent: agents[Math.floor(Math.random() * agents.length)],
        content: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date(),
      };
      
      setEvents(prev => [newEvent, ...prev].slice(0, 50));
    }, 5000);

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, []);

  return (
    <SignedIn>
      <DashboardSidebar />
      <DashboardShell>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Live Feed</h1>
              <p className="text-slate-500 text-sm">Real-time activity from your agents</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-sm text-slate-500">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {events.map(event => (
              <LiveEventCard key={event.id} event={event} />
            ))}
            {events.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No activity yet. Events will appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>
      </DashboardShell>
    </SignedIn>
  );
}
