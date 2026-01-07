# QC Receiving Module - Environment Configuration

This document outlines the environment variables required for the Quality Control (QC) Receiving Module to function properly.

## Required Environment Variables

### Email Configuration (Vendor Notifications)

The RTV service sends email notifications to vendors when defective products need to be returned. Configure your SMTP settings:

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false  # true for 465, false for other ports
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key

# Email Sender Information
SMTP_FROM_EMAIL=qc@flowstock.com
SMTP_FROM_NAME=Flowstock Quality Control

# Optional: Reply-to address
SMTP_REPLY_TO=qc-team@flowstock.com
```

### Alternative Email Providers

#### SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_api_key_here
```

#### AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_access_key
SMTP_PASS=your_ses_secret_key
```

#### Gmail (Development Only)

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password
```

#### Mailgun

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_smtp_password
```

## Quality Control Configuration

### AQL Sampling Standards

The inspection service uses AQL (Acceptable Quality Level) standards for statistical sampling. These are configurable:

```bash
# AQL Configuration (ISO 2859-1 / ANSI/ASQ Z1.4)
QC_AQL_CRITICAL=0.0    # 0% defects allowed for critical defects
QC_AQL_MAJOR=2.5       # 2.5% defects allowed for major defects
QC_AQL_MINOR=4.0       # 4.0% defects allowed for minor defects

# Sample Size Calculation
QC_MIN_SAMPLE_SIZE=5         # Minimum sample size regardless of lot
QC_MAX_SAMPLE_SIZE=200       # Maximum sample size cap
QC_SAMPLING_LEVEL=II         # Inspection level (I, II, III)
```

### Quality Score Thresholds

Configure the thresholds for supplier quality scoring:

```bash
# Quality Score Calculation (0-100 scale)
QC_SCORE_EXCELLENT_THRESHOLD=90    # 90+ = Excellent
QC_SCORE_GOOD_THRESHOLD=75         # 75-89 = Good
QC_SCORE_FAIR_THRESHOLD=60         # 60-74 = Fair
# Below 60 = Poor

# Supplier Tier Assignment
QC_TIER_PREMIUM_THRESHOLD=90       # 90+ overall score = PREMIUM
QC_TIER_STANDARD_THRESHOLD=75      # 75-89 = STANDARD
QC_TIER_BASIC_THRESHOLD=60         # 60-74 = BASIC
# Below 60 = POOR

# Supplier Status Thresholds
QC_STATUS_PROBATION_DEFECT_RATE=5.0    # 5% defect rate triggers probation
QC_STATUS_SUSPENDED_DEFECT_RATE=10.0   # 10% defect rate triggers suspension
QC_STATUS_BLOCKED_RTV_COUNT=5           # 5+ RTVs in 90 days triggers block
```

### Defect Priority Rules

Configure automatic priority assignment for RTVs:

```bash
# RTV Priority Assignment
QC_RTV_URGENT_VALUE_THRESHOLD=10000     # RTVs > $10,000 = URGENT
QC_RTV_HIGH_VALUE_THRESHOLD=5000        # RTVs > $5,000 = HIGH
QC_RTV_CRITICAL_DEFECT_URGENT=true      # Critical defects always URGENT
```

## File Upload Configuration

Configure cloud storage for defect photos and videos:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=flowstock-qc-media

# Optional: CloudFront CDN
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net

# Maximum file sizes
QC_MAX_PHOTO_SIZE_MB=5      # 5MB per photo
QC_MAX_VIDEO_SIZE_MB=50     # 50MB per video
QC_MAX_PHOTOS_PER_DEFECT=10 # Maximum 10 photos per defect
QC_MAX_VIDEOS_PER_DEFECT=3  # Maximum 3 videos per defect
```

### Alternative Storage: Azure Blob Storage

```bash
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER=qc-media
```

### Alternative Storage: Google Cloud Storage

```bash
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=flowstock-qc-media
GCS_KEY_FILE=/path/to/service-account-key.json
```

## Report Generation

Configure PDF report generation for inspections:

```bash
# Report Configuration
QC_ENABLE_PDF_REPORTS=true
QC_REPORT_LOGO_URL=https://flowstock.com/logo.png
QC_REPORT_COMPANY_NAME=Flowstock Warehouse Management
```

## Notification Configuration

Configure additional notification channels:

```bash
# Slack Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_QC_CHANNEL=#quality-control

# SMS Notifications for Urgent RTVs (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
QC_SMS_ENABLED=false
```

## Database Configuration

Ensure your database connection is configured:

```bash
# PostgreSQL (Neon)
DATABASE_URL=postgresql://user:password@host:5432/flowstock?schema=public
```

## Development vs Production

### Development (.env.local)

```bash
NODE_ENV=development

# Use MailHog or similar for testing
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=

# Local file storage
QC_USE_LOCAL_STORAGE=true
QC_LOCAL_STORAGE_PATH=/tmp/qc-media

# Relaxed thresholds for testing
QC_AQL_MAJOR=5.0
QC_AQL_MINOR=10.0
```

### Production (.env.production)

```bash
NODE_ENV=production

# Production SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=${SENDGRID_API_KEY}
SMTP_FROM_EMAIL=qc@yourdomain.com

# Production S3
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY}
AWS_S3_BUCKET=flowstock-qc-production

# Standard AQL levels
QC_AQL_CRITICAL=0.0
QC_AQL_MAJOR=2.5
QC_AQL_MINOR=4.0
```

## Environment Variable Reference

| Variable                | Required | Default      | Description                  |
| ----------------------- | -------- | ------------ | ---------------------------- |
| `SMTP_HOST`             | Yes      | -            | SMTP server hostname         |
| `SMTP_PORT`             | Yes      | 587          | SMTP server port             |
| `SMTP_SECURE`           | No       | false        | Use TLS (true for port 465)  |
| `SMTP_USER`             | Yes      | -            | SMTP authentication username |
| `SMTP_PASS`             | Yes      | -            | SMTP authentication password |
| `SMTP_FROM_EMAIL`       | Yes      | -            | Sender email address         |
| `SMTP_FROM_NAME`        | No       | Flowstock QC | Sender display name          |
| `QC_AQL_CRITICAL`       | No       | 0.0          | Critical defect AQL level    |
| `QC_AQL_MAJOR`          | No       | 2.5          | Major defect AQL level       |
| `QC_AQL_MINOR`          | No       | 4.0          | Minor defect AQL level       |
| `QC_MIN_SAMPLE_SIZE`    | No       | 5            | Minimum inspection sample    |
| `QC_MAX_SAMPLE_SIZE`    | No       | 200          | Maximum inspection sample    |
| `QC_SAMPLING_LEVEL`     | No       | II           | ISO 2859-1 inspection level  |
| `AWS_ACCESS_KEY_ID`     | Yes\*    | -            | AWS access key for S3        |
| `AWS_SECRET_ACCESS_KEY` | Yes\*    | -            | AWS secret key for S3        |
| `AWS_S3_BUCKET`         | Yes\*    | -            | S3 bucket for media storage  |

\*Required if using AWS S3 for file storage

## Testing Email Configuration

Use the RTV service to test email notifications:

```bash
# From your terminal
curl -X POST http://localhost:3000/api/qc/rtv \
  -H "Content-Type: application/json" \
  -d '{
    "defectId": "defect_id_here",
    "organizationId": "org_123"
  }'

# Then notify vendor
curl -X PATCH http://localhost:3000/api/qc/rtv/rtv_id_here \
  -H "Content-Type: application/json" \
  -d '{
    "action": "notifyVendor"
  }'
```

Check your SMTP logs to confirm the email was sent successfully.

## Troubleshooting

### Email Not Sending

1. **Check SMTP credentials**: Verify username/password are correct
2. **Check firewall**: Ensure port 587 (or 465) is not blocked
3. **Check rate limits**: Some providers limit emails per hour
4. **Check logs**: Look for Nodemailer errors in server logs

### File Uploads Failing

1. **Check AWS credentials**: Verify access key has S3 permissions
2. **Check bucket policy**: Ensure bucket allows uploads
3. **Check file size**: Verify files don't exceed limits
4. **Check CORS**: Ensure S3 bucket has proper CORS configuration

### Quality Scores Not Calculating

1. **Run manual update**: Use the "Recalculate All" button in UI
2. **Check database**: Ensure inspection data exists
3. **Check thresholds**: Verify threshold environment variables are set
4. **Check logs**: Look for calculation errors in server logs

## Security Notes

- Never commit `.env` files to version control
- Use environment-specific files (`.env.local`, `.env.production`)
- Rotate SMTP credentials regularly
- Use IAM roles instead of access keys when running on AWS
- Enable 2FA on email provider accounts
- Restrict S3 bucket access to only necessary services

## Next Steps

After configuring environment variables:

1. Run database migration: `npx prisma migrate dev`
2. Test email sending with a test RTV
3. Upload a test photo to verify S3 integration
4. Create a test inspection to verify AQL calculations
5. Review supplier quality scores to verify scoring logic

For production deployment, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
