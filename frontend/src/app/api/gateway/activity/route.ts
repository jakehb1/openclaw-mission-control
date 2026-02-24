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
      const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1);
      
      try {
        const sessionFiles = await readdir(sessionsDir);
        
        for (const file of sessionFiles) {
          if (!file.endsWith('.jsonl') || file.includes('.deleted') || file.includes('.lock')) continue;
          
          const filePath = join(sessionsDir, file);
          const content = await readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              
              if (!entry.timestamp) continue;
              const ts = new Date(entry.timestamp).getTime();
              if (ts < cutoff) continue;
              
              // Parse messages
              if (entry.type === 'message' && entry.message) {
                const role = entry.message.role;
                const content = entry.message.content;
                
                // Get text content
                let text = '';
                if (typeof content === 'string') {
                  text = content;
                } else if (Array.isArray(content)) {
                  const textPart = content.find((p: any) => p.type === 'text');
                  text = textPart?.text || '';
                }
                
                if (role === 'user' && text && !text.startsWith('A new session')) {
                  activities.push({
                    id: `${entry.id}-user`,
                    agentId,
                    agentName,
                    type: 'message',
                    description: truncate(text, 80),
                    timestamp: entry.timestamp,
                  });
                }
                
                if (role === 'assistant') {
                  // Check for errors
                  if (entry.message.stopReason === 'error') {
                    activities.push({
                      id: `${entry.id}-error`,
                      agentId,
                      agentName,
                      type: 'error',
                      description: truncate(entry.message.errorMessage || 'Error occurred', 80),
                      timestamp: entry.timestamp,
                    });
                  }
                }
              }
              
              // Parse tool results for file operations
              if (entry.type === 'tool_result') {
                const toolName = entry.toolName || '';
                if (toolName === 'Write' || toolName === 'Edit') {
                  activities.push({
                    id: `${entry.id}-file`,
                    agentId,
                    agentName,
                    type: toolName === 'Write' ? 'file_created' : 'file_modified',
                    description: `${toolName === 'Write' ? 'Created' : 'Edited'} file`,
                    timestamp: entry.timestamp,
                  });
                }
                if (toolName === 'exec' && entry.result?.includes?.('commit')) {
                  activities.push({
                    id: `${entry.id}-commit`,
                    agentId,
                    agentName,
                    type: 'commit',
                    description: 'Committed changes',
                    timestamp: entry.timestamp,
                  });
                }
                if (toolName === 'sessions_spawn') {
                  activities.push({
                    id: `${entry.id}-spawn`,
                    agentId,
                    agentName,
                    type: 'spawn',
                    description: 'Spawned sub-agent',
                    timestamp: entry.timestamp,
                  });
                }
              }
            } catch {}
          }
        }
      } catch {}
    }
    
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
  // Remove [message_id: ...] tags
  str = str.replace(/\[message_id: [^\]]+\]/g, '').trim();
  return str.length > len ? str.slice(0, len) + '...' : str;
}
