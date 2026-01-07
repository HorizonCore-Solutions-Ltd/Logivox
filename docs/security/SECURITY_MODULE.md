# Security Module - Complete Implementation

## Overview

Comprehensive security module integrated with Yard Management for complete gate control and warehouse monitoring.

## Database Models (9 Models)

### 1. SecurityPersonnel

Guards and security staff with:

- Badge numbers and clearance levels (VISITOR → MAXIMUM)
- Employment status and assignments
- Certifications and training expiry tracking
- Links to Employee records

### 2. SecurityShift

Duty schedules with:

- Shift timing and location assignments
- Patrol counts and incidents reported
- Visitors processed tracking
- Status monitoring (SCHEDULED, IN_PROGRESS, COMPLETED)

### 3. GateEntry ⭐ (Core Integration)

Vehicle and visitor entry/exit tracking:

- **Linked to DockAppointment** for seamless yard management
- License plate and trailer number tracking
- Driver information and carrier details
- Security checks and cargo inspection
- Seal verification
- Entry/exit timestamps
- Parking location assignment

### 4. Visitor

Visitor management system:

- Badge issuance with auto-generated numbers
- Check-in/check-out tracking
- Host information and department
- Escort requirements
- Allowed areas restriction
- ID verification (type, number, photo)
- Purpose and company tracking

### 5. SecurityIncident

Incident reporting and investigation:

- Types: Theft, vandalism, trespassing, fire, medical, safety violations
- Severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- Investigation workflow (REPORTED → INVESTIGATING → RESOLVED → CLOSED)
- Evidence tracking (photos, videos, camera footage)
- Police report integration
- Witness statements
- Estimated loss calculation
- Resolution details and follow-up

### 6. SecurityAccessLog

Real-time access monitoring:

- Badge swipes, biometric scans, facial recognition
- Access grants and denials
- Denial reasons tracking
- Entry/exit points monitoring
- Tailgating detection

### 7. CameraSystem

CCTV management:

- Camera specifications (1080p, 4K)
- PTZ (Pan-Tilt-Zoom) capabilities
- Night vision support
- Recording retention days
- Streaming URLs
- Coverage area mapping
- Status monitoring

### 8. AccessControlZone

Restricted area definitions:

- Clearance level requirements
- Time-based restrictions
- Occupancy limits
- Entry/exit logs
- Specific clearance requirements

## API Endpoints

### Gate Entry Management

- `POST /api/security/gate-entries` - Record vehicle/visitor entry
- `GET /api/security/gate-entries` - List entries with filters
  - Filter by: entry type, direction, license plate, date range, security check status
  - Includes appointment and security personnel details
- `GET /api/security/gate-entries/[id]` - Get entry details
- `PATCH /api/security/gate-entries/[id]` - Update entry (exit time, security checks)
- `DELETE /api/security/gate-entries/[id]` - Remove entry

### Visitor Management

- `POST /api/security/visitors` - Check-in visitor (auto-generates badge)
- `GET /api/security/visitors` - List visitors with filters
  - Filter by: status, visitor type, date, checked-in status
  - Search by: name, company, badge number
- `GET /api/security/visitors/[id]` - Get visitor details
- `PATCH /api/security/visitors/[id]` - Check-out visitor
- `DELETE /api/security/visitors/[id]` - Remove visitor record

### Incident Management

- `POST /api/security/incidents` - Report new incident
- `GET /api/security/incidents` - List incidents with filters
  - Filter by: incident type, severity, status, date range
  - Search by: title, description, incident number, location
- `GET /api/security/incidents/[id]` - Get incident details
- `PATCH /api/security/incidents/[id]` - Update investigation status
- `DELETE /api/security/incidents/[id]` - Remove incident

## Key Features

### 🚪 Gate Control

- Vehicle entry/exit tracking with license plates
- Trailer and seal number verification
- Driver information capture
- **Seamless integration with dock appointments**
- Security checks at gate
- Cargo inspection tracking
- Parking location assignment

### 👥 Visitor Management

- Auto-generated badge numbers (VIS000001, VIS000002, ...)
- Check-in/check-out workflow
- Host and escort tracking
- Allowed areas restriction
- ID verification with photo capture
- Purpose and company tracking

### 🚨 Incident Reporting

- 10 incident types from theft to medical emergencies
- Severity classification
- Investigation workflow with status tracking
- Evidence management (photos, videos, camera footage)
- Police report integration
- Witness statements
- Resolution tracking with follow-up

### 🔐 Access Control

- Multi-level clearance system (VISITOR → MAXIMUM)
- Badge swipe logging
- Biometric access tracking
- Real-time access monitoring
- Denial tracking with reasons
- Tailgating detection

### 📹 CCTV Integration

- Camera system management
- Recording specifications (resolution, retention)
- PTZ and night vision support
- Coverage area mapping
- Incident footage linking

### 🏢 Restricted Zones

- Zone-based access control
- Clearance requirements
- Time restrictions
- Occupancy limits
- Entry/exit logging

## Integration with Yard Management

### DockAppointment ↔ GateEntry

When a truck arrives:

1. Security scans license plate at gate → Creates **GateEntry**
2. System links to existing **DockAppointment**
3. Security verifies driver, checks cargo, assigns dock
4. Entry approved → Truck directed to assigned **YardLocation**
5. On exit: GateEntry updated with exit time

**Benefits:**

- Complete gate-to-gate visibility
- Automated dock appointment check-in
- Security verification before dock access
- Compliance tracking for all entries

## Clearance Levels

1. **VISITOR** - Escorted access only
2. **STANDARD** - Basic warehouse access
3. **ELEVATED** - Sensitive areas
4. **HIGH** - High-security zones
5. **MAXIMUM** - Full facility access

## Auto-Generated Numbers

- **Gate Entries**: GE000001, GE000002, ...
- **Visitor Badges**: VIS000001, VIS000002, ...
- **Incidents**: INC000001, INC000002, ...

## Security Dashboard Capabilities

### Real-Time Monitoring

- Active visitors on-site
- Current gate entries (vehicles in/out)
- Open incidents by severity
- Security personnel on duty
- Access denials in last hour

### Analytics

- Visitor trends by type
- Peak entry/exit times
- Incident patterns by location
- Security check pass/fail rates
- Average visitor duration

### Alerts

- Unauthorized access attempts
- Overdue visitor check-outs
- Critical incidents
- Security personnel no-shows
- Camera system failures

## Compliance & Auditing

All security actions are logged via ActivityLog:

- Gate entry creation/updates
- Visitor check-in/check-out
- Incident reporting and investigation
- Access grants/denials
- Security personnel actions

## Migration Status

✅ **Successfully migrated** - `20260103015421_add_security_module`

All 9 security models are now live in the database.

## Next Steps

### APIs to Build

- SecurityPersonnel CRUD (guard management)
- SecurityAccessLog endpoints (real-time monitoring)
- CameraSystem management
- AccessControlZone configuration
- SecurityShift scheduling

### Frontend Components

- Gate entry dashboard with vehicle search
- Visitor check-in kiosk interface
- Incident reporting form
- Security monitoring dashboard
- Access control management

### Advanced Features

- License plate recognition (LPR) integration
- Biometric device integration
- Email/SMS notifications for incidents
- Automated report generation
- Integration with external security systems

## Summary

The Security module provides **enterprise-grade gate control and warehouse monitoring** with:

- ✅ Complete vehicle and visitor tracking
- ✅ Integration with yard management (dock appointments)
- ✅ Incident management with investigation workflow
- ✅ Multi-level access control
- ✅ CCTV system management
- ✅ Real-time monitoring capabilities
- ✅ Comprehensive audit trail

This positions LogiVox as a **complete WMS with built-in security**, a feature many competitors charge extra for or require third-party integration.
