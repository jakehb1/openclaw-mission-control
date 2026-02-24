import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL || 'http://localhost:18789';

export async function GET() {
  try {
    const response = await fetch(GATEWAY_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    
    return NextResponse.json({
      ok: response.ok || response.status < 500,
      version: 'connected',
      uptime: 0,
      linkedChannels: [],
      connectedAgents: 1,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      version: 'unreachable',
      uptime: 0,
      linkedChannels: [],
      connectedAgents: 0,
    });
  }
}
