from alembic import op

revision = "0002_add_country_to_trees"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE trees ADD COLUMN IF NOT EXISTS country VARCHAR(100)")


def downgrade() -> None:
    op.execute("ALTER TABLE trees DROP COLUMN IF EXISTS country")

