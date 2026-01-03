#!/bin/bash

# FlowStock Database Backup Script
# Runs automated backups with rotation

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres-service}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-flowstock}"
POSTGRES_USER="${POSTGRES_USER:-flowstock}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${S3_BUCKET:-}"

# Timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="flowstock_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Backup database
backup_database() {
    log "Starting database backup..."
    
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -F c \
        -b \
        -v \
        -f "${BACKUP_PATH}.custom"
    
    # Compress backup
    gzip -9 "${BACKUP_PATH}.custom"
    mv "${BACKUP_PATH}.custom.gz" "${BACKUP_PATH}"
    
    log "Backup completed: ${BACKUP_FILE}"
    
    # Get file size
    SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
    log "Backup size: ${SIZE}"
}

# Upload to S3 (if configured)
upload_to_s3() {
    if [ -n "${S3_BUCKET}" ]; then
        log "Uploading to S3..."
        
        aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" \
            --storage-class STANDARD_IA
        
        log "Uploaded to S3: s3://${S3_BUCKET}/backups/${BACKUP_FILE}"
    fi
}

# Rotate old backups
rotate_backups() {
    log "Rotating old backups..."
    
    # Delete local backups older than retention period
    find "${BACKUP_DIR}" -name "flowstock_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Count remaining backups
    COUNT=$(find "${BACKUP_DIR}" -name "flowstock_backup_*.sql.gz" -type f | wc -l)
    log "Local backups remaining: ${COUNT}"
    
    # Rotate S3 backups if configured
    if [ -n "${S3_BUCKET}" ]; then
        # S3 lifecycle policies should handle rotation
        log "S3 backups managed by lifecycle policies"
    fi
}

# Verify backup
verify_backup() {
    log "Verifying backup..."
    
    if [ -f "${BACKUP_PATH}" ]; then
        # Check if file is valid gzip
        if gzip -t "${BACKUP_PATH}" 2>/dev/null; then
            log "Backup verification successful"
            return 0
        else
            log "ERROR: Backup file is corrupted"
            return 1
        fi
    else
        log "ERROR: Backup file not found"
        return 1
    fi
}

# Send notification
send_notification() {
    local STATUS=$1
    local MESSAGE=$2
    
    if [ -n "${SLACK_WEBHOOK}" ]; then
        curl -X POST "${SLACK_WEBHOOK}" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"[FlowStock Backup] ${STATUS}: ${MESSAGE}\"}"
    fi
    
    if [ -n "${EMAIL_TO}" ]; then
        echo "${MESSAGE}" | mail -s "[FlowStock] Backup ${STATUS}" "${EMAIL_TO}"
    fi
}

# Main execution
main() {
    log "=== FlowStock Database Backup Started ==="
    
    # Run backup
    if backup_database; then
        if verify_backup; then
            upload_to_s3
            rotate_backups
            
            send_notification "SUCCESS" "Database backup completed: ${BACKUP_FILE}"
            log "=== Backup Process Completed Successfully ==="
            exit 0
        else
            send_notification "FAILED" "Backup verification failed"
            log "=== Backup Process Failed (Verification) ==="
            exit 1
        fi
    else
        send_notification "FAILED" "Database backup failed"
        log "=== Backup Process Failed ==="
        exit 1
    fi
}

# Run main function
main
