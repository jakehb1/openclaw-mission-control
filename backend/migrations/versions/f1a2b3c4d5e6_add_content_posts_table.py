"""add content_posts table

Revision ID: f1a2b3c4d5e6
Revises: e2f9c6b4a1d3
Create Date: 2025-02-20 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e2f9c6b4a1d3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organization_id", sa.Uuid(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "platform",
            sa.Enum("x", "reddit", name="contentplatform"),
            nullable=False,
            server_default="x",
        ),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column(
            "source_type",
            sa.Enum("trend", "reply", "quote", "manual", name="contentsourcetype"),
            nullable=False,
            server_default="manual",
        ),
        sa.Column(
            "status",
            sa.Enum("draft", "queued", "approved", "posted", "rejected", name="contentstatus"),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "auto_post_tier",
            sa.Enum("green", "yellow", "red", name="autoposttier"),
            nullable=False,
            server_default="yellow",
        ),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name="fk_content_posts_organization_id",
        ),
    )
    op.create_index(
        "ix_content_posts_organization_id",
        "content_posts",
        ["organization_id"],
    )
    op.create_index(
        "ix_content_posts_org_status",
        "content_posts",
        ["organization_id", "status"],
    )
    op.create_index(
        "ix_content_posts_org_platform",
        "content_posts",
        ["organization_id", "platform"],
    )
    op.create_index(
        "ix_content_posts_org_tier_status",
        "content_posts",
        ["organization_id", "auto_post_tier", "status"],
    )
    op.create_index(
        "ix_content_posts_scheduled_at",
        "content_posts",
        ["scheduled_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_content_posts_scheduled_at", table_name="content_posts")
    op.drop_index("ix_content_posts_org_tier_status", table_name="content_posts")
    op.drop_index("ix_content_posts_org_platform", table_name="content_posts")
    op.drop_index("ix_content_posts_org_status", table_name="content_posts")
    op.drop_index("ix_content_posts_organization_id", table_name="content_posts")
    op.drop_table("content_posts")
    op.execute("DROP TYPE IF EXISTS autoposttier")
    op.execute("DROP TYPE IF EXISTS contentstatus")
    op.execute("DROP TYPE IF EXISTS contentsourcetype")
    op.execute("DROP TYPE IF EXISTS contentplatform")
