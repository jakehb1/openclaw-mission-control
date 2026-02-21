"use client";

import Link from "next/link";

import {
  SignInButton,
  SignedIn,
  SignedOut,
  isClerkEnabled,
} from "@/auth/clerk";

const ArrowIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 12L10 8L6 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function LandingHero() {
  const clerkEnabled = isClerkEnabled();

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-label">
            <span>🤖</span>
            Clawdbot Mission Control
          </div>
          <h1>
            Your AI agents,
            <br />
            <span className="hero-highlight">one command center.</span>
          </h1>
          <p>
            Monitor your Clawdbot agents in real-time. Track tasks, sessions, and performance 
            across Echo, Forge, Scribe, Scout, Sentinel, and Archive.
          </p>

          <div className="hero-actions">
            <SignedOut>
              {clerkEnabled ? (
                <>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/dashboard"
                    signUpForceRedirectUrl="/dashboard"
                  >
                    <button type="button" className="btn-large primary">
                      Open Dashboard <ArrowIcon />
                    </button>
                  </SignInButton>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/reports"
                    signUpForceRedirectUrl="/reports"
                  >
                    <button type="button" className="btn-large secondary">
                      View Reports
                    </button>
                  </SignInButton>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="btn-large primary">
                    Open Dashboard <ArrowIcon />
                  </Link>
                  <Link href="/reports" className="btn-large secondary">
                    View Reports
                  </Link>
                </>
              )}
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard" className="btn-large primary">
                Open Dashboard <ArrowIcon />
              </Link>
              <Link href="/reports" className="btn-large secondary">
                View Reports
              </Link>
            </SignedIn>
          </div>

          <div className="hero-features">
            {["6 Specialized Agents", "Real-time Monitoring", "Daily Reports"].map(
              (label) => (
                <div key={label} className="hero-feature">
                  <div className="feature-icon">✓</div>
                  <span>{label}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="command-surface">
          <div className="surface-header">
            <div className="surface-title">Agent Command Center</div>
            <div className="live-indicator">
              <div className="live-dot" />
              LIVE
            </div>
          </div>
          <div className="surface-subtitle">
            <h3>Your AI workforce at a glance.</h3>
            <p>
              Monitor all agents, track active sessions, and review performance metrics.
            </p>
          </div>
          <div className="metrics-row">
            {[
              { label: "Agents", value: "06" },
              { label: "Online", value: "04" },
              { label: "Tasks Today", value: "23" },
            ].map((item) => (
              <div key={item.label} className="metric">
                <div className="metric-value">{item.value}</div>
                <div className="metric-label">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="surface-content">
            <div className="content-section">
              <h4>Active Agents</h4>
              {[
                { emoji: "🔮", name: "Echo", task: "Processing queries..." },
                { emoji: "⚒️", name: "Forge", task: "Building components..." },
                { emoji: "✍️", name: "Scribe", task: "Writing documentation..." },
              ].map((agent) => (
                <div key={agent.name} className="status-item">
                  <div className="status-icon progress">{agent.emoji}</div>
                  <div className="status-item-content">
                    <div className="status-item-title">{agent.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-quiet)' }}>{agent.task}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="content-section">
              <h4>Other Agents</h4>
              {[
                { emoji: "🔭", name: "Scout", status: "idle" as const },
                { emoji: "🛡️", name: "Sentinel", status: "idle" as const },
                { emoji: "📚", name: "Archive", status: "offline" as const },
              ].map((agent) => (
                <div key={agent.name} className="approval-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{agent.emoji}</span>
                    <div className="approval-title">{agent.name}</div>
                  </div>
                  <div className={`approval-badge ${agent.status === 'idle' ? 'ready' : 'waiting'}`}>
                    {agent.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "1.5rem",
              borderTop: "1px solid var(--border-light)",
            }}
          >
            <div className="content-section">
              <h4>Recent Activity</h4>
              {[
                { text: "Forge committed 3 files to mission-control", time: "Now" },
                { text: "Echo completed conversation analysis", time: "2m" },
                { text: "Scribe updated AGENTS.md", time: "8m" },
              ].map((signal) => (
                <div key={signal.text} className="signal-item">
                  <div className="signal-text">{signal.text}</div>
                  <div className="signal-time">{signal.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" id="capabilities">
        <div className="features-grid">
          {[
            {
              title: "Agent Dashboard",
              description:
                "See all your Clawdbot agents at a glance. Monitor who's online, what they're working on, and their performance.",
            },
            {
              title: "Daily Reports",
              description:
                "Auto-generated summaries of agent activity. Track commits, tasks completed, and highlights for each day.",
            },
            {
              title: "Session Tracking",
              description:
                "View active and historical sessions across all channels. Telegram, Discord, WhatsApp, and more.",
            },
            {
              title: "Performance Metrics",
              description:
                "Track success rates, response times, and error rates. Identify trends and optimize agent workflows.",
            },
          ].map((feature, idx) => (
            <div key={feature.title} className="feature-card">
              <div className="feature-number">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Take control of your AI agents.</h2>
          <p>
            Start monitoring your Clawdbot fleet today. One dashboard for all your agents.
          </p>
          <div className="cta-actions">
            <SignedOut>
              {clerkEnabled ? (
                <>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/dashboard"
                    signUpForceRedirectUrl="/dashboard"
                  >
                    <button type="button" className="btn-large white">
                      Get Started
                    </button>
                  </SignInButton>
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/reports"
                    signUpForceRedirectUrl="/reports"
                  >
                    <button type="button" className="btn-large outline">
                      View Demo
                    </button>
                  </SignInButton>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="btn-large white">
                    Get Started
                  </Link>
                  <Link href="/reports" className="btn-large outline">
                    View Demo
                  </Link>
                </>
              )}
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard" className="btn-large white">
                Open Dashboard
              </Link>
              <Link href="/reports" className="btn-large outline">
                View Reports
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>
    </>
  );
}
