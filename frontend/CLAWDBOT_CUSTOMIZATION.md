# Clawdbot Mission Control - Customization Summary

## Overview
This document summarizes the Apple-style design overhaul and Clawdbot customizations made to the OpenClaw Mission Control dashboard.

## Design System

### Apple-Style Updates
- **Typography**: Inter font family (SF Pro fallback on Apple devices)
- **Colors**: Clean whites (#ffffff), subtle grays (#f5f5f7), Apple blue (#0071e3)
- **Rounded corners**: 12-16px (Apple-style)
- **Shadows**: Subtle, layered shadows for depth
- **Animations**: Smooth transitions with Apple's easing curves
- **Glass effects**: Backdrop blur for navigation and overlays

### CSS Variables (`globals.css`)
```css
--bg: #ffffff;
--bg-secondary: #f5f5f7;
--accent: #0071e3;
--success: #34c759;
--warning: #ff9500;
--danger: #ff3b30;
--shadow-apple: 0 4px 16px rgba(0,0,0,0.08);
```

## Rebranding

### From OpenClaw to Clawdbot
- Updated all branding references
- New logo with robot emoji 🤖
- Updated metadata in `layout.tsx`
- Rebranded landing page and hero

### Agent List (6 Agents)
1. **Echo 🔮** - Query processing
2. **Forge ⚒️** - Building & coding
3. **Scribe ✍️** - Documentation
4. **Scout 🔭** - Research & discovery
5. **Sentinel 🛡️** - Monitoring & security
6. **Archive 📚** - Data management

## New Components (`/src/components/clawdbot/`)

### AgentCard
- Status indicator (online/offline/busy/idle)
- Current task display
- Metrics grid (commits, tasks, messages)
- Hover animations

### ActivityFeed
- Real-time activity stream
- Activity type icons and colors
- Relative timestamps
- Agent name display

### ProgressRing / ProgressBar
- Circular and linear progress indicators
- Multiple color themes
- Animated transitions

### StatsCard
- KPI display cards
- Trend indicators
- Comparison badges

### Calendar
- Date picker with Apple styling
- Highlighted dates for activity
- Today button

### TrendChart / BarChart
- SVG-based trend visualization
- Multiple color themes
- Sparkline variant

## New Pages

### Dashboard (`/dashboard`)
- Today's progress ring
- Active sessions panel
- Agent cards grid (all 6 agents)
- Recent activity feed
- Weekly stats summary
- Quick action links

### Reports - Daily (`/reports`)
- Calendar date picker
- Per-agent activity cards
- Daily summary with highlights
- Activity timeline
- Export to Markdown

### Reports - Weekly (`/reports/weekly`)
- Week navigation (prev/next)
- Key metrics with week-over-week comparison
- Weekly highlights
- Daily breakdown bar chart
- 8-week trend lines
- Agent performance table
- Export to Markdown

### Agent Detail (`/agents/[agentId]`)
- Agent header with status
- Three-tab navigation (Overview/Activity/Sessions)
- Performance score ring
- Metric breakdown bars
- Session history table
- Activity timeline

## Gateway Integration

### Configuration
```env
NEXT_PUBLIC_CLAWDBOT_GATEWAY_URL=http://localhost:18789
NEXT_PUBLIC_CLAWDBOT_GATEWAY_TOKEN=<your-token>
```

### Hooks (`/src/lib/use-clawdbot.ts`)
- `useGatewayHealth()` - Gateway connection status
- `useClawdbotAgents()` - Agent list with status
- `useClawdbotActivity(days)` - Activity feed
- `useClawdbotSessions(days)` - Session history
- `useDailyReport(date)` - Daily report data
- `useWeeklyReport(weekStart)` - Weekly report data
- `useTodayProgress()` - Today's metrics
- `useAgentDetail(agentId)` - Agent details

### Mock Data
Development mode uses generated mock data for all endpoints, allowing the UI to work without a running gateway.

## Sidebar Updates

### Navigation Structure
1. **Overview**
   - Dashboard
   - Reports
   - Live Feed

2. **Agents** (with online count badge)
   - Echo 🔮
   - Forge ⚒️
   - Scribe ✍️
   - Scout 🔭
   - Sentinel 🛡️
   - Archive 📚

3. **Boards**
   - Board Groups
   - Boards
   - Tags
   - Approvals
   - Custom Fields (admin)

4. **Skills** (admin only)
   - Marketplace
   - Packs

5. **Settings**
   - Organization
   - Gateways (admin)
   - All Agents (admin)

### Status Footer
- Backend status indicator
- Gateway status indicator with version

## File Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx (updated fonts/meta)
│   │   ├── globals.css (Apple design system)
│   │   ├── dashboard/page.tsx (enhanced)
│   │   ├── reports/
│   │   │   ├── page.tsx (daily reports)
│   │   │   └── weekly/page.tsx (weekly rollup)
│   │   └── agents/[agentId]/page.tsx (enhanced)
│   ├── components/
│   │   ├── clawdbot/
│   │   │   ├── index.ts
│   │   │   ├── AgentCard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── StatsCard.tsx
│   │   │   ├── Calendar.tsx
│   │   │   └── TrendChart.tsx
│   │   ├── atoms/BrandMark.tsx (updated)
│   │   └── organisms/
│   │       ├── DashboardSidebar.tsx (updated)
│   │       └── LandingHero.tsx (updated)
│   └── lib/
│       ├── clawdbot-gateway.ts (API client)
│       └── use-clawdbot.ts (React hooks)
├── .env.local (gateway config)
└── tailwind.config.cjs (Apple design tokens)
```

## Running the App

```bash
cd ~/clawdbot-agents/mission-control/frontend
npm run dev
# Open http://localhost:3000
```

## Future Enhancements

1. **Real Gateway Integration**: Replace mock data with actual Gateway WebSocket connection
2. **Report Storage**: Backend API for persisting reports
3. **PDF Export**: Add PDF generation for reports
4. **Notifications**: Real-time alerts for errors/milestones
5. **Agent Comparison**: Side-by-side performance comparison
6. **Custom Date Ranges**: Flexible reporting periods
