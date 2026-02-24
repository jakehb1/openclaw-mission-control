"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  CheckCircle2,
  FileEdit,
  Folder,
  Building2,
  LayoutGrid,
  Network,
  Settings,
  Store,
  Tags,
  FileText,
  Calendar,
  Zap,
  X,
} from "lucide-react";

import { useAuth } from "@/auth/clerk";
import { ApiError } from "@/api/mutator";
import { useOrganizationMembership } from "@/lib/use-organization-membership";
import {
  type healthzHealthzGetResponse,
  useHealthzHealthzGet,
} from "@/api/generated/default/default";
import { useGatewayHealth, useClawdbotAgents } from "@/lib/use-clawdbot";
import { useMobileSidebar } from "@/components/templates/DashboardShell";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { isAdmin } = useOrganizationMembership(isSignedIn);
  const { isOpen, setIsOpen } = useMobileSidebar();
  
  // Backend health
  const healthQuery = useHealthzHealthzGet<healthzHealthzGetResponse, ApiError>(
    {
      query: {
        refetchInterval: 30_000,
        refetchOnMount: "always",
        retry: false,
      },
      request: { cache: "no-store" },
    },
  );

  // Gateway health
  const gatewayQuery = useGatewayHealth();
  const { agents: clawdbotAgents } = useClawdbotAgents();
  
  const onlineAgents = clawdbotAgents.filter(a => a.status === 'online' || a.status === 'busy').length;

  const okValue = healthQuery.data?.data?.ok;
  const systemStatus: "unknown" | "operational" | "degraded" =
    okValue === true
      ? "operational"
      : okValue === false
        ? "degraded"
        : healthQuery.isError
          ? "degraded"
          : "unknown";
  
  const gatewayStatus = gatewayQuery.data?.ok ? "operational" : "degraded";

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-6 text-sm">
          {/* Overview */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
              Overview
            </p>
            <div className="mt-2 space-y-0.5">
              <NavLink href="/dashboard" icon={<BarChart3 className="h-4 w-4" />} active={pathname === "/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink href="/reports" icon={<FileText className="h-4 w-4" />} active={pathname.startsWith("/reports")}>
                Reports
              </NavLink>
              <NavLink href="/activity" icon={<Activity className="h-4 w-4" />} active={pathname.startsWith("/activity")}>
                Live Feed
              </NavLink>
            </div>
          </div>

          {/* Agents */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
              Agents
              {onlineAgents > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                  {onlineAgents} online
                </span>
              )}
            </p>
            <div className="mt-2 space-y-0.5">
              {clawdbotAgents.map((agent) => (
                <NavLink 
                  key={agent.id}
                  href={`/agents/${agent.id}`} 
                  icon={<span className="text-sm">{agent.emoji}</span>}
                  active={pathname === `/agents/${agent.id}`}
                  status={agent.status}
                >
                  {agent.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
              Content
            </p>
            <div className="mt-2 space-y-0.5">
              <NavLink href="/content" icon={<FileEdit className="h-4 w-4" />} active={pathname.startsWith("/content")}>
                Content Queue
              </NavLink>
            </div>
          </div>

          {/* Boards */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
              Boards
            </p>
            <div className="mt-2 space-y-0.5">
              <NavLink href="/board-groups" icon={<Folder className="h-4 w-4" />} active={pathname.startsWith("/board-groups")}>
                Board Groups
              </NavLink>
              <NavLink href="/boards" icon={<LayoutGrid className="h-4 w-4" />} active={pathname.startsWith("/boards")}>
                Boards
              </NavLink>
              <NavLink href="/tags" icon={<Tags className="h-4 w-4" />} active={pathname.startsWith("/tags")}>
                Tags
              </NavLink>
              <NavLink href="/approvals" icon={<CheckCircle2 className="h-4 w-4" />} active={pathname.startsWith("/approvals")}>
                Approvals
              </NavLink>
              {isAdmin && (
                <NavLink href="/custom-fields" icon={<Settings className="h-4 w-4" />} active={pathname.startsWith("/custom-fields")}>
                  Custom Fields
                </NavLink>
              )}
            </div>
          </div>

          {/* Skills (Admin only) */}
          {isAdmin && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
                Skills
              </p>
              <div className="mt-2 space-y-0.5">
                <NavLink href="/skills/marketplace" icon={<Store className="h-4 w-4" />} active={pathname.startsWith("/skills/marketplace")}>
                  Marketplace
                </NavLink>
                <NavLink href="/skills/packs" icon={<Boxes className="h-4 w-4" />} active={pathname.startsWith("/skills/packs")}>
                  Packs
                </NavLink>
              </div>
            </div>
          )}

          {/* Administration */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-quiet)]">
              Settings
            </p>
            <div className="mt-2 space-y-0.5">
              <NavLink href="/organization" icon={<Building2 className="h-4 w-4" />} active={pathname.startsWith("/organization")}>
                Organization
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink href="/gateways" icon={<Network className="h-4 w-4" />} active={pathname.startsWith("/gateways")}>
                    Gateways
                  </NavLink>
                  <NavLink href="/agents" icon={<Bot className="h-4 w-4" />} active={pathname === "/agents" || pathname === "/agents/new"}>
                    All Agents
                  </NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
      
      {/* Status footer */}
      <div className="border-t border-[color:var(--border-light)] p-4 space-y-2">
        <StatusIndicator 
          label="Backend" 
          status={systemStatus} 
        />
        <StatusIndicator 
          label="Gateway" 
          status={gatewayStatus}
          detail={gatewayQuery.data?.version}
        />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="hidden h-full w-64 flex-col border-r border-[color:var(--border-light)] bg-white md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-out drawer */}
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl animate-in slide-in-from-left duration-300">
            {/* Mobile header with close button */}
            <div className="flex items-center justify-between border-b border-[color:var(--border-light)] px-4 py-3">
              <span className="font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}

function NavLink({
  href,
  icon,
  children,
  active,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  status?: 'online' | 'offline' | 'busy' | 'idle';
}) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-300",
    busy: "bg-orange-500",
    idle: "bg-blue-400",
  };
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-[color:var(--text-muted)] transition-all duration-200",
        active
          ? "bg-[color:var(--accent-soft)] text-[color:var(--accent)] font-medium"
          : "hover:bg-[color:var(--surface-muted)]",
      )}
    >
      <span className={cn(active && "text-[color:var(--accent)]")}>{icon}</span>
      <span className="flex-1">{children}</span>
      {status && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full flex-shrink-0",
            statusColors[status],
            status === "online" && "animate-pulse"
          )}
        />
      )}
    </Link>
  );
}

function StatusIndicator({
  label,
  status,
  detail,
}: {
  label: string;
  status: "unknown" | "operational" | "degraded";
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            status === "operational" && "bg-green-500",
            status === "degraded" && "bg-red-500",
            status === "unknown" && "bg-gray-300",
          )}
        />
        <span className="text-[color:var(--text-muted)]">{label}</span>
      </div>
      {detail && (
        <span className="text-[color:var(--text-quiet)]">{detail}</span>
      )}
    </div>
  );
}
