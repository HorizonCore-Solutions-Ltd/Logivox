#!/bin/bash
# =============================================================================
# LOGIVOX WMS - DATABASE RESTORE SCRIPT
# =============================================================================
# This script restores a PostgreSQL database from a backup file
#
# Usage:
#   ./restore-db.sh <backup-file> [environment]
#
# Arguments:
#   backup-file - Path to backup file or S3/Azure URI
#   environment - Optional: production, staging, or development (default: production)
#
# Examples:
#   ./restore-db.sh /tmp/logivox-backups/logivox-production-20260103-120000.sql.gz
#   ./restore-db.sh s3://logivox-backups/backups/production/logivox-production-20260103-120000.sql.gz
#
# ⚠️  WARNING: This will DROP and RECREATE the database!
# =============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# -----------------------------------------------------------------------------
# FUNCTIONS
# -----------------------------------------------------------------------------

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_prompt() {
    echo -e "${BLUE}[PROMPT]${NC} $1"
}

show_usage() {
    echo "Usage: $0 <backup-file> [environment]"
    echo ""
    echo "Arguments:"
    echo "  backup-file  Path to backup file (local, S3, or Azure)"
    echo "  environment  Optional: production, staging, development (default: production)"
    echo ""
    echo "Examples:"
    echo "  $0 /tmp/logivox-backups/logivox-production-20260103-120000.sql.gz"
    echo "  $0 s3://logivox-backups/backups/production/logivox-production-20260103-120000.sql.gz"
    exit 1
}

# -----------------------------------------------------------------------------
# VALIDATE ARGUMENTS
# -----------------------------------------------------------------------------

if [ $# -lt 1 ]; then
    log_error "Missing required argument: backup-file"
    show_usage
fi

BACKUP_FILE="$1"
ENVIRONMENT="${2:-production}"
TEMP_DIR="/tmp/logivox-restore-$$"

log_info "Restore configuration:"
log_info "  Backup file: ${BACKUP_FILE}"
log_info "  Environment: ${ENVIRONMENT}"

# -----------------------------------------------------------------------------
# VALIDATE REQUIREMENTS
# -----------------------------------------------------------------------------

log_info "Validating requirements..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    log_error "psql not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if gunzip is installed
if ! command -v gunzip &> /dev/null; then
    log_error "gunzip not found. Please install gzip."
    exit 1
fi

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    log_info "Loading environment variables from .env"
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
elif [ -f "${PROJECT_ROOT}/.env.${ENVIRONMENT}" ]; then
    log_info "Loading environment variables from .env.${ENVIRONMENT}"
    export $(grep -v '^#' "${PROJECT_ROOT}/.env.${ENVIRONMENT}" | xargs)
fi

# Validate DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL is not set. Please set it in your environment."
    exit 1
fi

# -----------------------------------------------------------------------------
# DOWNLOAD BACKUP FILE (if remote)
# -----------------------------------------------------------------------------

LOCAL_BACKUP_FILE=""

if [[ "${BACKUP_FILE}" == s3://* ]]; then
    log_info "Downloading backup from AWS S3..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi
    
    mkdir -p "${TEMP_DIR}"
    LOCAL_BACKUP_FILE="${TEMP_DIR}/$(basename ${BACKUP_FILE})"
    
    aws s3 cp "${BACKUP_FILE}" "${LOCAL_BACKUP_FILE}"
    log_info "Download complete"

elif [[ "${BACKUP_FILE}" == https://*.blob.core.windows.net/* ]]; then
    log_info "Downloading backup from Azure Blob Storage..."
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install Azure CLI."
        exit 1
    fi
    
    mkdir -p "${TEMP_DIR}"
    LOCAL_BACKUP_FILE="${TEMP_DIR}/$(basename ${BACKUP_FILE})"
    
    # Parse Azure URL and download
    az storage blob download --file "${LOCAL_BACKUP_FILE}" --blob-url "${BACKUP_FILE}"
    log_info "Download complete"

else
    # Local file
    if [ ! -f "${BACKUP_FILE}" ]; then
        log_error "Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
    
    LOCAL_BACKUP_FILE="${BACKUP_FILE}"
fi

# -----------------------------------------------------------------------------
# VERIFY BACKUP FILE
# -----------------------------------------------------------------------------

log_info "Verifying backup file integrity..."

if ! gzip -t "${LOCAL_BACKUP_FILE}"; then
    log_error "Backup file is corrupted or invalid!"
    exit 1
fi

BACKUP_SIZE=$(du -h "${LOCAL_BACKUP_FILE}" | cut -f1)
log_info "Backup file verified (${BACKUP_SIZE})"

# -----------------------------------------------------------------------------
# SAFETY CONFIRMATION
# -----------------------------------------------------------------------------

log_warn "=========================================="
log_warn "⚠️  DATABASE RESTORE WARNING ⚠️"
log_warn "=========================================="
log_warn "This will DROP and RECREATE the database!"
log_warn "Environment: ${ENVIRONMENT}"
log_warn "Database: ${DATABASE_URL}"
log_warn "Backup: ${BACKUP_FILE}"
log_warn "=========================================="

# Only require confirmation for production
if [ "${ENVIRONMENT}" == "production" ]; then
    log_prompt "Type 'YES' to confirm restore to PRODUCTION: "
    read -r CONFIRMATION
    
    if [ "${CONFIRMATION}" != "YES" ]; then
        log_info "Restore cancelled by user."
        exit 0
    fi
else
    log_prompt "Type 'yes' to confirm restore: "
    read -r CONFIRMATION
    
    if [ "${CONFIRMATION}" != "yes" ]; then
        log_info "Restore cancelled by user."
        exit 0
    fi
fi

# -----------------------------------------------------------------------------
# CREATE PRE-RESTORE BACKUP
# -----------------------------------------------------------------------------

log_info "Creating pre-restore backup (safety measure)..."

PRE_RESTORE_BACKUP="${TEMP_DIR}/pre-restore-backup-$(date +%Y%m%d-%H%M%S).sql.gz"
mkdir -p "${TEMP_DIR}"

pg_dump "${DATABASE_URL}" \
    --no-owner \
    --no-acl \
    | gzip > "${PRE_RESTORE_BACKUP}"

log_info "Pre-restore backup saved to: ${PRE_RESTORE_BACKUP}"

# -----------------------------------------------------------------------------
# RESTORE DATABASE
# -----------------------------------------------------------------------------

log_info "Starting database restore..."

# Terminate existing connections
log_info "Terminating existing database connections..."

DB_NAME=$(echo "${DATABASE_URL}" | sed -E 's|.*/(.*)\?.*|\1|' | sed 's/\?.*//')

psql "${DATABASE_URL}" -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
" || true

# Restore from backup
log_info "Restoring database from backup..."

gunzip -c "${LOCAL_BACKUP_FILE}" | psql "${DATABASE_URL}"

log_info "Database restored successfully"

# -----------------------------------------------------------------------------
# RUN MIGRATIONS (if needed)
# -----------------------------------------------------------------------------

log_info "Running database migrations..."

cd "${PROJECT_ROOT}"
npx prisma migrate deploy

log_info "Migrations completed"

# -----------------------------------------------------------------------------
# VERIFY RESTORE
# -----------------------------------------------------------------------------

log_info "Verifying restore..."

# Check if we can connect
if psql "${DATABASE_URL}" -c "SELECT 1;" > /dev/null 2>&1; then
    log_info "Database connection verified ✓"
else
    log_error "Failed to connect to database after restore!"
    exit 1
fi

# Check table count
TABLE_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
log_info "Tables found: ${TABLE_COUNT}"

# -----------------------------------------------------------------------------
# CLEANUP
# -----------------------------------------------------------------------------

log_info "Cleaning up temporary files..."

if [ -d "${TEMP_DIR}" ]; then
    # Keep pre-restore backup
    if [ -f "${PRE_RESTORE_BACKUP}" ]; then
        FINAL_BACKUP_DIR="${PROJECT_ROOT}/backups/pre-restore"
        mkdir -p "${FINAL_BACKUP_DIR}"
        mv "${PRE_RESTORE_BACKUP}" "${FINAL_BACKUP_DIR}/"
        log_info "Pre-restore backup saved to: ${FINAL_BACKUP_DIR}/$(basename ${PRE_RESTORE_BACKUP})"
    fi
    
    rm -rf "${TEMP_DIR}"
fi

# -----------------------------------------------------------------------------
# COMPLETION
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "RESTORE COMPLETED SUCCESSFULLY"
log_info "=========================================="
log_info "Environment: ${ENVIRONMENT}"
log_info "Backup file: ${BACKUP_FILE}"
log_info "Tables: ${TABLE_COUNT}"
log_info "Timestamp: $(date)"
log_info "=========================================="

# Send notification (if configured)
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -X POST "${SLACK_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ Database restore completed successfully\n\nEnvironment: ${ENVIRONMENT}\nBackup: ${BACKUP_FILE}\nTables: ${TABLE_COUNT}\"}"
fi

exit 0
