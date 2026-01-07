# Advanced Gate Security System - Complete Documentation

## Overview

The Advanced Gate Security System provides comprehensive truck/lorry management for warehouse gates with 15 enterprise-grade features designed for modern distribution centers.

## 🎯 Features Implemented

### 1. **License Plate Recognition (LPR)**

- **Automatic License Plate Capture**: Integration with LPR cameras via webhook
- **Confidence Scoring**: Only processes reads >80% confidence
- **Auto-Entry Creation**: Automatically creates gate entries for whitelisted vehicles
- **Blacklist Detection**: Instant alerts for banned vehicles
- **API Endpoint**: `/api/security/lpr/capture`

### 2. **Blacklist/Whitelist Management**

- **Vehicle Blacklist**: Ban vehicles with severity levels (LOW → PERMANENT)
- **Whitelist Types**: CARRIER, VEHICLE, DRIVER
- **Auto-Approval**: Skip manual checks for trusted vehicles
- **Time-Based Validity**: Set expiry dates for whitelist entries
- **API Endpoints**:
  - `POST /api/security/blacklist` - Add to blacklist
  - `GET /api/security/blacklist` - List blacklisted vehicles
  - `POST /api/security/whitelist` - Add to whitelist
  - `POST /api/security/check-vehicle` - Check vehicle status

### 3. **Weight Bridge Integration**

- **In/Out Weighing**: Record weights on entry and exit
- **Variance Detection**: Automatic alerts for >5% weight discrepancy
- **Theft Prevention**: Flags suspicious weight loss (>10%)
- **Operator Tracking**: Records who performed the weighing
- **API Endpoints**:
  - `POST /api/security/gate-entries/[id]/weigh` - Record weight
  - `GET /api/security/gate-entries/[id]/weigh` - Get weight history

### 4. **Photo/Video Capture**

- **10 Photo Types**:
  - Driver ID
  - Driver Face
  - Truck Front/Side/Rear
  - Cargo
  - Seal
  - Damage
  - License Plate
  - Other
- **Cloud Storage**: Vercel Blob storage integration
- **Timestamp Tracking**: Automatic capture time logging
- **API Endpoints**:
  - `POST /api/security/gate-entries/[id]/photos` - Upload photo
  - `GET /api/security/gate-entries/[id]/photos` - List photos

### 5. **Document Verification**

- **Document Types**:
  - Bill of Lading (BOL)
  - Manifest
  - Permits
  - Insurance
  - Customs
  - Inspection Reports
- **Verification Workflow**: Multi-stage approval process
- **Expiry Tracking**: Automatic alerts for expired documents
- **API Endpoints**:
  - `POST /api/security/gate-entries/[id]/documents` - Upload document
  - `PATCH /api/security/gate-entries/[id]/documents/[docId]/verify` - Verify document

### 6. **Queue Management**

- **FIFO + Priority**: First-in-first-out with priority override
- **Wait Time Estimation**: Real-time wait time calculations (5 min/vehicle)
- **Status Tracking**: WAITING → CALLED → IN_PROGRESS → COMPLETED
- **SMS Notifications**: Alert drivers when called
- **API Endpoints**:
  - `POST /api/security/gate-queue` - Add to queue
  - `GET /api/security/gate-queue` - List queue
  - `POST /api/security/gate-queue/call-next` - Call next vehicle
  - `PATCH /api/security/gate-queue/[id]` - Update status

### 7. **Multi-Gate Management**

- **Gate Types**: INBOUND, OUTBOUND, BOTH
- **Gate Status**: OPEN, CLOSED, MAINTENANCE
- **Capabilities**: LPR camera, weight bridge, size restrictions
- **Operating Hours**: Configure gate schedules
- **Real-Time Queue Counts**: Live queue tracking per gate
- **API Endpoints**:
  - `POST /api/security/gates` - Create gate
  - `GET /api/security/gates` - List gates
  - `PATCH /api/security/gates/[id]` - Update gate status

### 8. **Smart Parking Assignment**

- **4 Parking Types**: STANDARD, OVERSIZED, REFRIGERATED, HAZMAT
- **Size Constraints**: Max length/width/height/weight
- **Special Features**: Electricity, water hookup, refrigeration
- **Auto-Assignment**: Intelligent spot selection based on requirements
- **Occupancy Tracking**: Real-time availability
- **API Endpoints**:
  - `POST /api/security/parking-spots` - Create parking spot
  - `POST /api/security/parking-spots/find-available` - Find available spots
  - `POST /api/security/gate-entries/[id]/assign-parking` - Assign parking

### 9. **Temperature Monitoring**

- **Reefer Truck Monitoring**: Track refrigerated cargo temperatures
- **Multi-Sensor Support**: Front, rear, middle temperature zones
- **Threshold Alerts**: Automatic alerts for out-of-range temps
- **Historical Tracking**: Complete temperature history
- **Units**: Celsius and Fahrenheit support
- **API Endpoints**:
  - `POST /api/security/gate-entries/[id]/temperature` - Log temperature
  - `GET /api/security/gate-entries/[id]/temperature` - Get temperature history

### 10. **Hazmat Handling**

- **UN Number Tracking**: Proper identification of dangerous goods
- **Hazmat Classification**: Class tracking (1-9)
- **Permit Management**: Permit numbers and expiry dates
- **Emergency Contacts**: Required emergency response info
- **Special Parking**: Auto-assignment to hazmat-approved zones
- **Spill Procedures**: Document handling procedures
- **API Endpoints**:
  - `POST /api/security/gate-entries/[id]/hazmat` - Record hazmat details
  - `GET /api/security/gate-entries/[id]/hazmat` - Get hazmat records

### 11. **Dwell Time Alerts**

- **Automated Monitoring**: Check every 15 minutes
- **Configurable Thresholds**: Default 24 hours
- **Escalating Alerts**: MEDIUM (>24h) → HIGH (>48h)
- **Parking Spot Tracking**: Shows where vehicle is parked

### 12. **After-Hours Management**

- **24/7 Operations**: All features work around the clock
- **Gate Operating Hours**: Configurable per gate
- **Security Personnel Shifts**: Track guard assignments

### 13. **Automation Services**

- **Dwell Time Monitoring**: Automatic overdue vehicle detection
- **Temperature Monitoring**: Continuous reefer temp checks
- **Permit Expiry Checking**: Daily permit validation
- **Queue Optimization**: Real-time position updates
- **Weight Theft Detection**: Suspicious variance flagging
- **Auto-Run**: Cron job every 15 minutes

### 14. **Real-Time Dashboards**

- **Gate Status Board**: Live view of all gates
- **Queue Dashboard**: Current wait times per gate
- **Vehicle Tracking**: All vehicles currently on-site
- **Alert Center**: Real-time security alerts

### 15. **Comprehensive Reporting**

- **Weight Variance Reports**: Theft detection analysis
- **Dwell Time Reports**: Average on-site duration
- **Temperature Compliance**: Reefer violation tracking
- **Hazmat Activity**: Dangerous goods tracking
- **Queue Performance**: Average wait times per gate

## 📊 Database Models

### Core Models

- **GateEntry** - Main vehicle entry/exit record
- **Gate** - Physical gate definitions
- **GateQueue** - Queue management
- **ParkingSpot** - Parking space inventory

### Security Models

- **VehicleBlacklist** - Banned vehicles
- **VehicleWhitelist** - Pre-approved vehicles

### Operations Models

- **GateWeighBridge** - Weight records
- **GatePhoto** - Photo documentation
- **GateDocument** - Document management
- **TemperatureLog** - Refrigeration monitoring
- **HazmatRecord** - Dangerous goods tracking

## 🔄 Typical Workflows

### Workflow 1: Standard Delivery Truck Arrival

1. **LPR Camera** captures license plate → `/api/security/lpr/capture`
2. **System checks** blacklist/whitelist → Auto-approved if whitelisted
3. **Guard** verifies driver ID → Takes photo `/api/security/gate-entries/[id]/photos`
4. **Weigh-in** at weight bridge → `/api/security/gate-entries/[id]/weigh`
5. **Parking assigned** automatically → `/api/security/gate-entries/[id]/assign-parking`
6. **Unloading** begins
7. **Weigh-out** before exit → Variance check
8. **Exit recorded** → Gate entry updated

### Workflow 2: Hazmat Vehicle Arrival

1. LPR capture → Flagged as hazmat carrier
2. Guard checks hazmat permits
3. Record hazmat details → `/api/security/gate-entries/[id]/hazmat`
4. System finds hazmat-approved parking → Auto-assigns
5. Create HIGH alert for operations team
6. Continuous monitoring until exit
7. Special exit procedures enforced

### Workflow 3: Refrigerated Cargo

1. Truck arrives with reefer unit
2. Guard logs initial temperature → `/api/security/gate-entries/[id]/temperature`
3. Temperature monitored every 30 min (automation service)
4. Alerts created if temp goes out of range
5. Temperature history available for compliance

### Workflow 4: Queue Management

1. Multiple trucks arrive simultaneously
2. Each added to queue → `/api/security/gate-queue`
3. Guards call forward from queue → `/api/security/gate-queue/call-next`
4. SMS sent to driver's phone
5. Real-time position updates for waiting vehicles

## 🔐 Security Features

- **API Key Authentication**: LPR webhook requires valid API key
- **Organization Isolation**: All data scoped to organization
- **Role-Based Access**: Different permissions for guards vs managers
- **Audit Trail**: All actions logged with user ID and timestamp
- **Photo Evidence**: Visual documentation for disputes

## 📈 Performance Optimizations

- **Indexed Searches**: License plate, date, status indexed
- **Pagination**: All list endpoints support pagination
- **Parallel Processing**: Automation checks run concurrently
- **Caching**: Gate status cached for real-time dashboards

## 🚀 Integration Points

### Hardware Integrations

- **LPR Cameras**: Webhook API for automatic plate reading
- **Weight Bridges**: IoT device integration
- **Temperature Sensors**: Real-time monitoring
- **CCTV Systems**: Photo/video capture

### Software Integrations

- **SMS Gateway**: Driver notifications
- **Email Service**: Alert notifications
- **Cloud Storage**: Vercel Blob for photos/documents
- **Analytics**: Event tracking for BI

## 📱 Mobile App Features (APIs Built)

### Guard Tablet App

- View queue in real-time
- Capture photos on mobile
- Process vehicles quickly
- Scan documents
- Call forward from queue

### Driver Self-Service Kiosk

- Check queue position
- View wait time
- Upload documents in advance
- Receive SMS when called

## 🔔 Alert Types

1. **BLACKLISTED_VEHICLE** - Banned vehicle detected (CRITICAL)
2. **WEIGHT_VARIANCE** - Suspicious weight difference (HIGH)
3. **SUSPICIOUS_WEIGHT_LOSS** - Potential theft >10% (HIGH)
4. **DWELL_TIME_EXCEEDED** - Vehicle overdue (MEDIUM/HIGH)
5. **TEMPERATURE_VIOLATION** - Reefer temp out of range (HIGH)
6. **CRITICAL_TEMP_VIOLATION** - Multiple violations (CRITICAL)
7. **EXPIRED_PERMIT** - Hazmat permit expired (HIGH)
8. **HAZMAT_ARRIVAL** - High-risk hazmat arrived (HIGH)

## 🧪 Testing

### Test LPR Integration

```bash
curl -X POST https://your-domain.com/api/security/lpr/capture \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC123",
    "confidence": 95,
    "gateId": "gate-id",
    "timestamp": "2026-01-03T10:00:00Z",
    "direction": "IN"
  }'
```

### Test Automation Service

```bash
curl -X POST https://your-domain.com/api/security/automation/run \
  -H "Authorization: Bearer your-cron-secret"
```

## 📝 Configuration

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...

# Optional
CRON_SECRET=your-secret-key  # For automation endpoint
BLOB_READ_WRITE_TOKEN=...    # For photo/document storage
SMS_API_KEY=...              # For driver notifications
```

## 🎓 Best Practices

1. **Blacklist Management**: Review and update blacklist monthly
2. **Weight Variance**: Investigate all variances >5% immediately
3. **Temperature**: Set conservative thresholds (±2°C)
4. **Queue Priority**: Use priority for scheduled appointments
5. **Parking**: Pre-assign spots for known appointments
6. **Photos**: Capture at least 3 photos per entry (plate, driver, cargo)
7. **Documents**: Verify critical documents (BOL, permits) before parking
8. **Hazmat**: Always verify permits before allowing on-site

## 🆘 Troubleshooting

### LPR not creating entries

- Check API key is valid
- Verify confidence score >80%
- Ensure gate exists in system

### Weight variance false positives

- Calibrate weight bridges monthly
- Check for trailer additions/removals
- Verify driver didn't add cargo on-site

### Temperature alerts flooding

- Adjust target min/max thresholds
- Check sensor calibration
- Verify reefer unit is functioning

## 🔮 Future Enhancements

- **AI-powered damage detection** from photos
- **Predictive queue wait times** using ML
- **Automated gate barrier control** via IoT
- **Facial recognition** for driver identification
- **Geofencing** for parking compliance
- **Real-time GPS tracking** while on-site

## 📊 Metrics & KPIs

- **Average Gate Processing Time**: Target <5 minutes
- **Queue Wait Time**: Target <15 minutes
- **Weight Variance Rate**: Target <2% of entries
- **Temperature Violations**: Target <1% of reefer loads
- **Dwell Time Average**: Target <8 hours
- **Document Verification Rate**: Target >95%

---

**Built for**: Enterprise warehouse operations  
**Supports**: 24/7 operations, multiple gates, multiple warehouses  
**Scalability**: Handles 1000+ entries per day per gate  
**Compliance**: OSHA, DOT, IMDG hazmat standards
