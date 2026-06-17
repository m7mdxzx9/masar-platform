#!/bin/bash
# Script to backup the Masar PostgreSQL database

# Load environment variables from .env if available
if [ -f ../.env ]; then
  source ../.env
fi

# Set default values if env variables are missing
DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-masar}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}

# Create backup directory if it doesn't exist
BACKUP_DIR="$(dirname "$0")/archives"
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/masar_backup_$TIMESTAMP.sql.gz"

echo "Starting database backup for $DB_NAME..."

# Run pg_dump and compress
# NOTE: Make sure PGPASSWORD is set in environment or ~/.pgpass is configured
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup completed successfully: $BACKUP_FILE"
  # Keep only the last 7 backups (Optional cleanup)
  ls -t "$BACKUP_DIR"/masar_backup_*.sql.gz | tail -n +8 | xargs -r rm --
else
  echo "Backup failed!"
  exit 1
fi
