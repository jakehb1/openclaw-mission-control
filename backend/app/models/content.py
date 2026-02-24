"""Content queue SQLModel tables for social content management."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Index
from sqlmodel import Field

from app.core.time import utcnow
from app.models.tenancy import TenantScoped


class ContentPlatform(str, Enum):
    """Supported social platforms for content posting."""

    X = "x"
    REDDIT = "reddit"


class ContentSourceType(str, Enum):
    """Source type indicating how the content was generated."""

    TREND = "trend"
    REPLY = "reply"
    QUOTE = "quote"
    MANUAL = "manual"


class ContentStatus(str, Enum):
    """Workflow status for content posts."""

    DRAFT = "draft"
    QUEUED = "queued"
    APPROVED = "approved"
    POSTED = "posted"
    REJECTED = "rejected"


class AutoPostTier(str, Enum):
    """Confidence tier for auto-posting decisions."""

    GREEN = "green"  # High confidence, can auto-post
    YELLOW = "yellow"  # Medium confidence, needs review
    RED = "red"  # Low confidence, requires human approval


# SQLAlchemy enum types configured to use .value (lowercase) for PostgreSQL native enums
_ContentPlatformSA = SAEnum(
    ContentPlatform,
    values_callable=lambda x: [e.value for e in x],
    name="contentplatform",
    create_type=False,
)
_ContentSourceTypeSA = SAEnum(
    ContentSourceType,
    values_callable=lambda x: [e.value for e in x],
    name="contentsourcetype",
    create_type=False,
)
_ContentStatusSA = SAEnum(
    ContentStatus,
    values_callable=lambda x: [e.value for e in x],
    name="contentstatus",
    create_type=False,
)
_AutoPostTierSA = SAEnum(
    AutoPostTier,
    values_callable=lambda x: [e.value for e in x],
    name="autoposttier",
    create_type=False,
)


class ContentPost(TenantScoped, table=True):
    """A queued content post for social media scheduling and review."""

    __tablename__ = "content_posts"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        Index("ix_content_posts_org_status", "organization_id", "status"),
        Index("ix_content_posts_org_platform", "organization_id", "platform"),
        Index(
            "ix_content_posts_org_tier_status",
            "organization_id",
            "auto_post_tier",
            "status",
        ),
        Index("ix_content_posts_scheduled_at", "scheduled_at"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    organization_id: UUID = Field(foreign_key="organizations.id", index=True)

    # Content fields
    content: str = Field(description="The post text content")
    platform: ContentPlatform = Field(default=ContentPlatform.X, sa_type=_ContentPlatformSA)
    source_url: str | None = Field(
        default=None,
        description="URL of the original trend/post that inspired this content",
    )
    source_type: ContentSourceType = Field(
        default=ContentSourceType.MANUAL, sa_type=_ContentSourceTypeSA
    )

    # Workflow state
    status: ContentStatus = Field(default=ContentStatus.DRAFT, sa_type=_ContentStatusSA)
    auto_post_tier: AutoPostTier = Field(default=AutoPostTier.YELLOW, sa_type=_AutoPostTierSA)

    # Scheduling
    scheduled_at: datetime | None = Field(
        default=None,
        description="When the post should be published",
    )
    posted_at: datetime | None = Field(
        default=None,
        description="When the post was actually published",
    )

    # Audit timestamps
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
