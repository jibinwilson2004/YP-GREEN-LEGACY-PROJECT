from alembic import op

revision = "0003_expand_tree_id_length"
down_revision = "0002_add_country_to_trees"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Safely alter column length for PostgreSQL
    op.execute("ALTER TABLE trees ALTER COLUMN id TYPE VARCHAR(120)")
    op.execute("ALTER TABLE tree_photos ALTER COLUMN tree_id TYPE VARCHAR(120)")
    op.execute("ALTER TABLE gps_readings ALTER COLUMN tree_id TYPE VARCHAR(120)")
    op.execute("ALTER TABLE verifications ALTER COLUMN tree_id TYPE VARCHAR(120)")
    op.execute("ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(200)")


def downgrade() -> None:
    op.execute("ALTER TABLE audit_logs ALTER COLUMN entity_id TYPE VARCHAR(100)")
    op.execute("ALTER TABLE verifications ALTER COLUMN tree_id TYPE VARCHAR(40)")
    op.execute("ALTER TABLE gps_readings ALTER COLUMN tree_id TYPE VARCHAR(40)")
    op.execute("ALTER TABLE tree_photos ALTER COLUMN tree_id TYPE VARCHAR(40)")
    op.execute("ALTER TABLE trees ALTER COLUMN id TYPE VARCHAR(40)")

