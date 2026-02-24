"use client";

import { type ReactNode, useMemo, useState } from "react";

import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type Updater,
  type VisibilityState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { type ContentPostRead } from "@/api/generated/model";
import { DataTable } from "@/components/tables/DataTable";
import { dateCell, pillCell } from "@/components/tables/cell-formatters";
import { ContentActions } from "./ContentActions";

type ContentTableEmptyState = {
  title: string;
  description: string;
  icon?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
};

type ContentTableProps = {
  posts: ContentPostRead[];
  isLoading?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  hiddenColumns?: string[];
  columnOrder?: string[];
  disableSorting?: boolean;
  stickyHeader?: boolean;
  emptyMessage?: string;
  emptyState?: ContentTableEmptyState;
  onApprove?: (post: ContentPostRead) => void;
  onReject?: (post: ContentPostRead) => void;
  onEdit?: (post: ContentPostRead) => void;
  onDelete?: (post: ContentPostRead) => void;
  isActionPending?: boolean;
};

const DEFAULT_EMPTY_ICON = (
  <svg
    className="h-16 w-16 text-slate-300"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

const PLATFORM_LABELS: Record<string, string> = {
  x: "𝕏",
  reddit: "Reddit",
};

const TIER_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  trend: "Trend",
  reply: "Reply",
  quote: "Quote",
  manual: "Manual",
};

function truncateContent(content: string, maxLength = 80): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength).trim() + "…";
}

export function ContentTable({
  posts,
  isLoading = false,
  sorting,
  onSortingChange,
  hiddenColumns,
  columnOrder,
  disableSorting = false,
  stickyHeader = false,
  emptyMessage = "No content posts found.",
  emptyState,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isActionPending = false,
}: ContentTableProps) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const resolvedSorting = sorting ?? internalSorting;
  const handleSortingChange: OnChangeFn<SortingState> =
    onSortingChange ??
    ((updater: Updater<SortingState>) => {
      setInternalSorting(updater);
    });

  const sortedPosts = useMemo(() => [...posts], [posts]);
  const columnVisibility = useMemo<VisibilityState>(
    () =>
      Object.fromEntries(
        (hiddenColumns ?? []).map((columnId) => [columnId, false]),
      ),
    [hiddenColumns],
  );

  const columns = useMemo<ColumnDef<ContentPostRead>[]>(() => {
    const baseColumns: ColumnDef<ContentPostRead>[] = [
      {
        accessorKey: "content",
        header: "Content",
        cell: ({ row }) => (
          <div className="max-w-md">
            <p className="text-sm text-slate-900 whitespace-pre-wrap">
              {truncateContent(row.original.content)}
            </p>
            {row.original.source_url && (
              <a
                href={row.original.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View source
              </a>
            )}
          </div>
        ),
      },
      {
        accessorKey: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {PLATFORM_LABELS[row.original.platform] ?? row.original.platform}
          </span>
        ),
      },
      {
        accessorKey: "source_type",
        header: "Source",
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {SOURCE_TYPE_LABELS[row.original.source_type] ?? row.original.source_type}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => pillCell(row.original.status),
      },
      {
        accessorKey: "auto_post_tier",
        header: "Tier",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIER_COLORS[row.original.auto_post_tier] ?? "bg-gray-100 text-gray-800"}`}
          >
            {row.original.auto_post_tier.toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "scheduled_at",
        header: "Scheduled",
        cell: ({ row }) =>
          dateCell(row.original.scheduled_at, { relative: true }),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) =>
          dateCell(row.original.created_at, { relative: true }),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ContentActions
            post={row.original}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onDelete={onDelete}
            isPending={isActionPending}
          />
        ),
      },
    ];

    return baseColumns;
  }, [onApprove, onReject, onEdit, onDelete, isActionPending]);

  const table = useReactTable({
    data: sortedPosts,
    columns,
    enableSorting: !disableSorting,
    state: {
      ...(!disableSorting ? { sorting: resolvedSorting } : {}),
      ...(columnOrder ? { columnOrder } : {}),
      columnVisibility,
    },
    ...(disableSorting ? {} : { onSortingChange: handleSortingChange }),
    getCoreRowModel: getCoreRowModel(),
    ...(disableSorting ? {} : { getSortedRowModel: getSortedRowModel() }),
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      stickyHeader={stickyHeader}
      rowClassName="hover:bg-slate-50"
      cellClassName="px-3 py-3 sm:px-4 md:px-6 md:py-4"
      headerCellClassName="px-3 py-2 sm:px-4 sm:py-3 md:px-6"
      emptyState={
        emptyState
          ? {
              icon: emptyState.icon ?? DEFAULT_EMPTY_ICON,
              title: emptyState.title,
              description: emptyState.description,
              actionHref: emptyState.actionHref,
              actionLabel: emptyState.actionLabel,
            }
          : undefined
      }
    />
  );
}
