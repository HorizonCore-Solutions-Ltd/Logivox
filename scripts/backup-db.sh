#!/bin/bash
# =============================================================================
# LOGIVOX WMS - DATABASE BACKUP SCRIPT
# =============================================================================
# This script creates a backup of the PostgreSQL database and uploads it to
# cloud storage (AWS S3 or Azure Blob Storage)
#
# Usage:
#   ./backup-db.sh [environment]
#
# Arguments:
#   environment - Optional: production, staging, or development (default: production)
#
# Requirements:
#   - PostgreSQL client tools (pg_dump)
#   - AWS CLI (for S3) or Azure CLI (for Azure Blob)
#   - Environment variables configured
# =============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Environment (default: production)
ENVIRONMENT="${1:-production}"

# Backup settings
BACKUP_DIR="${BACKUP_DIR:-/tmp/logivox-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILENAME="logivox-${ENVIRONMENT}-${TIMESTAMP}.sql.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "${BACKUP_DIR}/${BACKUP_FILENAME}"
}

# Trap errors and cleanup
trap cleanup EXIT ERR

# -----------------------------------------------------------------------------
# VALIDATE REQUIREMENTS
# -----------------------------------------------------------------------------

log_info "Validating requirements..."

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if gzip is installed
if ! command -v gzip &> /dev/null; then
    log_error "gzip not found. Please install gzip."
    exit 1
fi

# Load environment variables
if [ -f "${PROJECT_ROOT}/.env" ]; then
    log_info "Loading environment variables from .env"
    export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs)
elif [ -f "${PROJECT_ROOT}/.env.${ENVIRONMENT}" ]; then
    log_info "Loading environment variables from .env.${ENVIRONMENT}"
    export $(grep -v '^#' "${PROJECT_ROOT}/.env.${ENVIRONMENT}" | xargs)
else
    log_warn "No .env file found. Using system environment variables."
fi

# Validate DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL is not set. Please set it in your environment."
    exit 1
fi

log_info "Requirements validated ✓"

# -----------------------------------------------------------------------------
# CREATE BACKUP
# -----------------------------------------------------------------------------

log_info "Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

log_info "Starting database backup for environment: ${ENVIRONMENT}"
log_info "Backup file: ${BACKUP_FILENAME}"

# Create database dump and compress
log_info "Dumping database..."
pg_dump "${DATABASE_URL}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "${BACKUP_DIR}/${BACKUP_FILENAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)
log_info "Backup created successfully (${BACKUP_SIZE})"

# -----------------------------------------------------------------------------
# UPLOAD TO CLOUD STORAGE
# -----------------------------------------------------------------------------

# Check which cloud provider is configured
if [ -n "${AWS_S3_BUCKET:-}" ] && command -v aws &> /dev/null; then
    log_info "Uploading backup to AWS S3..."
    
    S3_PATH="s3://${AWS_S3_BUCKET}/backups/${ENVIRONMENT}/${BACKUP_FILENAME}"
    
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILENAME}" "${S3_PATH}" \
        --storage-class STANDARD_IA \
        --metadata "environment=${ENVIRONMENT},timestamp=${TIMESTAMP}"
    
    log_info "Backup uploaded to S3: ${S3_PATH}"
    
    # Delete old backups
    log_info "Deleting backups older than ${RETENTION_DAYS} days..."
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    
    aws s3 ls "s3://${AWS_S3_BUCKET}/backups/${ENVIRONMENT}/" \
        | while read -r line; do
            BACKUP_DATE=$(echo "$line" | awk '{print $1}')
            BACKUP_FILE=$(echo "$line" | awk '{print $4}')
            
            if [[ "$BACKUP_DATE" < "$CUTOFF_DATE" ]]; then
                log_info "Deleting old backup: ${BACKUP_FILE}"
                aws s3 rm "s3://${AWS_S3_BUCKET}/backups/${ENVIRONMENT}/${BACKUP_FILE}"
            fi
        done

elif [ -n "${AZURE_STORAGE_ACCOUNT_NAME:-}" ] && command -v az &> /dev/null; then
    log_info "Uploading backup to Azure Blob Storage..."
    
    CONTAINER_NAME="${AZURE_STORAGE_CONTAINER:-logivox-backups}"
    BLOB_PATH="backups/${ENVIRONMENT}/${BACKUP_FILENAME}"
    
    az storage blob upload \
        --account-name "${AZURE_STORAGE_ACCOUNT_NAME}" \
        --container-name "${CONTAINER_NAME}" \
        --name "${BLOB_PATH}" \
        --file "${BACKUP_DIR}/${BACKUP_FILENAME}" \
        --tier Cool
    
    log_info "Backup uploaded to Azure: ${BLOB_PATH}"
    
    # Delete old backups
    log_info "Deleting backups older than ${RETENTION_DAYS} days..."
    CUTOFF_TIMESTAMP=$(date -d "${RETENTION_DAYS} days ago" +%s)
    
    az storage blob list \
        --account-name "${AZURE_STORAGE_ACCOUNT_NAME}" \
        --container-name "${CONTAINER_NAME}" \
        --prefix "backups/${ENVIRONMENT}/" \
        --output json \
        | jq -r '.[] | "\(.properties.lastModified) \(.name)"' \
        | while read -r last_modified blob_name; do
            BLOB_TIMESTAMP=$(date -d "$last_modified" +%s)
            
            if [ "$BLOB_TIMESTAMP" -lt "$CUTOFF_TIMESTAMP" ]; then
                log_info "Deleting old backup: ${blob_name}"
                az storage blob delete \
                    --account-name "${AZURE_STORAGE_ACCOUNT_NAME}" \
                    --container-name "${CONTAINER_NAME}" \
                    --name "${blob_name}"
            fi
        done

else
    log_warn "No cloud storage configured. Backup saved locally only."
    log_warn "Configure AWS_S3_BUCKET or AZURE_STORAGE_ACCOUNT_NAME for cloud uploads."
    
    # Keep local backups for retention period
    log_info "Deleting local backups older than ${RETENTION_DAYS} days..."
    find "${BACKUP_DIR}" -name "logivox-${ENVIRONMENT}-*.sql.gz" -mtime +${RETENTION_DAYS} -delete
fi

# -----------------------------------------------------------------------------
# CREATE BACKUP METADATA
# -----------------------------------------------------------------------------

METADATA_FILE="${BACKUP_DIR}/backup-metadata.json"

cat > "${METADATA_FILE}" <<EOF
{
  "environment": "${ENVIRONMENT}",
  "timestamp": "${TIMESTAMP}",
  "filename": "${BACKUP_FILENAME}",
  "size": "${BACKUP_SIZE}",
  "database_url": "$(echo ${DATABASE_URL} | sed -E 's/:([^:@]+)@/:***@/')",
  "created_by": "$(whoami)",
  "hostname": "$(hostname)",
  "retention_days": ${RETENTION_DAYS}
}
EOF

log_info "Backup metadata saved to: ${METADATA_FILE}"

# -----------------------------------------------------------------------------
# VERIFY BACKUP
# -----------------------------------------------------------------------------

log_info "Verifying backup integrity..."

# Test gzip file
if gzip -t "${BACKUP_DIR}/${BACKUP_FILENAME}"; then
    log_info "Backup integrity verified ✓"
else
    log_error "Backup integrity check failed!"
    exit 1
fi

# -----------------------------------------------------------------------------
# COMPLETION
# -----------------------------------------------------------------------------

log_info "=========================================="
log_info "BACKUP COMPLETED SUCCESSFULLY"
log_info "=========================================="
log_info "Environment: ${ENVIRONMENT}"
log_info "Filename: ${BACKUP_FILENAME}"
log_info "Size: ${BACKUP_SIZE}"
log_info "Location: ${BACKUP_DIR}/${BACKUP_FILENAME}"
log_info "Timestamp: $(date)"
log_info "=========================================="

# Send notification (if configured)
if [ -n "${SLACK_WEBHOOK:-}" ]; then
    curl -X POST "${SLACK_WEBHOOK}" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ Database backup completed successfully\n\nEnvironment: ${ENVIRONMENT}\nFilename: ${BACKUP_FILENAME}\nSize: ${BACKUP_SIZE}\"}"
fi

exit 0
