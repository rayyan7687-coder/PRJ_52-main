"""Add explicit user location-sharing fields.

Revision ID: 0002_add_location_sharing
Revises: 0001_initial_schema
Create Date: 2026-09-22
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_location_sharing"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 0001 uses metadata for its initial baseline. Checking first keeps a fresh
    # database and an already-migrated development database both safe.
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}
    if "location_sharing_enabled" not in columns:
        op.add_column("users", sa.Column("location_sharing_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))
    if "location_updated_at" not in columns:
        op.add_column("users", sa.Column("location_updated_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}
    if "location_updated_at" in columns:
        op.drop_column("users", "location_updated_at")
    if "location_sharing_enabled" in columns:
        op.drop_column("users", "location_sharing_enabled")
