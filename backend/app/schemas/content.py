"""Schemas for content queue listing, creation, and update operations."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlmodel import SQLModel

from app.models.content import AutoPostTier, ContentPlatform, ContentSourceType, ContentStatus


class ContentPostCreate(SQLModel):
    """Payload for creating a new content post."""

    content: str
    platform: ContentPlatform = ContentPlatform.X
    source_url: str | None = None
    source_type: ContentSourceType = ContentSourceType.MANUAL
    auto_post_tier: AutoPostTier = AutoPostTier.YELLOW
    scheduled_at: datetime | None = None


class ContentPostUpdate(SQLModel):
    """Payload for updating an existing content post."""

    content: str | None = None
    platform: ContentPlatform | None = None
    source_url: str | None = None
    source_type: ContentSourceType | None = None
    status: ContentStatus | None = None
    auto_post_tier: AutoPostTier | None = None
    scheduled_at: datetime | None = None


class ContentPostRead(SQLModel):
    """Serialized content post record."""

    id: UUID
    organization_id: UUID
    content: str
    platform: ContentPlatform
    source_url: str | None = None
    source_type: ContentSourceType
    status: ContentStatus
    auto_post_tier: AutoPostTier
    scheduled_at: datetime | None = None
    posted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class ContentPostActionResponse(SQLModel):
    """Response for approve/reject actions."""

    ok: bool = True
    post_id: UUID
    status: ContentStatus
