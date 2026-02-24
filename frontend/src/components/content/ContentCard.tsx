"use client";

import { type ContentPostRead } from "@/api/generated/model";
import { formatRelativeTimestamp } from "@/lib/formatters";
import { ContentActions } from "./ContentActions";

type ContentCardProps = {
  post: ContentPostRead;
  onApprove?: (post: ContentPostRead) => void;
  onReject?: (post: ContentPostRead) => void;
  onEdit?: (post: ContentPostRead) => void;
  onDelete?: (post: ContentPostRead) => void;
  isPending?: boolean;
};

const PLATFORM_LABELS: Record<string, string> = {
  x: "𝕏",
  reddit: "Reddit",
};

const TIER_COLORS: Record<string, string> = {
  green: "border-green-300 bg-green-50",
  yellow: "border-yellow-300 bg-yellow-50",
  red: "border-red-300 bg-red-50",
};

const TIER_BADGE_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  queued: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  posted: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  trend: "📈 Trend",
  reply: "💬 Reply",
  quote: "🔁 Quote",
  manual: "✍️ Manual",
};

export function ContentCard({
  post,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isPending = false,
}: ContentCardProps) {
  const tierClass = TIER_COLORS[post.auto_post_tier] ?? "border-gray-300 bg-gray-50";

  return (
    <div
      className={`rounded-xl border-2 p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md ${tierClass}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-base sm:text-lg font-bold">
            {PLATFORM_LABELS[post.platform] ?? post.platform}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium ${STATUS_COLORS[post.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium ${TIER_BADGE_COLORS[post.auto_post_tier] ?? "bg-gray-100 text-gray-800"}`}
          >
            {post.auto_post_tier.toUpperCase()}
          </span>
        </div>
        <span className="text-[10px] sm:text-xs text-slate-500 whitespace-nowrap flex-shrink-0">
          {formatRelativeTimestamp(post.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="mb-2 sm:mb-3">
        <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 mb-3">
        <span>{SOURCE_TYPE_LABELS[post.source_type] ?? post.source_type}</span>
        {post.source_url && (
          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline active:text-blue-800"
          >
            View source →
          </a>
        )}
        {post.scheduled_at && (
          <span className="flex items-center gap-1">
            📅 {formatRelativeTimestamp(post.scheduled_at)}
          </span>
        )}
      </div>

      {/* Actions - touch-friendly */}
      <div className="border-t border-slate-200/50 pt-3">
        <ContentActions
          post={post}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
          onDelete={onDelete}
          isPending={isPending}
          variant="card"
        />
      </div>
    </div>
  );
}
