/**
 * Clawdbot Gateway API Client
 * Connects to the local Clawdbot Gateway for real-time agent data
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_TOKEN || '';

export interface ClawdbotAgent {
  id: string;
  name: string;
  emoji: string;
  status: 'online' | 'offline' | 'busy' | 'idle';
  currentTask?: string;
  lastSeen?: string;
  sessionId?: string;
  workspace?: string;
}

export interface ClawdbotSession {
  id: string;
  agentId: string;
  agentName: string;
  channel: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  status: 'active' | 'completed' | 'error';
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  type: 'message' | 'task_completed' | 'commit' | 'file_created' | 'file_modified' | 'error' | 'spawn';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DailyReport {
  date: string;
  agents: AgentDailySummary[];
  totalCommits: number;
  totalTasksCompleted: number;
  totalMessages: number;
  totalErrors: number;
  summary: string;
}

export interface AgentDailySummary {
  agentId: string;
  agentName: string;
  emoji: string;
  commits: number;
  tasksCompleted: number;
  filesModified: number;
  messagesProcessed: number;
  errors: number;
  activeTime: number; // minutes
  sessions: number;
  highlights: string[];
}

export interface GatewayHealth {
  ok: boolean;
  version: string;
  uptime: number;
  linkedChannels: string[];
  connectedAgents: number;
}

// Jake's actual Clawdbot agents
export const CLAWDBOT_AGENTS: ClawdbotAgent[] = [
  { id: 'main', name: 'Main', emoji: '🤖', status: 'offline' },
  { id: 'forge', name: 'Forge', emoji: '⚒️', status: 'offline' },
  { id: 'scribe', name: 'Scribe', emoji: '✍️', status: 'offline' },
  { id: 'scout', name: 'Scout', emoji: '🔭', status: 'offline' },
  { id: 'sentinel', name: 'Sentinel', emoji: '🛡️', status: 'offline' },
  { id: 'archive', name: 'Archive', emoji: '📚', status: 'offline' },
];

class ClawdbotGatewayClient {
  private ws: WebSocket | null = null;
  private connectionPromise: Promise<void> | null = null;
  private messageId = 0;
  private pendingRequests: Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private eventListeners: Map<string, Set<(payload: unknown) => void>> = new Map();

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(GATEWAY_URL.replace('http', 'ws'));
        
        this.ws.onopen = () => {
          // Send connect handshake
          const connectMsg = {
            type: 'req',
            id: `msg_${++this.messageId}`,
            method: 'connect',
            params: {
              minProtocol: 1,
              maxProtocol: 1,
              client: {
                id: 'mission-control',
                displayName: 'Mission Control',
                version: '1.0.0',
                platform: 'web',
                mode: 'dashboard',
              },
              auth: GATEWAY_TOKEN ? { token: GATEWAY_TOKEN } : undefined,
            },
          };
          this.ws?.send(JSON.stringify(connectMsg));
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'res') {
              const pending = this.pendingRequests.get(data.id);
              if (pending) {
                if (data.ok) {
                  pending.resolve(data.payload);
                } else {
                  pending.reject(new Error(data.error?.message || 'Request failed'));
                }
                this.pendingRequests.delete(data.id);
              }
              
              // Handle connect response
              if (data.payload?.type === 'hello-ok') {
                resolve();
              }
            } else if (data.type === 'event') {
              const listeners = this.eventListeners.get(data.event);
              listeners?.forEach(listener => listener(data.payload));
            }
          } catch (e) {
            console.error('Failed to parse gateway message:', e);
          }
        };

        this.ws.onerror = (error) => {
          console.error('Gateway WebSocket error:', error);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          this.ws = null;
          this.connectionPromise = null;
        };

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      } catch (error) {
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private async request<T>(method: string, params?: Record<string, unknown>): Promise<T> {
    await this.connect();
    
    return new Promise((resolve, reject) => {
      const id = `msg_${++this.messageId}`;
      this.pendingRequests.set(id, { resolve: resolve as (value: unknown) => void, reject });
      
      const msg = { type: 'req', id, method, params };
      this.ws?.send(JSON.stringify(msg));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  on(event: string, listener: (payload: unknown) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(listener);
    
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  async getHealth(): Promise<GatewayHealth> {
    try {
      const response = await this.request<{
        ok: boolean;
        version?: string;
        uptimeMs?: number;
        linkedChannels?: string[];
      }>('health');
      
      return {
        ok: response.ok,
        version: response.version || 'unknown',
        uptime: Math.floor((response.uptimeMs || 0) / 1000),
        linkedChannels: response.linkedChannels || [],
        connectedAgents: 0,
      };
    } catch {
      return {
        ok: false,
        version: 'unknown',
        uptime: 0,
        linkedChannels: [],
        connectedAgents: 0,
      };
    }
  }

  async getStatus(): Promise<{ status: string; presence?: unknown[] }> {
    try {
      return await this.request('status');
    } catch {
      return { status: 'disconnected' };
    }
  }

  async getPresence(): Promise<unknown[]> {
    try {
      const response = await this.request<{ entries?: unknown[] }>('system-presence');
      return response.entries || [];
    } catch {
      return [];
    }
  }

  async getSessions(): Promise<{
    count: number;
    sessions: Array<{
      key: string;
      kind: string;
      channel?: string;
      label?: string;
      displayName?: string;
      updatedAt: number;
      model?: string;
      totalTokens?: number;
    }>;
  }> {
    try {
      const response = await this.request<{
        count: number;
        sessions: Array<{
          key: string;
          kind: string;
          channel?: string;
          label?: string;
          displayName?: string;
          updatedAt: number;
          model?: string;
          totalTokens?: number;
        }>;
      }>('sessions.list', { limit: 50 });
      return response;
    } catch {
      return { count: 0, sessions: [] };
    }
  }

  async getAgents(): Promise<{
    agents: Array<{
      id: string;
      name?: string;
      configured: boolean;
    }>;
  }> {
    try {
      const response = await this.request<{
        agents: Array<{
          id: string;
          name?: string;
          configured: boolean;
        }>;
      }>('agents.list', {});
      return response;
    } catch {
      return { agents: [] };
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.connectionPromise = null;
  }
}

// Singleton instance
export const gatewayClient = new ClawdbotGatewayClient();

// Check if gateway is reachable via our proxy API (avoids CORS)
export async function fetchGatewayHealth(): Promise<GatewayHealth> {
  try {
    const response = await fetch('/api/gateway/health');
    const data = await response.json();
    return {
      ok: data.ok ?? false,
      version: data.version || 'unknown',
      uptime: data.uptime || 0,
      linkedChannels: data.linkedChannels || [],
      connectedAgents: data.connectedAgents || 0,
    };
  } catch {
    return {
      ok: false,
      version: 'unknown',
      uptime: 0,
      linkedChannels: [],
      connectedAgents: 0,
    };
  }
}

// Generate mock data for development/demo
export function generateMockActivity(days: number = 7): AgentActivity[] {
  const activities: AgentActivity[] = [];
  const now = new Date();
  
  const activityTypes: AgentActivity['type'][] = ['message', 'task_completed', 'commit', 'file_created', 'file_modified', 'spawn'];
  const descriptions: Record<string, string[]> = {
    message: ['Processed user request', 'Responded to query', 'Handled conversation'],
    task_completed: ['Completed code review', 'Finished data analysis', 'Generated report'],
    commit: ['Committed changes to repository', 'Pushed feature branch', 'Merged pull request'],
    file_created: ['Created new component', 'Added configuration file', 'Generated documentation'],
    file_modified: ['Updated styles', 'Refactored function', 'Fixed bug in module'],
    spawn: ['Spawned sub-agent for research', 'Delegated task to specialist', 'Created worker agent'],
  };

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    
    // Generate 10-30 activities per day
    const activityCount = Math.floor(Math.random() * 20) + 10;
    
    for (let i = 0; i < activityCount; i++) {
      const agent = CLAWDBOT_AGENTS[Math.floor(Math.random() * CLAWDBOT_AGENTS.length)];
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const descList = descriptions[type];
      
      const activityDate = new Date(date);
      activityDate.setHours(Math.floor(Math.random() * 14) + 8); // 8am - 10pm
      activityDate.setMinutes(Math.floor(Math.random() * 60));
      
      activities.push({
        id: `activity_${d}_${i}`,
        agentId: agent.id,
        agentName: agent.name,
        type,
        description: descList[Math.floor(Math.random() * descList.length)],
        timestamp: activityDate.toISOString(),
      });
    }
  }
  
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function generateMockDailyReport(date: string): DailyReport {
  const agents: AgentDailySummary[] = CLAWDBOT_AGENTS.map(agent => {
    const commits = Math.floor(Math.random() * 15);
    const tasksCompleted = Math.floor(Math.random() * 10);
    const filesModified = Math.floor(Math.random() * 25);
    const messagesProcessed = Math.floor(Math.random() * 50);
    const errors = Math.floor(Math.random() * 3);
    
    const highlights: string[] = [];
    if (commits > 10) highlights.push(`${commits} commits pushed`);
    if (tasksCompleted > 5) highlights.push(`Completed ${tasksCompleted} tasks`);
    if (filesModified > 15) highlights.push(`Modified ${filesModified} files`);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      commits,
      tasksCompleted,
      filesModified,
      messagesProcessed,
      errors,
      activeTime: Math.floor(Math.random() * 480) + 60, // 1-9 hours in minutes
      sessions: Math.floor(Math.random() * 8) + 1,
      highlights,
    };
  });

  const totalCommits = agents.reduce((sum, a) => sum + a.commits, 0);
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const totalMessages = agents.reduce((sum, a) => sum + a.messagesProcessed, 0);
  const totalErrors = agents.reduce((sum, a) => sum + a.errors, 0);

  const topAgent = agents.reduce((top, a) => a.tasksCompleted > top.tasksCompleted ? a : top, agents[0]);
  
  return {
    date,
    agents,
    totalCommits,
    totalTasksCompleted,
    totalMessages,
    totalErrors,
    summary: `Today was productive with ${totalCommits} commits and ${totalTasksCompleted} tasks completed across all agents. ${topAgent.emoji} ${topAgent.agentName} led the way with ${topAgent.tasksCompleted} tasks completed.${totalErrors > 0 ? ` There were ${totalErrors} errors to review.` : ''}`,
  };
}

export function generateMockSessions(days: number = 7): ClawdbotSession[] {
  const sessions: ClawdbotSession[] = [];
  const now = new Date();
  const channels = ['telegram', 'discord', 'webchat', 'whatsapp', 'slack'];
  
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    
    // 3-8 sessions per day
    const sessionCount = Math.floor(Math.random() * 5) + 3;
    
    for (let i = 0; i < sessionCount; i++) {
      const agent = CLAWDBOT_AGENTS[Math.floor(Math.random() * CLAWDBOT_AGENTS.length)];
      const startDate = new Date(date);
      startDate.setHours(Math.floor(Math.random() * 12) + 8);
      startDate.setMinutes(Math.floor(Math.random() * 60));
      
      const duration = Math.floor(Math.random() * 120) + 10; // 10-130 minutes
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      sessions.push({
        id: `session_${d}_${i}`,
        agentId: agent.id,
        agentName: `${agent.emoji} ${agent.name}`,
        channel: channels[Math.floor(Math.random() * channels.length)],
        startedAt: startDate.toISOString(),
        endedAt: d === 0 && i === 0 ? undefined : endDate.toISOString(),
        messageCount: Math.floor(Math.random() * 50) + 5,
        status: d === 0 && i === 0 ? 'active' : (Math.random() > 0.9 ? 'error' : 'completed'),
      });
    }
  }
  
  return sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}
