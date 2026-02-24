import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

interface Session {
  key: string;
  agentId: string;
  agentName: string;
  channel: string;
  startedAt: string;
  endedAt?: string;
  messageCount: number;
  status: 'active' | 'completed';
  label?: string;
}

export async function GET() {
  try {
    const clawdbotDir = join(homedir(), '.clawdbot', 'agents');
    const sessions: Session[] = [];
    
    const agentDirs = await readdir(clawdbotDir).catch(() => []);
    
    for (const agentId of agentDirs) {
      const sessionsDir = join(clawdbotDir, agentId, 'sessions');
      
      try {
        const sessionFiles = await readdir(sessionsDir);
        
        for (const file of sessionFiles) {
          if (!file.endsWith('.jsonl') || file.includes('.deleted') || file.includes('.lock')) continue;
          
          const filePath = join(sessionsDir, file);
          const fileStat = await stat(filePath);
          const content = await readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n').filter(Boolean);
          
          let messageCount = 0;
          let channel = 'telegram';
          let firstTimestamp: string | undefined;
          let lastTimestamp: string | undefined;
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              
              // Count actual messages
              if (entry.type === 'message' && entry.message?.role) {
                messageCount++;
              }
              
              // Get channel from session entry
              if (entry.type === 'session' && entry.channel) {
                channel = entry.channel;
              }
              
              // Track timestamps
              if (entry.timestamp) {
                if (!firstTimestamp) firstTimestamp = entry.timestamp;
                lastTimestamp = entry.timestamp;
              }
            } catch {}
          }
          
          const sessionId = file.replace('.jsonl', '');
          const isRecent = Date.now() - fileStat.mtimeMs < 5 * 60 * 1000;
          
          sessions.push({
            key: `agent:${agentId}:${sessionId}`,
            agentId,
            agentName: agentId.charAt(0).toUpperCase() + agentId.slice(1),
            channel,
            startedAt: firstTimestamp || fileStat.birthtime.toISOString(),
            endedAt: isRecent ? undefined : lastTimestamp,
            messageCount,
            status: isRecent ? 'active' : 'completed',
          });
        }
      } catch {}
    }
    
    sessions.sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    
    return NextResponse.json({
      count: sessions.length,
      sessions: sessions.slice(0, 50),
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json({ count: 0, sessions: [] });
  }
}
