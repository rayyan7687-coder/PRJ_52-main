"""Create the initial BuildLoop schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-22
"""
from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The first revision deliberately uses the application's declared metadata,
    # keeping SQLite development and PostgreSQL production schemas identical.
    from app.db.database import Base
    from app.models import models  # noqa: F401
    Base.metadata.create_all(bind=op.get_bind())


def downgrade() -> None:
    from app.db.database import Base
    from app.models import models  # noqa: F401
    Base.metadata.drop_all(bind=op.get_bind())
