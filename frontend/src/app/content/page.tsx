"use client";

export const dynamic = "force-dynamic";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/auth/clerk";

import { ContentTable } from "@/components/content/ContentTable";
import { ContentCard } from "@/components/content/ContentCard";
import { DashboardPageLayout } from "@/components/templates/DashboardPageLayout";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ApiError } from "@/api/mutator";
import {
  type listContentPostsApiV1ContentGetResponse,
  getListContentPostsApiV1ContentGetQueryKey,
  useListContentPostsApiV1ContentGet,
  useApproveContentPostApiV1ContentPostIdApprovePost,
  useRejectContentPostApiV1ContentPostIdRejectPost,
  useDeleteContentPostApiV1ContentPostIdDelete,
  useUpdateContentPostApiV1ContentPostIdPatch,
} from "@/api/generated/content/content";
import { type ContentPostRead } from "@/api/generated/model";
import { useOrganizationMembership } from "@/lib/use-organization-membership";
import { useUrlSorting } from "@/lib/use-url-sorting";
import { LayoutGrid, List, Filter, ChevronDown } from "lucide-react";
import { useEffect } from "react";

const CONTENT_SORTABLE_COLUMNS = [
  "content",
  "platform",
  "status",
  "auto_post_tier",
  "scheduled_at",
  "created_at",
];

type ViewMode = "table" | "cards";

// Hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

export default function ContentPage() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { isAdmin } = useOrganizationMembership(isSignedIn);
  const { sorting, onSortingChange } = useUrlSorting({
    allowedColumnIds: CONTENT_SORTABLE_COLUMNS,
    defaultSorting: [{ id: "created_at", desc: true }],
    paramPrefix: "content",
  });

  const [deleteTarget, setDeleteTarget] = useState<ContentPostRead | null>(null);
  const [editTarget, setEditTarget] = useState<ContentPostRead | null>(null);
  const [editContent, setEditContent] = useState("");
  // Default to cards view on mobile
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Set default view mode based on screen size
  useEffect(() => {
    if (isMobile) {
      setViewMode("cards");
    }
  }, [isMobile]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");

  const contentKey = getListContentPostsApiV1ContentGetQueryKey({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
    platform: platformFilter !== "all" ? platformFilter as any : undefined,
    tier: tierFilter !== "all" ? tierFilter as any : undefined,
  });

  const contentQuery = useListContentPostsApiV1ContentGet<
    listContentPostsApiV1ContentGetResponse,
    ApiError
  >(
    {
      status: statusFilter !== "all" ? statusFilter as any : undefined,
      platform: platformFilter !== "all" ? platformFilter as any : undefined,
      tier: tierFilter !== "all" ? tierFilter as any : undefined,
    },
    {
      query: {
        enabled: Boolean(isSignedIn),
        refetchInterval: 15_000,
        refetchOnMount: "always",
      },
    }
  );

  const posts = useMemo(
    () =>
      contentQuery.data?.status === 200
        ? (contentQuery.data.data.items ?? [])
        : [],
    [contentQuery.data],
  );

  const approveMutation = useApproveContentPostApiV1ContentPostIdApprovePost<ApiError>(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/content"] });
        },
      },
    },
    queryClient,
  );

  const rejectMutation = useRejectContentPostApiV1ContentPostIdRejectPost<ApiError>(
    {
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/content"] });
        },
      },
    },
    queryClient,
  );

  const deleteMutation = useDeleteContentPostApiV1ContentPostIdDelete<ApiError>(
    {
      mutation: {
        onSuccess: async () => {
          setDeleteTarget(null);
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/content"] });
        },
      },
    },
    queryClient,
  );

  const updateMutation = useUpdateContentPostApiV1ContentPostIdPatch<ApiError>(
    {
      mutation: {
        onSuccess: async () => {
          setEditTarget(null);
          setEditContent("");
          await queryClient.invalidateQueries({ queryKey: ["/api/v1/content"] });
        },
      },
    },
    queryClient,
  );

  const handleApprove = (post: ContentPostRead) => {
    approveMutation.mutate({ postId: post.id });
  };

  const handleReject = (post: ContentPostRead) => {
    rejectMutation.mutate({ postId: post.id });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ postId: deleteTarget.id });
  };

  const handleEdit = (post: ContentPostRead) => {
    setEditTarget(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    updateMutation.mutate({
      postId: editTarget.id,
      data: { content: editContent },
    });
  };

  const isMutating =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending;

  const pendingCount = posts.filter(
    (p) => p.status === "draft" || p.status === "queued"
  ).length;

  return (
    <>
      <DashboardPageLayout
        signedOut={{
          message: "Sign in to manage content.",
          forceRedirectUrl: "/content",
          signUpForceRedirectUrl: "/content",
        }}
        title="Content Queue"
        description={`${posts.length} post${posts.length === 1 ? "" : "s"} total${pendingCount > 0 ? `, ${pendingCount} pending review` : ""}.`}
        headerActions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        }
        isAdmin={true}
        stickyHeader
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Filters - Collapsible on mobile */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex w-full items-center justify-between p-4 md:hidden"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filters</span>
                {(statusFilter !== "all" || platformFilter !== "all" || tierFilter !== "all") && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${filtersExpanded ? "rotate-180" : ""}`} />
            </button>
            
            {/* Filter content - always visible on desktop, collapsible on mobile */}
            <div className={`${filtersExpanded ? "block" : "hidden"} border-t border-slate-100 p-4 md:block md:border-t-0`}>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="content-status-filter"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="content-status-filter" className="h-10 sm:h-11">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="posted">Posted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="content-platform-filter"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Platform
                  </label>
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger id="content-platform-filter" className="h-10 sm:h-11">
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      <SelectItem value="x">𝕏 (Twitter)</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label
                    htmlFor="content-tier-filter"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Auto-Post Tier
                  </label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger id="content-tier-filter" className="h-10 sm:h-11">
                      <SelectValue placeholder="All tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tiers</SelectItem>
                      <SelectItem value="green">🟢 Green (Auto-post)</SelectItem>
                      <SelectItem value="yellow">🟡 Yellow (Review)</SelectItem>
                      <SelectItem value="red">🔴 Red (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Content display */}
          {viewMode === "table" ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Table with horizontal scroll on small screens */}
              <div className="-mx-4 sm:mx-0">
                <ContentTable
                  posts={posts}
                  isLoading={contentQuery.isLoading}
                  sorting={sorting}
                  onSortingChange={onSortingChange}
                  stickyHeader
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  isActionPending={isMutating}
                  emptyState={{
                    title: "No content posts yet",
                    description:
                      "Content generated by AI agents will appear here for review.",
                  }}
                  hiddenColumns={isMobile ? ["source_type", "scheduled_at"] : undefined}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contentQuery.isLoading ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Loading...
                </div>
              ) : posts.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-sm">
                  <p className="text-base sm:text-lg font-medium text-slate-900">
                    No content posts yet
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Content generated by AI agents will appear here for review.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <ContentCard
                    key={post.id}
                    post={post}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEdit={handleEdit}
                    onDelete={setDeleteTarget}
                    isPending={isMutating}
                  />
                ))
              )}
            </div>
          )}

          {contentQuery.error ? (
            <p className="mt-4 text-sm text-red-500">
              {contentQuery.error.message}
            </p>
          ) : null}
        </div>
      </DashboardPageLayout>

      {/* Delete confirmation dialog */}
      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        ariaLabel="Delete content post"
        title="Delete content post"
        description={
          <>
            This will permanently delete this content post. This action cannot be
            undone.
          </>
        }
        errorMessage={deleteMutation.error?.message}
        onConfirm={handleDelete}
        isConfirming={deleteMutation.isPending}
      />

      {/* Edit dialog */}
      <ConfirmActionDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditContent("");
          }
        }}
        ariaLabel="Edit content post"
        title="Edit content post"
        description={
          <div className="mt-4">
            <label
              htmlFor="edit-content"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="edit-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[150px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter post content..."
            />
          </div>
        }
        errorMessage={updateMutation.error?.message}
        onConfirm={handleSaveEdit}
        isConfirming={updateMutation.isPending}
        confirmLabel="Save changes"
      />
    </>
  );
}
