import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export async function GET() {
  try {
    // Read cron jobs from Clawdbot state
    const cronPath = join(homedir(), '.clawdbot', 'cron', 'jobs.json');
    const content = await readFile(cronPath, 'utf-8');
    const data = JSON.parse(content);
    
    // Transform jobs for frontend
    const jobs = (data.jobs || []).map((job: any) => ({
      id: job.id,
      name: job.name,
      agentId: job.agentId,
      enabled: job.enabled,
      schedule: job.schedule,
      mission: job.payload?.text || '',
      nextRun: job.state?.nextRunAtMs,
      lastRun: job.state?.lastRunAtMs,
      lastStatus: job.state?.lastStatus,
    }));
    
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ jobs: [] });
  }
}
