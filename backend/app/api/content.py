"""Content queue API endpoints for managing social content posts."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi_pagination import Page
from fastapi_pagination.ext.sqlmodel import paginate
from sqlmodel import select

from app.api.deps import require_org_admin
from app.core.time import utcnow
from app.db.session import get_session
from app.models.content import AutoPostTier, ContentPlatform, ContentPost, ContentStatus
from app.schemas.common import OkResponse
from app.schemas.content import (
    ContentPostActionResponse,
    ContentPostCreate,
    ContentPostRead,
    ContentPostUpdate,
)
from app.services.organizations import OrganizationContext

if TYPE_CHECKING:
    from sqlmodel.ext.asyncio.session import AsyncSession

router = APIRouter(prefix="/content", tags=["content"])

SESSION_DEP = Depends(get_session)
ORG_ADMIN_DEP = Depends(require_org_admin)


@router.get("", response_model=Page[ContentPostRead])
async def list_content_posts(
    status_filter: ContentStatus | None = Query(None, alias="status"),
    platform: ContentPlatform | None = Query(None),
    auto_post_tier: AutoPostTier | None = Query(None, alias="tier"),
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> Page[ContentPostRead]:
    """List content posts for the organization with optional filters."""
    query = (
        select(ContentPost)
        .where(ContentPost.organization_id == ctx.organization.id)
        .order_by(ContentPost.created_at.desc())
    )

    if status_filter is not None:
        query = query.where(ContentPost.status == status_filter)
    if platform is not None:
        query = query.where(ContentPost.platform == platform)
    if auto_post_tier is not None:
        query = query.where(ContentPost.auto_post_tier == auto_post_tier)

    return await paginate(session, query)


@router.post("", response_model=ContentPostRead, status_code=status.HTTP_201_CREATED)
async def create_content_post(
    payload: ContentPostCreate,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostRead:
    """Create a new content post draft."""
    post = ContentPost(
        organization_id=ctx.organization.id,
        content=payload.content,
        platform=payload.platform,
        source_url=payload.source_url,
        source_type=payload.source_type,
        auto_post_tier=payload.auto_post_tier,
        scheduled_at=payload.scheduled_at,
        status=ContentStatus.DRAFT,
    )
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return ContentPostRead.model_validate(post)


@router.get("/{post_id}", response_model=ContentPostRead)
async def get_content_post(
    post_id: UUID,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostRead:
    """Get a single content post by ID."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)
    return ContentPostRead.model_validate(post)


@router.patch("/{post_id}", response_model=ContentPostRead)
async def update_content_post(
    post_id: UUID,
    payload: ContentPostUpdate,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostRead:
    """Update a content post's fields."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)

    post.updated_at = utcnow()
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return ContentPostRead.model_validate(post)


@router.delete("/{post_id}", response_model=OkResponse)
async def delete_content_post(
    post_id: UUID,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> OkResponse:
    """Delete a content post."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)
    await session.delete(post)
    await session.commit()
    return OkResponse(ok=True)


@router.post("/{post_id}/approve", response_model=ContentPostActionResponse)
async def approve_content_post(
    post_id: UUID,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostActionResponse:
    """Quick approve a content post."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)

    if post.status == ContentStatus.POSTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot approve an already posted content.",
        )

    post.status = ContentStatus.APPROVED
    post.updated_at = utcnow()
    session.add(post)
    await session.commit()
    await session.refresh(post)

    return ContentPostActionResponse(
        ok=True,
        post_id=post.id,
        status=post.status,
    )


@router.post("/{post_id}/reject", response_model=ContentPostActionResponse)
async def reject_content_post(
    post_id: UUID,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostActionResponse:
    """Quick reject a content post."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)

    if post.status == ContentStatus.POSTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject an already posted content.",
        )

    post.status = ContentStatus.REJECTED
    post.updated_at = utcnow()
    session.add(post)
    await session.commit()
    await session.refresh(post)

    return ContentPostActionResponse(
        ok=True,
        post_id=post.id,
        status=post.status,
    )


@router.post("/{post_id}/queue", response_model=ContentPostActionResponse)
async def queue_content_post(
    post_id: UUID,
    session: AsyncSession = SESSION_DEP,
    ctx: OrganizationContext = ORG_ADMIN_DEP,
) -> ContentPostActionResponse:
    """Move a draft content post to the queue."""
    post = await _get_post_or_404(session, post_id, ctx.organization.id)

    if post.status not in (ContentStatus.DRAFT, ContentStatus.REJECTED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected posts can be queued.",
        )

    post.status = ContentStatus.QUEUED
    post.updated_at = utcnow()
    session.add(post)
    await session.commit()
    await session.refresh(post)

    return ContentPostActionResponse(
        ok=True,
        post_id=post.id,
        status=post.status,
    )


async def _get_post_or_404(
    session: AsyncSession,
    post_id: UUID,
    organization_id: UUID,
) -> ContentPost:
    """Fetch a content post by ID or raise 404."""
    query = select(ContentPost).where(
        ContentPost.id == post_id,
        ContentPost.organization_id == organization_id,
    )
    result = await session.exec(query)
    post = result.first()
    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content post not found.",
        )
    return post
