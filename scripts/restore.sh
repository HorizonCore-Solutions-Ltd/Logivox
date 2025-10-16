#!/bin/bash

# FlowStock Database Restore Script
# Restores database from backup

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres-service}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-flowstock}"
POSTGRES_USER="${POSTGRES_USER:-flowstock}"
S3_BUCKET="${S3_BUCKET:-}"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# List available backups
list_backups() {
    log "Available local backups:"
    ls -lh "${BACKUP_DIR}"/flowstock_backup_*.sql.gz 2>/dev/null || log "No local backups found"
    
    if [ -n "${S3_BUCKET}" ]; then
        log ""
        log "Available S3 backups:"
        aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive | grep flowstock_backup
    fi
}

# Download from S3
download_from_s3() {
    local BACKUP_FILE=$1
    
    if [ -n "${S3_BUCKET}" ]; then
        log "Downloading from S3: ${BACKUP_FILE}"
        aws s3 cp "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" "${BACKUP_DIR}/${BACKUP_FILE}"
        log "Downloaded successfully"
    fi
}

# Restore database
restore_database() {
    local BACKUP_FILE=$1
    local BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
    
    if [ ! -f "${BACKUP_PATH}" ]; then
        log "ERROR: Backup file not found: ${BACKUP_PATH}"
        return 1
    fi
    
    log "Starting database restore from: ${BACKUP_FILE}"
    
    # Verify backup file
    if ! gzip -t "${BACKUP_PATH}" 2>/dev/null; then
        log "ERROR: Backup file is corrupted"
        return 1
    fi
    
    # Create backup of current database before restore
    log "Creating safety backup of current database..."
    SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -F c \
        | gzip -9 > "${BACKUP_DIR}/${SAFETY_BACKUP}"
    log "Safety backup created: ${SAFETY_BACKUP}"
    
    # Drop existing connections
    log "Terminating existing connections..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}' AND pid <> pg_backend_pid();"
    
    # Drop and recreate database
    log "Dropping and recreating database..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
    
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d postgres \
        -c "CREATE DATABASE ${POSTGRES_DB};"
    
    # Restore backup
    log "Restoring database..."
    gunzip -c "${BACKUP_PATH}" | PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -v \
        --no-owner \
        --no-acl
    
    log "Database restore completed successfully"
    return 0
}

# Verify restore
verify_restore() {
    log "Verifying restore..."
    
    # Check if database is accessible
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -p "${POSTGRES_PORT}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" > /dev/null
    
    if [ $? -eq 0 ]; then
        log "Restore verification successful"
        
        # Run migrations to ensure schema is up to date
        log "Running migrations..."
        npx prisma migrate deploy
        
        return 0
    else
        log "ERROR: Restore verification failed"
        return 1
    fi
}

# Main execution
main() {
    log "=== FlowStock Database Restore ==="
    
    # Check if backup file specified
    if [ -z "$1" ]; then
        log "ERROR: No backup file specified"
        log ""
        log "Usage: $0 <backup_file> [--from-s3]"
        log ""
        list_backups
        exit 1
    fi
    
    BACKUP_FILE=$1
    FROM_S3=$2
    
    # Download from S3 if requested
    if [ "${FROM_S3}" == "--from-s3" ]; then
        download_from_s3 "${BACKUP_FILE}"
    fi
    
    # Confirmation prompt
    read -p "WARNING: This will REPLACE the current database. Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
    
    # Perform restore
    if restore_database "${BACKUP_FILE}"; then
        if verify_restore; then
            log "=== Restore Process Completed Successfully ==="
            exit 0
        else
            log "=== Restore Process Failed (Verification) ==="
            exit 1
        fi
    else
        log "=== Restore Process Failed ==="
        exit 1
    fi
}

# Run main function
main "$@"
