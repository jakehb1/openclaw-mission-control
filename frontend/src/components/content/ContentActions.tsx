"use client";

import { Check, Edit, Trash2, X } from "lucide-react";

import { type ContentPostRead } from "@/api/generated/model";
import { Button } from "@/components/ui/button";

type ContentActionsProps = {
  post: ContentPostRead;
  onApprove?: (post: ContentPostRead) => void;
  onReject?: (post: ContentPostRead) => void;
  onEdit?: (post: ContentPostRead) => void;
  onDelete?: (post: ContentPostRead) => void;
  isPending?: boolean;
  variant?: "table" | "card";
};

export function ContentActions({
  post,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  isPending = false,
  variant = "table",
}: ContentActionsProps) {
  const canApprove = ["draft", "queued", "rejected"].includes(post.status);
  const canReject = ["draft", "queued", "approved"].includes(post.status);
  const isPosted = post.status === "posted";

  if (variant === "card") {
    return (
      <div className="flex items-center gap-2">
        {canApprove && onApprove && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onApprove(post)}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-1" />
            Approve
          </Button>
        )}
        {canReject && onReject && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(post)}
            disabled={isPending}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
        )}
        {onEdit && !isPosted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(post)}
            disabled={isPending}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(post)}
            disabled={isPending}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  // Table variant - more compact
  return (
    <div className="flex items-center justify-end gap-1">
      {canApprove && onApprove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApprove(post)}
          disabled={isPending}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Approve"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
      {canReject && onReject && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onReject(post)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Reject"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {onEdit && !isPosted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(post)}
          disabled={isPending}
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(post)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
