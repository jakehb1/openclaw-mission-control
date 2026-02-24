import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface Activity {
  id: string;
  agentId: string;
  agentName: string;
  type: 'message' | 'task_completed' | 'commit' | 'file_created' | 'file_modified' | 'error' | 'spawn';
  description: string;
  timestamp: string;
  channel?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '7', 10);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  
  try {
    const clawdbotDir = join(homedir(), '.clawdbot', 'agents');
    const activities: Activity[] = [];
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    
    const agentDirs = await readdir(clawdbotDir).catch(() => []);
    
    for (const agentId of agentDirs) {
      const sessionsDir = join(clawdbotDir, agentId, 'sessions');
      
      try {
        const sessionFiles = await readdir(sessionsDir);
        
        for (const file of sessionFiles) {
          if (!file.endsWith('.jsonl')) continue;
          
          const filePath = join(sessionsDir, file);
          const content = await readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              const ts = entry.ts ? new Date(entry.ts).getTime() : 0;
              
              if (ts < cutoff) continue;
              
              const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);
              
              if (entry.role === 'user') {
                activities.push({
                  id: `${file}-${ts}-user`,
                  agentId,
                  agentName,
                  type: 'message',
                  description: truncate(entry.content || 'User message', 100),
                  timestamp: entry.ts || new Date(ts).toISOString(),
                  channel: entry.channel,
                });
              } else if (entry.role === 'assistant') {
                // Check for tool calls
                if (entry.content?.includes('git commit') || entry.content?.includes('git push')) {
                  activities.push({
                    id: `${file}-${ts}-commit`,
                    agentId,
                    agentName,
                    type: 'commit',
                    description: 'Committed changes',
                    timestamp: entry.ts || new Date(ts).toISOString(),
                  });
                }
                if (entry.tool_calls?.length > 0) {
                  for (const tool of entry.tool_calls) {
                    if (tool.function?.name === 'Write') {
                      activities.push({
                        id: `${file}-${ts}-write-${tool.id}`,
                        agentId,
                        agentName,
                        type: 'file_created',
                        description: `Created/modified file`,
                        timestamp: entry.ts || new Date(ts).toISOString(),
                      });
                    } else if (tool.function?.name === 'sessions_spawn') {
                      activities.push({
                        id: `${file}-${ts}-spawn-${tool.id}`,
                        agentId,
                        agentName,
                        type: 'spawn',
                        description: 'Spawned sub-agent',
                        timestamp: entry.ts || new Date(ts).toISOString(),
                      });
                    }
                  }
                }
              }
            } catch {}
          }
        }
      } catch {}
    }
    
    // Sort by most recent first and limit
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return NextResponse.json(activities.slice(0, limit));
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json([]);
  }
}

function truncate(str: string, len: number): string {
  if (typeof str !== 'string') return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}
